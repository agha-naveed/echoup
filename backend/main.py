import os
import json
from datetime import datetime
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI()

# Allow your Next.js app to communicate with FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://echoup.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Connection Manager to track active users
class ConnectionManager:
    def __init__(self):
        # Maps user_id -> their active WebSocket connection
        self.active_connections: dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        print(f"User {user_id} connected.")

    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
            print(f"User {user_id} disconnected.")

    async def send_personal_message(self, message: dict, user_id: str):
        # If the friend is currently online, send the message to their browser!
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_json(message)

manager = ConnectionManager()

# 3. The WebSocket Endpoint
@app.websocket("/ws/chat/{user_id}/{friend_id}")
async def chat_endpoint(websocket: WebSocket, user_id: str, friend_id: str):
    await manager.connect(websocket, user_id)
    
    try:
        while True:
            # A. Wait for a message from the React frontend
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # B. Format the data for Supabase
            new_db_message = {
                "sender_id": user_id,
                "receiver_id": friend_id,
                "text": message_data.get("text")
            }

            # C. Save to the database
            db_response = supabase.table("messages").insert(new_db_message).execute()
            saved_message = db_response.data[0]

            # D. Format the exact payload your Next.js ChatBox is expecting
            frontend_payload = {
                "id": saved_message["id"],
                "senderId": user_id,
                "text": saved_message["text"],
                "timestamp": saved_message["created_at"]
            }

            # E. Route the live message to the friend's ChatBox
            await manager.send_personal_message(frontend_payload, friend_id)
            
    except WebSocketDisconnect:
        manager.disconnect(user_id)
    except Exception as e:
        print(f"Error: {e}")
        manager.disconnect(user_id)