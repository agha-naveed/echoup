import os
import cv2
import numpy as np
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input

# 1. Initialize the pre-trained Computer Vision model
# include_top=False removes the classification layer so we get the raw feature vectors
# pooling='avg' flattens the output into a 1D array of 1280 numbers
print("Booting Visual Feature Extractor (MobileNetV2)...")
cv_model = MobileNetV2(weights='imagenet', include_top=False, input_shape=(224, 224, 3), pooling='avg')

def extract_video_features(video_url: str, num_frames: int = 5) -> list:
    """
    Streams a video, extracts keyframes, and returns a single visual embedding vector.
    """
    print(f"Analyzing visual data for: {video_url}")
    cap = cv2.VideoCapture(video_url)
    
    if not cap.isOpened():
        print("Error: Could not open video stream.")
        return []

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    if total_frames == 0:
        return []

    step = max(1, total_frames // num_frames)
    frames = []

    # 2. Extract and format the frames
    for i in range(num_frames):
        cap.set(cv2.CAP_PROP_POS_FRAMES, i * step)
        success, frame = cap.read()
        if success:
            # Resize to exactly 224x224 (required by MobileNetV2)
            frame_resized = cv2.resize(frame, (224, 224))
            # Convert OpenCV BGR to standard RGB
            frame_rgb = cv2.cvtColor(frame_resized, cv2.COLOR_BGR2RGB)
            frames.append(frame_rgb)

    cap.release()

    if not frames:
        return []

    # 3. Preprocess for the Neural Network
    frames_array = np.array(frames)
    frames_preprocessed = preprocess_input(frames_array)

    # 4. Generate Embeddings
    # This outputs a matrix of shape (5, 1280) - one vector per frame
    frame_embeddings = cv_model.predict(frames_preprocessed, verbose=0)

    # 5. Average the 5 frame vectors into a single vector for the entire video
    video_embedding = np.mean(frame_embeddings, axis=0)
    
    # Convert from a NumPy array to a standard Python list for Supabase/JSON compatibility
    return video_embedding.tolist()

# --- Execution Test ---
if __name__ == "__main__":
    # Testing with your verified Cloudinary upload
    test_url = "https://res.cloudinary.com/dpc7k1bpc/video/upload/v1786724431/dizupxlrqafbya002i6s.mp4"
    features = extract_video_features(test_url)
    
    if features:
        print(f"\nSuccess! Generated visual embedding vector.")
        print(f"Total Dimensions: {len(features)}") # Should be 1280
        print(f"Preview (First 5 values): {features[:5]}")