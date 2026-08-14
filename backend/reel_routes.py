# backend/reel_routes.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import numpy as np
from .reel_model import build_behavioral_model

# Create a router specifically for reels
router = APIRouter(prefix="/api/reels", tags=["Reel Algorithm"])

# Initialize model once when the route loads
cnn_model = build_behavioral_model()

class ReelInteraction(BaseModel):
    watch_pct: float
    loop_count: int
    liked: int
    commented: int
    dwell_time: float

class RankRequest(BaseModel):
    user_history: List[ReelInteraction]
    candidate_reels: List[str]

@router.post("/rank")
async def rank_feed(request: RankRequest):
    if len(request.user_history) != 10:
        raise HTTPException(status_code=400, detail="History must contain exactly 10 sequence steps.")

    # Convert to Numpy Tensor
    sequence_data = np.array([[
        i.watch_pct, i.loop_count, i.liked, i.commented, i.dwell_time
    ] for i in request.user_history])
    
    tensor_input = sequence_data.reshape(1, 10, 5)

    # Run inference
    base_score = cnn_model.predict(tensor_input)[0][0]

    # Rank the candidates
    ranked_reels = [{"reel_id": r_id, "score": float(base_score)} for r_id in request.candidate_reels]
    ranked_reels.sort(key=lambda x: x["score"], reverse=True)

    return {"ranked_feed": ranked_reels}