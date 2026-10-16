import os
import numpy as np
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
from tensorflow.keras.models import load_model 
from supabase import create_client, Client

from visual_engine import extract_video_features

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

router = APIRouter(prefix="/api/reels", tags=["Reel Algorithm"])

# 1. LOAD MODEL (Supports both v1 and v2)
cnn_model = None
for path in ["behavior_v2.h5", "reel_behavior_model.h5"]:
    if os.path.exists(path):
        try:
            print(f"🧠 Loading AI Model: {path}...")
            cnn_model = load_model(path)
            break
        except Exception as e:
            print(f"Error loading {path}: {e}")

if not cnn_model:
    print("⚠️ Warning: No trained CNN model found. Running heuristic fallback mode.")


# 2. BACKGROUND VISUAL EMBEDDING PIPELINE
class ProcessVideoRequest(BaseModel):
    post_id: str
    video_url: str

def process_and_save_embedding(post_id: str, video_url: str):
    try:
        embedding = extract_video_features(video_url)
        if embedding:
            supabase.table("posts").update({"visual_embedding": embedding}).eq("id", post_id).execute()
            print(f"✅ Saved 1280-D vector for post: {post_id}")
    except Exception as e:
        print(f"❌ Extraction error for {post_id}: {e}")

@router.post("/process_video")
def trigger_video_processing(request: ProcessVideoRequest, background_tasks: BackgroundTasks):
    background_tasks.add_task(process_and_save_embedding, request.post_id, request.video_url)
    return {"status": "processing", "message": "Visual extraction queued."}


# 3. UNIFIED USER FEED RECOMMENDATION ENDPOINT
class UserFeedRequest(BaseModel):
    user_id: str
    limit: Optional[int] = 10

@router.post("/feed")
def get_personalized_feed(request: UserFeedRequest):
    """
    Analyzes the user's historical telemetry in Supabase,
    runs the CNN behavioral model + pgvector visual matching,
    and returns a personalized ordered list of reel posts.
    """
    # A. Fetch candidate reels from Supabase
    posts_res = supabase.table("posts") \
        .select("id, content, video_url, subtitles_vtt, created_at, like_count, comment_count, author:users(id, username, first_name, last_name, profile_image)") \
        .eq("is_reel", True) \
        .order("created_at", desc=True) \
        .limit(40) \
        .execute()

    candidates = posts_res.data or []
    if not candidates:
        return {"reels": []}

    # B. Fetch the user's last 10 interactions from reel_interactions
    interactions_res = supabase.table("reel_interactions") \
        .select("post_id, watch_pct, loop_count, liked, commented, dwell_time, created_at") \
        .eq("user_id", request.user_id) \
        .order("created_at", desc=True) \
        .limit(10) \
        .execute()

    interactions = interactions_res.data or []

    # --- SCENARIO 1: COLD-START (New user or no interactions yet) ---
    if len(interactions) == 0 or not cnn_model:
        # Score candidates by organic engagement (likes + comments)
        def cold_score(item):
            likes = item.get("like_count") or 0
            comments = item.get("comment_count") or 0
            return (likes * 2) + (comments * 3)

        candidates.sort(key=cold_score, reverse=True)
        return {"reels": candidates[:request.limit], "mode": "cold_start"}

    # --- SCENARIO 2: AI PERSONALIZATION (CNN + Vector Similarity) ---
    # 1. Format sequence for 1D-CNN: [watch_pct, loop_count, liked, commented, dwell_time]
    seq = []
    for item in reversed(interactions):  # Chronological order
        seq.append([
            float(item.get("watch_pct", 0) or 0),
            float(item.get("loop_count", 0) or 0),
            1.0 if item.get("liked") else 0.0,
            1.0 if item.get("commented") else 0.0,
            float(item.get("dwell_time", 0) or 0)
        ])

    history_array = np.array(seq)
    if len(history_array) < 10:
        pad = np.zeros((10 - len(history_array), 5))
        history_array = np.vstack((pad, history_array))
    else:
        history_array = history_array[-10:]

    input_data = np.expand_dims(history_array, axis=0)
    user_engagement_score = float(cnn_model.predict(input_data, verbose=0)[0][0])

    # 2. Find the video the user watched the most (Target Reel)
    target_reel = max(interactions, key=lambda x: x.get("dwell_time", 0) or 0)
    target_reel_id = target_reel.get("post_id")

    # 3. Query pgvector for visual similarity
    visual_scores = {}
    if target_reel_id:
        try:
            target_post = supabase.table("posts").select("visual_embedding").eq("id", target_reel_id).execute()
            if target_post.data and target_post.data[0].get("visual_embedding"):
                target_vec = target_post.data[0]["visual_embedding"]
                sim_res = supabase.rpc("match_similar_reels", {
                    "query_embedding": target_vec,
                    "match_threshold": 0.0,
                    "match_count": 30
                }).execute()
                if sim_res.data:
                    for item in sim_res.data:
                        visual_scores[item["id"]] = item.get("similarity", 0.5)
        except Exception as e:
            print(f"Vector search skipped/failed: {e}")

    # 4. Blend scores: 40% user engagement propensity + 60% visual content match
    def blend_score(post):
        v_score = visual_scores.get(post["id"], 0.5)
        return (user_engagement_score * 0.4) + (v_score * 0.6)

    candidates.sort(key=blend_score, reverse=True)
    return {"reels": candidates[:request.limit], "mode": "ai_ranked"}