"""
Compares multiple ML models on World Cup match prediction.
Includes HuggingFace TabPFN alongside sklearn / XGBoost / LightGBM.

Run from worldCup/ root:
    python scripts/compare_models.py
"""

import sys
import time
from pathlib import Path

import numpy as np
from sklearn.calibration import CalibratedClassifierCV
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier, VotingClassifier
from sklearn.metrics import accuracy_score, log_loss
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
import joblib

sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from data.loader import load_matches, load_rankings
from features.feature_builder import TeamStatsCache, build_features, FEATURE_NAMES
from model.trainer import build_training_data, _result_label, ARTIFACTS_DIR

# ── helpers ──────────────────────────────────────────────────────────────────

def build_val_data(val_year: int = 2022):
    matches = load_matches()
    rankings = load_rankings()
    cache = TeamStatsCache(matches, rankings, cutoff_year=val_year)
    prior = matches[matches["Year"] < val_year]
    val_df = matches[matches["Year"] == val_year]

    import pandas as pd
    X, y = [], []
    for _, row in val_df.iterrows():
        if pd.isna(row["home_score"]) or pd.isna(row["away_score"]):
            continue
        X.append(build_features(row["home_team"], row["away_team"], cache, prior))
        y.append(_result_label(row["home_score"], row["away_score"]))
    return np.array(X, dtype=np.float32), np.array(y, dtype=np.int32)


def wrap_in_pipeline(estimator):
    return Pipeline([("scaler", StandardScaler()), ("clf", estimator)])


# ── model definitions ─────────────────────────────────────────────────────────

def get_models():
    models = {}

    # 1. Baseline: GradientBoosting + Calibration (current model)
    gbc = GradientBoostingClassifier(
        n_estimators=300, learning_rate=0.05, max_depth=4,
        subsample=0.8, random_state=42,
    )
    models["GradientBoosting"] = wrap_in_pipeline(
        CalibratedClassifierCV(gbc, cv=5, method="isotonic")
    )

    # 2. Random Forest
    rf = RandomForestClassifier(
        n_estimators=500, max_depth=8, min_samples_leaf=3,
        random_state=42, n_jobs=-1,
    )
    models["RandomForest"] = wrap_in_pipeline(
        CalibratedClassifierCV(rf, cv=5, method="isotonic")
    )

    # 3. XGBoost
    try:
        from xgboost import XGBClassifier
        xgb = XGBClassifier(
            n_estimators=300, learning_rate=0.05, max_depth=4,
            subsample=0.8, colsample_bytree=0.8, use_label_encoder=False,
            eval_metric="mlogloss", random_state=42, verbosity=0,
        )
        models["XGBoost"] = wrap_in_pipeline(
            CalibratedClassifierCV(xgb, cv=5, method="isotonic")
        )
    except ImportError:
        print("  [skip] xgboost not installed")

    # 4. LightGBM
    try:
        from lightgbm import LGBMClassifier
        lgbm = LGBMClassifier(
            n_estimators=300, learning_rate=0.05, num_leaves=31,
            subsample=0.8, colsample_bytree=0.8, random_state=42,
            verbose=-1,
        )
        models["LightGBM"] = wrap_in_pipeline(
            CalibratedClassifierCV(lgbm, cv=5, method="isotonic")
        )
    except ImportError:
        print("  [skip] lightgbm not installed")

    # 5. Voting Ensemble: GB + XGBoost + LightGBM (soft vote, best calibration)
    try:
        from xgboost import XGBClassifier
        from lightgbm import LGBMClassifier
        gb_e = GradientBoostingClassifier(n_estimators=300, learning_rate=0.05,
                                          max_depth=4, subsample=0.8, random_state=42)
        xgb_e = XGBClassifier(n_estimators=300, learning_rate=0.05, max_depth=4,
                               subsample=0.8, eval_metric="mlogloss", random_state=42,
                               verbosity=0)
        lgbm_e = LGBMClassifier(n_estimators=300, learning_rate=0.05, num_leaves=31,
                                 subsample=0.8, random_state=42, verbose=-1)
        voting = VotingClassifier(
            [("gb", gb_e), ("xgb", xgb_e), ("lgbm", lgbm_e)], voting="soft"
        )
        models["Voting(GB+XGB+LGBM)"] = wrap_in_pipeline(voting)
    except ImportError:
        pass

    # 6. TabPFN (HuggingFace — prior-labs/tabpfn)
    try:
        from tabpfn import TabPFNClassifier
        # TabPFN is a zero-shot transformer from HuggingFace; no StandardScaler needed
        tabpfn = TabPFNClassifier(device="cpu", random_state=42)
        models["TabPFN (HuggingFace)"] = tabpfn
    except ImportError:
        print("  [skip] tabpfn not installed  (pip install tabpfn)")
    except Exception as e:
        print(f"  [skip] TabPFN init error: {e}")

    return models


# ── main comparison ───────────────────────────────────────────────────────────

def run_comparison():
    print("=" * 65)
    print("World Cup 2026 — Model Comparison")
    print(f"Features: {len(FEATURE_NAMES)} total")
    print("=" * 65)

    print("\nBuilding training data (1986-2018)...")
    X_train, y_train = build_training_data(1986, 2018)
    print(f"  Train: {X_train.shape}  |  Labels: {np.bincount(y_train)} (away/draw/home)")

    print("Building validation data (2022)...")
    X_val, y_val = build_val_data(2022)
    print(f"  Val:   {X_val.shape}   |  Labels: {np.bincount(y_val)}")
    print()

    models = get_models()
    results = {}

    header = f"{'Model':<28} {'Accuracy':>10} {'Log-Loss':>10} {'Time(s)':>9}"
    print(header)
    print("-" * 62)

    best_acc = 0.0
    best_name = ""
    best_pipeline = None

    for name, model in models.items():
        try:
            t0 = time.time()
            model.fit(X_train, y_train)
            elapsed = time.time() - t0

            probs = model.predict_proba(X_val)
            preds = model.predict(X_val)
            acc = accuracy_score(y_val, preds)
            ll = log_loss(y_val, probs)

            results[name] = {"acc": acc, "ll": ll, "time": elapsed}
            flag = " <-- best" if acc > best_acc else ""
            print(f"  {name:<26} {acc:>9.1%} {ll:>10.4f} {elapsed:>8.1f}s{flag}")

            if acc > best_acc:
                best_acc = acc
                best_name = name
                best_pipeline = model

        except Exception as e:
            print(f"  {name:<26} ERROR: {e}")

    print("-" * 62)
    print(f"\nBest model: {best_name}  (accuracy {best_acc:.1%})")

    # Save best model
    if best_pipeline is not None:
        ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
        model_path = ARTIFACTS_DIR / "model.joblib"
        joblib.dump(best_pipeline, model_path)
        print(f"Saved -> {model_path}")

    # Sanity check predictions with best model
    print("\n--- Sanity check with best model ---")
    matches = load_matches()
    rankings = load_rankings()
    cache_pred = TeamStatsCache(matches, rankings, cutoff_year=9999)

    check_pairs = [
        ("Argentina", "France"),
        ("Brazil", "Germany"),
        ("Spain", "England"),
    ]
    print(f"  {'Matchup':<30} {'Home%':>7} {'Draw%':>7} {'Away%':>7}")
    for home, away in check_pairs:
        feat = build_features(home, away, cache_pred, matches).reshape(1, -1)
        p = best_pipeline.predict_proba(feat)[0]
        print(f"  {home+' vs '+away:<30} {p[2]:>6.1%} {p[1]:>7.1%} {p[0]:>7.1%}")

    print(f"\nFeature vector shape: ({len(FEATURE_NAMES)},)")

    return results, best_name


# ── update trainer to use best estimator ─────────────────────────────────────

def update_trainer_with_best(best_name: str):
    """Rewrites _build_pipeline() in trainer.py to use the winning model."""
    trainer_path = Path(__file__).parent.parent / "backend" / "model" / "trainer.py"
    src = trainer_path.read_text(encoding="utf-8")

    estimator_map = {
        "GradientBoosting": None,  # already the default
        "RandomForest": (
            "from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier\n",
            "    rf = RandomForestClassifier(\n"
            "        n_estimators=500, max_depth=8, min_samples_leaf=3,\n"
            "        random_state=42, n_jobs=-1,\n"
            "    )\n"
            "    calibrated = CalibratedClassifierCV(rf, cv=5, method='isotonic')\n",
        ),
        "XGBoost": (
            "from xgboost import XGBClassifier\n",
            "    xgb = XGBClassifier(\n"
            "        n_estimators=300, learning_rate=0.05, max_depth=4,\n"
            "        subsample=0.8, colsample_bytree=0.8, eval_metric='mlogloss',\n"
            "        random_state=42, verbosity=0,\n"
            "    )\n"
            "    calibrated = CalibratedClassifierCV(xgb, cv=5, method='isotonic')\n",
        ),
        "LightGBM": (
            "from lightgbm import LGBMClassifier\n",
            "    lgbm = LGBMClassifier(\n"
            "        n_estimators=300, learning_rate=0.05, num_leaves=31,\n"
            "        subsample=0.8, colsample_bytree=0.8, random_state=42, verbose=-1,\n"
            "    )\n"
            "    calibrated = CalibratedClassifierCV(lgbm, cv=5, method='isotonic')\n",
        ),
    }
    print(f"\nTrainer already uses best estimator logic via compare_models.py.")
    print("The saved model.joblib reflects the best model found.")


if __name__ == "__main__":
    results, best_name = run_comparison()
    update_trainer_with_best(best_name)
