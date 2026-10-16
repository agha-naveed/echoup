import os
import re
import tempfile
import requests
from collections import Counter
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from faster_whisper import WhisperModel

router = APIRouter()

# Load the quantized int8 model once when the server boots (~150MB RAM)
print("🎙️ Loading Faster-Whisper AI model...")
whisper_model = WhisperModel("base", device="cpu", compute_type="int8")

STOPWORDS = {
    "the", "and", "for", "that", "this", "with", "you", "not", "are", "from",
    "your", "all", "have", "new", "more", "was", "will", "can", "about", "what",
    "when", "just", "like", "know", "how", "get", "out", "really", "going", "here",
    "there", "they", "them", "then", "some", "into", "only", "other", "time", "very"
}

class TranscribeRequest(BaseModel):
    video_url: str

def format_vtt_timestamp(seconds: float) -> str:
    """Converts float seconds into WebVTT timestamp format (HH:MM:SS.mmm)."""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = seconds % 60
    return f"{hours:02d}:{minutes:02d}:{secs:06.3f}"

def generate_hashtags(transcript: str, max_tags: int = 5) -> list[str]:
    """Extracts top keywords from the transcript and formats them as hashtags."""
    words = re.findall(r"\b[a-zA-Z]{4,}\b", transcript.lower())
    filtered = [w for w in words if w not in STOPWORDS]
    most_common = [word for word, _ in Counter(filtered).most_common(max_tags)]
    return [f"#{word}" for word in most_common]

@router.post("/api/reels/transcribe")
def transcribe_reel(payload: TranscribeRequest):
    temp_path = None
    try:
        # 1. Stream the video from Cloudinary into a temporary local file
        response = requests.get(payload.video_url, stream=True, timeout=25)
        response.raise_for_status()

        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as temp_video:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    temp_video.write(chunk)
            temp_path = temp_video.name

        # 2. Transcribe audio and filter out non-speech silence/music gaps
        segments, info = whisper_model.transcribe(
            temp_path,
            beam_size=5,
            vad_filter=True,
        )

        # 3. Construct WebVTT subtitles and raw transcript
        vtt_lines = ["WEBVTT\n"]
        transcript_parts = []

        for segment in segments:
            start_ts = format_vtt_timestamp(segment.start)
            end_ts = format_vtt_timestamp(segment.end)
            clean_text = segment.text.strip()

            if clean_text:
                vtt_lines.append(f"{start_ts} --> {end_ts}\n{clean_text}\n")
                transcript_parts.append(clean_text)

        full_transcript = " ".join(transcript_parts)
        vtt_content = "\n".join(vtt_lines) if transcript_parts else None

        # 4. Generate hashtags and a suggested caption
        hashtags = generate_hashtags(full_transcript)
        first_sentence = full_transcript.split(".")[0].strip()
        
        if first_sentence and hashtags:
            suggested_caption = f"{first_sentence[:100]} {' '.join(hashtags)}"
        elif first_sentence:
            suggested_caption = first_sentence[:100]
        else:
            suggested_caption = " ".join(hashtags)

        return {
            "status": "success",
            "language": info.language,
            "transcript": full_transcript,
            "subtitles_vtt": vtt_content,
            "hashtags": hashtags,
            "suggested_caption": suggested_caption.strip()
        }

    except requests.RequestException as req_err:
        raise HTTPException(status_code=400, detail=f"Failed to download video: {str(req_err)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
    finally:
        # Always remove the temporary video file from disk
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)