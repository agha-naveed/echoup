import os
import numpy as np
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List
from tensorflow.keras.models import load_model 
from supabase import create_client, Client


# Import the extractor we just built!
from visual_engine import extract_video_features

# Load environment variables
load_dotenv()

# Initialize Supabase Python Client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


router = APIRouter(prefix="/api/reels", tags=["Reel Algorithm"])

# 1. LOAD THE TRAINED MODEL INTO MEMORY
MODEL_PATH = "reel_behavior_model.h5"

if os.path.exists(MODEL_PATH):
    print("Loading trained AI model...")
    cnn_model = load_model(MODEL_PATH)
else:
    print("Warning: No trained model found. Please run train.py first.")
    cnn_model = None

# 2. DEFINE THE INCOMING DATA STRUCTURE
class RankRequest(BaseModel):
    history: List[List[float]]  # Expecting shape [10, 5] (10 videos, 5 telemetry metrics)
    candidate_ids: List[str]    # The raw video IDs from Supabase

# 3. THE PREDICTION ENDPOINT
@router.post("/rank")
def rank_feed(request: RankRequest):
    if not cnn_model:
        raise HTTPException(status_code=500, detail="AI Model not loaded.")

    # A. Format the user's history for the 1D-CNN (Requires a 3D Numpy Array)
    # Pad or truncate history to exactly 10 steps so the math doesn't crash
    history_array = np.array(request.history)
    if len(history_array) < 10:
        # Pad with zeros if they are a new user
        padding = np.zeros((10 - len(history_array), 5))
        history_array = np.vstack((padding, history_array))
    elif len(history_array) > 10:
        # Take only the 10 most recent
        history_array = history_array[-10:]

    # Reshape for Keras: (batch_size, sequence_length, features) -> (1, 10, 5)
    input_data = np.expand_dims(history_array, axis=0)

    # B. Run the AI Prediction!
    # Predicts a float between 0.0 and 1.0 (How likely they are to engage right now)
    user_engagement_score = float(cnn_model.predict(input_data)[0][0])

    # C. Rank the Candidates
    # Note: Because this is Phase 1 (Behavioral Only), the AI only knows the USER's state. 
    # To rank different videos, we temporarily combine the user's AI score with a random baseline 
    # to simulate feed sorting until we extract visual video features in Phase 2.
    ranked_results = []
    for vid_id in request.candidate_ids:
        # The AI score boosts the ranking
        final_score = user_engagement_score + np.random.uniform(0.1, 0.5)
        ranked_results.append({
            "reel_id": vid_id,
            "score": final_score
        })

    # Sort highest score to lowest
    ranked_results.sort(key=lambda x: x["score"], reverse=True)

    return ranked_results



# --- NEW: VISUAL PROCESSING PIPELINE ---

class ProcessVideoRequest(BaseModel):
    post_id: str
    video_url: str

def process_and_save_embedding(post_id: str, video_url: str):
    """
    Runs in the background. Extracts the 1280-D vector and saves it to Supabase.
    """
    try:
        # 1. Extract the visual features using our OpenCV/MobileNet script
        embedding = extract_video_features(video_url)
        
        if not embedding:
            print(f"Extraction failed for post {post_id}")
            return
            
        # 2. Update the Supabase row with the vector
        response = supabase.table("posts").update({"visual_embedding": embedding}).eq("id", post_id).execute()
        
        print(f"Successfully saved 1280-D visual embedding for post: {post_id}")
    except Exception as e:
        print(f"Background processing error: {e}")

@router.post("/process_video")
def trigger_video_processing(request: ProcessVideoRequest, background_tasks: BackgroundTasks):
    # Add the heavy AI task to the background queue
    background_tasks.add_task(process_and_save_embedding, request.post_id, request.video_url)
    
    # Immediately return success to Next.js so the UI doesn't hang!
    return {"status": "processing", "message": "Visual extraction started in the background."}


# Update the RankRequest to optionally accept a target video
class RankRequest(BaseModel):
    history: List[List[float]] 
    candidate_ids: List[str]    
    target_reel_id: str = None  # NEW: The video the user just watched the longest

@router.post("/rank")
def rank_feed(request: RankRequest):
    # --- ENGINE 1: BEHAVIORAL (1D-CNN) ---
    user_engagement_score = 0.5 # Default baseline
    
    if cnn_model and len(request.history) > 0:
        history_array = np.array(request.history)
        if len(history_array) < 10:
            padding = np.zeros((10 - len(history_array), 5))
            history_array = np.vstack((padding, history_array))
        elif len(history_array) > 10:
            history_array = history_array[-10:]

        input_data = np.expand_dims(history_array, axis=0)
        user_engagement_score = float(cnn_model.predict(input_data, verbose=0)[0][0])


    # --- ENGINE 2: VISUAL (MobileNetV2 + pgvector) ---
    visual_scores = {}
    
    if request.target_reel_id:
        try:
            # 1. Fetch the 1280-D vector of the target video
            target_res = supabase.table("posts").select("visual_embedding").eq("id", request.target_reel_id).execute()
            
            if target_res.data and target_res.data[0].get("visual_embedding"):
                target_embedding = target_res.data[0]["visual_embedding"]
                
                # 2. Call the Supabase SQL function to find visually similar videos
                similar_res = supabase.rpc("match_similar_reels", {
                    "query_embedding": target_embedding,
                    "match_threshold": 0.0,
                    "match_count": 50 # Compare against the top 50 candidates
                }).execute()
                
                # 3. Map the similarity scores to the video IDs
                if similar_res.data:
                    for item in similar_res.data:
                        visual_scores[item["id"]] = item["similarity"]
        except Exception as e:
            print(f"Vector search failed: {e}")


    # --- ENGINE 3: THE SYNTHESIS ALGORITHM ---
    ranked_results = []
    
    for vid_id in request.candidate_ids:
        # If pgvector didn't find a visual match, give it a baseline of 0.5
        v_score = visual_scores.get(vid_id, 0.5) 
        
        # THE MAGIC FORMULA: Blend the AI scores.
        # Example: 40% weight to user mood (scroll speed), 60% to visual similarity
        final_score = (user_engagement_score * 0.4) + (v_score * 0.6)
        
        ranked_results.append({
            "reel_id": vid_id,
            "score": final_score
        })

    # Sort highest score to lowest
    ranked_results.sort(key=lambda x: x["score"], reverse=True)

    return ranked_results