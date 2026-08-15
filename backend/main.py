from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import your modular routers
from reel_routes import router as reel_router
from chat_routes import router as chat_router

app = FastAPI(title="Echo Up API Engine")

# Mount the modular endpoints
app.include_router(reel_router)
app.include_router(chat_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://echoup.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "Server running: Chat & Reel AI active"}
