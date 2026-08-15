import os
import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from tensorflow.keras.models import load_model 

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