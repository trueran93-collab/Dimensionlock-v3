from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from contextlib import asynccontextmanager
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    client.close()

app = FastAPI(title="Dimensionlock: The Endless API", lifespan=lifespan)
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


# ─── Meta-progression models ────────────────────────────────────────────────

class Unlocks(BaseModel):
    startHpBoost: int = 0       # +HP per level, max 5
    startSpBoost: int = 0       # +SP per level, max 5
    dashCharges:  int = 0       # extra dash charges, max 2
    ultStart:     int = 0       # starting ULT % charge, max 4 (each = +25%)


class BestRun(BaseModel):
    floor: int = 0
    score: int = 0
    kills: int = 0
    rank: str = '—'
    best_combo: int = 0


class PlayerProgress(BaseModel):
    session_id: str
    death_shards: int = 0
    unlocks: Unlocks = Field(default_factory=Unlocks)
    achievements: List[str] = Field(default_factory=list)
    best_run: BestRun = Field(default_factory=BestRun)
    total_runs: int = 0
    total_kills: int = 0
    total_floors_cleared: int = 0
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ProgressSavePayload(BaseModel):
    session_id: str
    death_shards: Optional[int] = None
    unlocks: Optional[Unlocks] = None
    achievements: Optional[List[str]] = None
    best_run: Optional[BestRun] = None
    total_runs: Optional[int] = None
    total_kills: Optional[int] = None
    total_floors_cleared: Optional[int] = None


# Cost table for unlocks (canonical source — frontend mirrors this)
UNLOCK_COSTS: Dict[str, List[int]] = {
    'startHpBoost': [25, 60, 120, 200, 320],   # 5 levels — +10 HP per level
    'startSpBoost': [20, 45, 90, 150, 240],    # 5 levels — +10 SP per level
    'dashCharges':  [80, 220],                 # 2 levels — +1 dash charge
    'ultStart':     [40, 100, 180, 280],       # 4 levels — +25% ULT charge each
}


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


# ── Meta-progression ──────────────────────────────────────────────────────

@api_router.get("/progress/{session_id}", response_model=PlayerProgress)
async def get_progress(session_id: str):
    doc = await db.player_progress.find_one({"session_id": session_id}, {"_id": 0})
    if not doc:
        # Brand new player — return zeroed progress without persisting yet
        return PlayerProgress(session_id=session_id)
    return PlayerProgress(**doc)


@api_router.post("/progress/save", response_model=PlayerProgress)
async def save_progress(payload: ProgressSavePayload):
    existing = await db.player_progress.find_one(
        {"session_id": payload.session_id}, {"_id": 0}
    )
    base: Dict[str, Any] = existing or PlayerProgress(session_id=payload.session_id).model_dump()

    if payload.death_shards is not None:        base["death_shards"] = max(0, int(payload.death_shards))
    if payload.unlocks is not None:             base["unlocks"] = payload.unlocks.model_dump()
    if payload.achievements is not None:
        merged = sorted(set((base.get("achievements") or []) + payload.achievements))
        base["achievements"] = merged
    if payload.best_run is not None:
        # Compare by floor → score → kills → best_combo so the better run wins on ties.
        prev = base.get("best_run") or BestRun().model_dump()
        new = payload.best_run.model_dump()
        prev_key = (
            prev.get("floor", 0),
            prev.get("score", 0),
            prev.get("kills", 0),
            prev.get("best_combo", 0),
        )
        new_key = (
            new.get("floor", 0),
            new.get("score", 0),
            new.get("kills", 0),
            new.get("best_combo", 0),
        )
        if new_key > prev_key:
            base["best_run"] = new
    if payload.total_runs is not None:          base["total_runs"] = max(base.get("total_runs", 0), int(payload.total_runs))
    if payload.total_kills is not None:         base["total_kills"] = max(base.get("total_kills", 0), int(payload.total_kills))
    if payload.total_floors_cleared is not None:
        base["total_floors_cleared"] = max(base.get("total_floors_cleared", 0), int(payload.total_floors_cleared))

    base["session_id"] = payload.session_id
    base["updated_at"] = datetime.now(timezone.utc).isoformat()

    await db.player_progress.update_one(
        {"session_id": payload.session_id},
        {"$set": base},
        upsert=True,
    )
    return PlayerProgress(**base)


class UnlockPurchasePayload(BaseModel):
    session_id: str
    unlock_id: str   # one of UNLOCK_COSTS keys


@api_router.post("/progress/purchase", response_model=PlayerProgress)
async def purchase_unlock(payload: UnlockPurchasePayload):
    if payload.unlock_id not in UNLOCK_COSTS:
        raise HTTPException(status_code=400, detail=f"Unknown unlock_id: {payload.unlock_id}")

    doc = await db.player_progress.find_one({"session_id": payload.session_id}, {"_id": 0})
    if not doc:
        doc = PlayerProgress(session_id=payload.session_id).model_dump()

    unlocks = doc.get("unlocks") or Unlocks().model_dump()
    current_level = int(unlocks.get(payload.unlock_id, 0))
    cost_tiers = UNLOCK_COSTS[payload.unlock_id]
    # 409 Conflict — the unlock is already at its terminal state
    if current_level >= len(cost_tiers):
        raise HTTPException(status_code=409, detail="Unlock already maxed")
    cost = cost_tiers[current_level]
    shards = int(doc.get("death_shards", 0))
    # 402 Payment Required — semantic match for "not enough currency"
    if shards < cost:
        raise HTTPException(
            status_code=402,
            detail=f"Not enough Death Shards (need {cost}, have {shards})"
        )

    unlocks[payload.unlock_id] = current_level + 1
    doc["unlocks"] = unlocks
    doc["death_shards"] = shards - cost
    doc["session_id"] = payload.session_id
    doc["updated_at"] = datetime.now(timezone.utc).isoformat()

    await db.player_progress.update_one(
        {"session_id": payload.session_id},
        {"$set": doc},
        upsert=True,
    )
    return PlayerProgress(**doc)


@api_router.get("/progress/{session_id}/leaderboard")
async def get_leaderboard(session_id: str):
    """Top 10 best runs across all players + the requesting player's rank if outside top 10."""
    cursor = db.player_progress.find(
        {"best_run.score": {"$gt": 0}},
        {"_id": 0, "session_id": 1, "best_run": 1}
    ).sort([("best_run.floor", -1), ("best_run.score", -1)]).limit(10)
    rows = await cursor.to_list(10)
    return {"top": rows, "session_id": session_id}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)
