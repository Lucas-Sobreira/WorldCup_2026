from __future__ import annotations

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import bracket, match, stats, team


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Warm up: ensure model artifact exists before accepting requests
    model_path = Path(__file__).parent / "model" / "artifacts" / "model.joblib"
    if not model_path.exists():
        print("Training model on startup...")
        from model.trainer import train_and_save
        train_and_save(verbose=True)
    else:
        # Pre-load model into memory
        from model.predictor import predict_match
        predict_match("Brazil", "Argentina")  # warm-up call
    yield


app = FastAPI(
    title="World Cup 2026 Predictor API",
    version="1.0.0",
    description="Predicts match outcomes and simulates the 2026 FIFA World Cup bracket.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://lucas-sobreira.github.io",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(bracket.router)
app.include_router(stats.router)
app.include_router(match.router)
app.include_router(team.router)


@app.get("/health")
def health():
    return {"status": "ok", "version": "1.0.0"}
