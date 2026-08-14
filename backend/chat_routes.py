# backend/chat_routes.py
import os
import json
import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from supabase import create_client, Client
from dotenv import load_dotenv

# Initialize Environment & Database here so it's self-contained
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Create the router for chat
router = APIRouter()

# Connection Manager (Multi-Device Support)
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        print(f"User {user_id} connected. Active devices: {len(self.active_connections[user_id])}")

    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if len(self.active_connections[user_id]) == 0:
                del self.active_connections[user_id]
            print(f"User {user_id} disconnected.")

    async def send_personal_message(self, message: dict, user_id: str):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                await connection.send_json(message)

manager = ConnectionManager()

def save_message_to_db(message_data: dict):
    return supabase.table("messages").insert(message_data).execute()

# Note: We use @router.websocket instead of @app.websocket
@router.websocket("/ws/chat/{user_id}/{friend_id}")
async def chat_endpoint(websocket: WebSocket, user_id: str, friend_id: str):
    await manager.connect(websocket, user_id)

    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)

            new_db_message = {
                "sender_id": user_id,
                "receiver_id": friend_id,
                "text": message_data.get("text")
            }

            db_response = await asyncio.to_thread(save_message_to_db, new_db_message)
            saved_message = db_response.data[0]

            frontend_payload = {
                "id": saved_message["id"],
                "senderId": user_id,
                "text": saved_message["text"],
                "timestamp": saved_message["created_at"]
            }

            await manager.send_personal_message(frontend_payload, friend_id)
            await manager.send_personal_message(frontend_payload, user_id)

    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
    except Exception as e:
        print(f"Error: {e}")
        manager.disconnect(websocket, user_id)