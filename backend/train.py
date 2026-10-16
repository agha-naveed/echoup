# backend/train.py
import os
import numpy as np
import pandas as pd
from supabase import create_client
from dotenv import load_dotenv
from reel_model import build_behavioral_model

# Load environment variables
load_dotenv()
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

def fetch_and_prepare_data():
    print("Fetching telemetry logs from Supabase...")
    response = supabase.table("reel_interactions").select("*").execute()
    df = pd.DataFrame(response.data)

    if len(df) < 15:
        print("Not enough data to train yet! Go scroll through a few reels first.")
        return None, None

    # Sort chronologically
    df = df.sort_values(by=['user_id', 'created_at'])

    X, y = [], []
    
    # Group by user to prevent mixing different people's histories
    for user_id, group in df.groupby('user_id'):
        features = group[['watch_pct', 'loop_count', 'liked', 'commented', 'dwell_time']].values
        
        # Sliding window: Use 10 videos to predict the 11th
        for i in range(len(features) - 10):
            X.append(features[i : i + 10])
            
            # The "Target" (11th video). 
            # If they watched > 80%, liked it, or commented, we consider it a successful recommendation (1).
            target = features[i + 10]
            is_good_recommendation = 1 if (target[0] >= 0.8 or target[2] == 1 or target[3] == 1) else 0
            y.append(is_good_recommendation)

    return np.array(X), np.array(y)

def train_and_save():
    X, y = fetch_and_prepare_data()
    
    if X is None or len(X) == 0:
        print("Skipping training. Generate more data first!")
        return

    print(f"Training on {len(X)} behavioral sequences...")
    
    # Load your untrained 1D-CNN architecture
    model = build_behavioral_model()
    
    # Train the model
    model.fit(X, y, epochs=10, batch_size=8, validation_split=0.2)
    
    # Save the smart model!
    model.save("reel_behavior_model.h5")
    print("Model successfully saved as reel_behavior_model.h5")

if __name__ == "__main__":
    train_and_save()