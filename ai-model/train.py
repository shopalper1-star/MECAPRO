import pandas as pd
import numpy as np
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OrdinalEncoder, LabelEncoder
from sklearn.feature_extraction.text import TfidfVectorizer
from xgboost import XGBClassifier, XGBRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, mean_absolute_error
import joblib
import json
import os

print("=" * 55)
print("  AUTO REPAIR AI - Training Pipeline")
print("=" * 55)

# 1. LOAD
df = pd.read_csv("data/finaldataset.csv")
print(f"Loaded {len(df)} rows")

# 2. DEFINE COLUMNS
# NOTE: probable_cause excluded from classifier — it would cause 100% accuracy
TEXT_COL  = "symptoms"
CAT_COLS  = ["vehicle_type", "make", "model", "fuel_type",
             "transmission", "severity_level"]
NUM_COLS  = ["year", "vehicle_age_years", "mileage",
             "engine_size_cc", "symptom_count"]

# Cost models keep probable_cause — fine for price prediction, not the target label
COST_CATS = ["vehicle_type", "severity_level", "probable_cause"]
COST_NUMS = ["year", "vehicle_age_years", "mileage",
             "engine_size_cc", "symptom_count"]

X_all    = df[CAT_COLS + NUM_COLS + [TEXT_COL]]
X_cost   = df[COST_CATS + COST_NUMS]
y_min    = df["estimated_cost_min_mad"]
y_max    = df["estimated_cost_max_mad"]

le = LabelEncoder()
y_repair = le.fit_transform(df["repair_type"])

# 3. SPLIT 80/20
X_train,  X_test,  yr_train, yr_test = train_test_split(X_all,  y_repair, test_size=0.2, random_state=42)
Xc_train, Xc_test, ym_train, ym_test = train_test_split(X_cost, y_min,    test_size=0.2, random_state=42)
_,        _,       yx_train, yx_test = train_test_split(X_cost, y_max,    test_size=0.2, random_state=42)
print(f"Train: {len(X_train)} | Test: {len(X_test)}")

# 4. PREPROCESSORS
repair_preprocessor = ColumnTransformer(transformers=[
    ("tfidf", TfidfVectorizer(ngram_range=(1,2), max_features=300), TEXT_COL),
    ("cat",   OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1), CAT_COLS),
    ("num",   "passthrough", NUM_COLS),
], remainder="drop")

cost_preprocessor = ColumnTransformer(transformers=[
    ("cat", OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1), COST_CATS),
    ("num", "passthrough", COST_NUMS),
], remainder="drop")

# 5. PIPELINES
repair_pipeline = Pipeline([
    ("pre",   repair_preprocessor),
    ("model", XGBClassifier(
        n_estimators=300,
        max_depth=5,          # shallower tree = less memorization
        learning_rate=0.1,
        subsample=0.7,        # more dropout = less overfitting
        colsample_bytree=0.7,
        min_child_weight=5,   # requires more samples per leaf
        eval_metric="mlogloss",
        random_state=42,
        n_jobs=-1,
    ))
])

cost_min_pipeline = Pipeline([
    ("pre",   cost_preprocessor),
    ("model", XGBRegressor(
        n_estimators=500, max_depth=8, learning_rate=0.05,
        subsample=0.8, colsample_bytree=0.8,
        random_state=42, n_jobs=-1,
    ))
])

cost_max_pipeline = Pipeline([
    ("pre",   cost_preprocessor),
    ("model", XGBRegressor(
        n_estimators=500, max_depth=8, learning_rate=0.05,
        subsample=0.8, colsample_bytree=0.8,
        random_state=42, n_jobs=-1,
    ))
])

# 6. TRAIN
print("Training repair classifier...")
repair_pipeline.fit(X_train, yr_train)
print("Training cost min regressor...")
cost_min_pipeline.fit(Xc_train, ym_train)
print("Training cost max regressor...")
cost_max_pipeline.fit(Xc_train, yx_train)

# 7. EVALUATE
acc     = accuracy_score(yr_test, repair_pipeline.predict(X_test)) * 100
mae_min = mean_absolute_error(ym_test, cost_min_pipeline.predict(Xc_test))
mae_max = mean_absolute_error(yx_test, cost_max_pipeline.predict(Xc_test))
print(f"\nRepair Accuracy : {acc:.1f}%")
print(f"Cost Min MAE    : {mae_min:.0f} MAD")
print(f"Cost Max MAE    : {mae_max:.0f} MAD")

# 8. TOP-3 CONFIDENCE SAMPLE
proba = repair_pipeline.predict_proba(X_test)
top3  = np.argsort(proba[0])[::-1][:3]
print("\nSample top-3 predictions (first test row):")
for i, idx in enumerate(top3):
    print(f"  #{i+1} {le.inverse_transform([idx])[0]} - {proba[0][idx]*100:.1f}%")

# 9. SAVE
os.makedirs("models", exist_ok=True)
joblib.dump(repair_pipeline,   "models/repair_model.pkl")
joblib.dump(cost_min_pipeline, "models/cost_min_model.pkl")
joblib.dump(cost_max_pipeline, "models/cost_max_model.pkl")
joblib.dump(le,                "models/label_encoder.pkl")

with open("models/repair_classes.json", "w") as f:
    json.dump(le.classes_.tolist(), f)

options = {
    "vehicle_type":    sorted(df["vehicle_type"].unique().tolist()),
    "make":            sorted(df["make"].unique().tolist()),
    "fuel_type":       sorted(df["fuel_type"].unique().tolist()),
    "transmission":    sorted(df["transmission"].unique().tolist()),
    "severity_level":  sorted(df["severity_level"].unique().tolist()),
    "symptoms":        sorted(list(set(
        s.strip() for row in df["symptoms"] for s in row.split(",")
    ))),
    "probable_causes": sorted(df["probable_cause"].unique().tolist()),
    "symptom_to_causes": (
        df.assign(symptom_split=df["symptoms"].str.split(", "))
        .explode("symptom_split")
        .groupby("symptom_split")["probable_cause"]
        .unique().apply(sorted).apply(list).to_dict()
    )
}
with open("models/options.json", "w") as f:
    json.dump(options, f, indent=2, ensure_ascii=False)

print("\nAll models saved to /models/")
print("Run: python app.py")