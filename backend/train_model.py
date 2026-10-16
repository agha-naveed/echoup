import os
import numpy as np
import pandas as pd
import tensorflow as tf
from supabase import create_client, Client
from dotenv import load_dotenv
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv1D, MaxPooling1D, Flatten, Dense, Dropout

# ==========================================
# 1. CONNECT TO SUPABASE
# ==========================================
# Replace with your actual Supabase credentials

load_dotenv()
supabase: Client = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

print("📡 Fetching real telemetry data from Supabase...")
response = supabase.table("reel_interactions").select("*").order("created_at", desc=False).execute()
df = pd.DataFrame(response.data)

if len(df) < 20:
    print("⚠️ Not enough data to train yet! Go scroll through some more videos.")
    exit()

print(f"✅ Harvested {len(df)} real user interactions!")

# ==========================================
# 2. CALCULATE THE "TRUE" ENGAGEMENT SCORE (Y-LABEL)
# ==========================================
# We need to teach the AI what a "good" video is. 
# We calculate a score from 0.0 to 1.0 based on what they actually did.
def calculate_engagement(row):
    score = 0.0
    score += min(row['watch_pct'], 1.0) * 0.4  # Watching the whole thing = 40%
    score += min(row['loop_count'], 3) * 0.1   # Looping up to 3 times = 30%
    if row['liked'] == 1: score += 0.2         # Liking = 20%
    if row['commented'] == 1: score += 0.1     # Commenting = 10%
    return min(score, 1.0)

df['target_score'] = df.apply(calculate_engagement, axis=1)

# ==========================================
# 3. BUILD THE SLIDING WINDOWS (X: Inputs, Y: Targets)
# ==========================================
# The CNN expects exactly 10 historical videos to predict the 11th.
SEQUENCE_LENGTH = 10
X_train, y_train = [], []

# Group data by user so we don't mix different users' histories
grouped = df.groupby('user_id')

for user_id, group in grouped:
    # Extract just the 5 features the CNN looks at
    features = group[['watch_pct', 'loop_count', 'liked', 'commented', 'dwell_time']].values
    targets = group['target_score'].values
    
    # Slide a window over the user's history
    for i in range(len(features) - SEQUENCE_LENGTH):
        X_train.append(features[i : i + SEQUENCE_LENGTH]) # The 10 watched videos
        y_train.append(targets[i + SEQUENCE_LENGTH])      # The engagement of the 11th video

X_train = np.array(X_train)
y_train = np.array(y_train)

print(f"🧠 Built {len(X_train)} training sequences (Shape: {X_train.shape})")

# ==========================================
# 4. BUILD & COMPILE THE 1D-CNN
# ==========================================
print("🏗️ Constructing the Neural Network...")
model = Sequential([
    # Conv1D looks for patterns across the 10 sequential interactions
    Conv1D(filters=32, kernel_size=3, activation='relu', input_shape=(SEQUENCE_LENGTH, 5)),
    MaxPooling1D(pool_size=2),
    
    Conv1D(filters=64, kernel_size=3, activation='relu'),
    MaxPooling1D(pool_size=2),
    
    Flatten(),
    Dense(64, activation='relu'),
    Dropout(0.3), # Prevents the model from memorizing the data
    Dense(1, activation='sigmoid') # Outputs a final score between 0 and 1
])

model.compile(optimizer='adam', loss='mse', metrics=['mae'])

# ==========================================
# 5. TRAIN THE BRAIN
# ==========================================
print("🚀 Initiating Training Sequence...")
model.fit(
    X_train, 
    y_train, 
    epochs=20, 
    batch_size=8, 
    validation_split=0.2 # Holds back 20% of data to test itself
)

# ==========================================
# 6. EXPORT THE NEW BRAIN
# ==========================================
NEW_MODEL_NAME = "behavior_v2.h5"
model.save(NEW_MODEL_NAME)
print(f"\n🎉 SUCCESS! New AI brain saved as '{NEW_MODEL_NAME}'.")
print("Hot-swap this file into your FastAPI server to upgrade your app's intelligence!")