from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Annotated
from bson import ObjectId
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="Dimensionlock: The Endless API")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# ─── Models ─────────────────────────────────────────────────────────────────

class ScoreSubmit(BaseModel):
    player_name: str
    score: int
    floor: int
    kills: int


class ScoreRecord(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    player_name: str
    score: int
    floor: int
    kills: int
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# ─── Routes ─────────────────────────────────────────────────────────────────

@api_router.get("/")
async def root():
    return {"message": "Dimensionlock: The Endless API", "status": "ok"}


@api_router.post("/scores", response_model=ScoreRecord)
async def submit_score(data: ScoreSubmit):
    record = ScoreRecord(
        player_name=data.player_name,
        score=data.score,
        floor=data.floor,
        kills=data.kills
    )
    doc = record.model_dump()
    await db.scores.insert_one(doc)
    return record


@api_router.get("/scores/top", response_model=List[ScoreRecord])
async def get_top_scores():
    docs = await db.scores.find({}, {"_id": 0}).sort("score", -1).limit(10).to_list(10)
    return [ScoreRecord(**d) for d in docs]


@api_router.get("/health")
async def health():
    return {"status": "healthy", "game": "Dimensionlock: The Endless"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
