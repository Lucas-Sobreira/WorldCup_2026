"""
Builds the training dataset and trains the ML pipeline.

Target labels:
  0 = away win  (home_score < away_score after 90min + ET)
  1 = draw      (scores level after 90min + ET, i.e. went to pens)
  2 = home win  (home_score > away_score after 90min + ET)

Temporal split:
  Train : 1986 – 2018  (avoid pre-1986 era: too few subs, no red cards)
  Validate : 2022
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import log_loss
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
import joblib

from data.loader import load_matches, load_rankings
from features.feature_builder import TeamStatsCache, build_features, FEATURE_NAMES

ARTIFACTS_DIR = Path(__file__).parent / "artifacts"
MODEL_PATH = ARTIFACTS_DIR / "model.joblib"

_TRAIN_FROM = 1986
_TRAIN_TO = 2018
_VAL_YEAR = 2022


def _result_label(home_score: float, away_score: float) -> int:
    if home_score > away_score:
        return 2
    if home_score == away_score:
        return 1
    return 0


def build_training_data(
    year_from: int = _TRAIN_FROM,
    year_to: int = _TRAIN_TO,
) -> tuple[np.ndarray, np.ndarray]:
    """
    Builds X (n_samples, 26) and y (n_samples,) using a temporally-correct
    TeamStatsCache per tournament year to avoid data leakage.
    """
    matches = load_matches()
    rankings = load_rankings()

    training_years = sorted(
        y for y in matches["Year"].unique() if year_from <= y <= year_to
    )

    X_rows: list[np.ndarray] = []
    y_labels: list[int] = []

    for year in training_years:
        # Stats computed exclusively from data BEFORE this year
        cache = TeamStatsCache(matches, rankings, cutoff_year=year)
        prior = matches[matches["Year"] < year]
        year_df = matches[matches["Year"] == year]

        for _, row in year_df.iterrows():
            if pd.isna(row["home_score"]) or pd.isna(row["away_score"]):
                continue
            feat = build_features(row["home_team"], row["away_team"], cache, prior)
            X_rows.append(feat)
            y_labels.append(_result_label(row["home_score"], row["away_score"]))

    return np.array(X_rows, dtype=np.float32), np.array(y_labels, dtype=np.int32)


def _build_pipeline() -> Pipeline:
    gbc = GradientBoostingClassifier(
        n_estimators=300,
        learning_rate=0.05,
        max_depth=4,
        subsample=0.8,
        random_state=42,
    )
    calibrated = CalibratedClassifierCV(gbc, cv=5, method="isotonic")
    return Pipeline([
        ("scaler", StandardScaler()),
        ("clf", calibrated),
    ])


def train_and_save(verbose: bool = True) -> Pipeline:
    """Train, evaluate on 2022, and persist model to artifacts/."""
    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

    X_train, y_train = build_training_data(_TRAIN_FROM, _TRAIN_TO)

    if verbose:
        print(f"Training on {len(X_train)} matches ({_TRAIN_FROM}–{_TRAIN_TO})")

    pipeline = _build_pipeline()
    pipeline.fit(X_train, y_train)

    # Evaluate on 2022 (held-out year)
    matches = load_matches()
    rankings = load_rankings()
    cache_val = TeamStatsCache(matches, rankings, cutoff_year=_VAL_YEAR)
    prior_val = matches[matches["Year"] < _VAL_YEAR]
    val_df = matches[matches["Year"] == _VAL_YEAR]

    X_val, y_val = [], []
    for _, row in val_df.iterrows():
        if pd.isna(row["home_score"]) or pd.isna(row["away_score"]):
            continue
        feat = build_features(row["home_team"], row["away_team"], cache_val, prior_val)
        X_val.append(feat)
        y_val.append(_result_label(row["home_score"], row["away_score"]))

    X_val_arr = np.array(X_val, dtype=np.float32)
    y_val_arr = np.array(y_val, dtype=np.int32)

    if len(y_val_arr) > 0:
        probs = pipeline.predict_proba(X_val_arr)
        ll = log_loss(y_val_arr, probs)
        acc = (pipeline.predict(X_val_arr) == y_val_arr).mean()
        if verbose:
            print(f"Validation 2022 -> log-loss: {ll:.4f} | accuracy: {acc:.3f} ({len(y_val_arr)} matches)")

    joblib.dump(pipeline, MODEL_PATH)
    if verbose:
        print(f"Model saved -> {MODEL_PATH}")

    return pipeline


if __name__ == "__main__":
    train_and_save(verbose=True)
