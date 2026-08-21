import os, json, pickle, webbrowser
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score, classification_report,
    confusion_matrix, mean_absolute_error, r2_score
)
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots

# ── Paths ──────────────────────────────────────────────────────────────────────
BASE      = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE, "data", "finaldataset.csv")
MODELS    = os.path.join(BASE, "models")

# ── Load models ────────────────────────────────────────────────────────────────
print("Loading models...")
import joblib
repair_model   = joblib.load(os.path.join(MODELS, "repair_model.pkl"))
cost_min_model = joblib.load(os.path.join(MODELS, "cost_min_model.pkl"))
cost_max_model = joblib.load(os.path.join(MODELS, "cost_max_model.pkl"))
le             = joblib.load(os.path.join(MODELS, "label_encoder.pkl"))

# ── Load & split data ──────────────────────────────────────────────────────────
print("Loading dataset...")
df = pd.read_csv(DATA_PATH)

# Recreate derived fields (same as app.py)
CURRENT_YEAR = 2025
df["vehicle_age_years"] = CURRENT_YEAR - df["year"]
df["symptom_count"]     = df["symptoms"].apply(lambda s: len(str(s).split(",")))

# Features — must match train.py exactly
CAT_COLS  = ["vehicle_type", "make", "model", "fuel_type", "transmission", "severity_level"]
NUM_COLS  = ["year", "vehicle_age_years", "mileage", "engine_size_cc", "symptom_count"]
TEXT_COL  = "symptoms"
REPAIR_FEATURES = CAT_COLS + NUM_COLS + [TEXT_COL]

COST_CATS = ["vehicle_type", "severity_level", "probable_cause"]
COST_NUMS = ["year", "vehicle_age_years", "mileage", "engine_size_cc", "symptom_count"]
COST_FEATURES = COST_CATS + COST_NUMS

TARGET_REPAIR    = "repair_type"
TARGET_COST_MIN  = "estimated_cost_min_mad"
TARGET_COST_MAX  = "estimated_cost_max_mad"

# Drop rows with missing values in needed columns
needed = list(set(REPAIR_FEATURES + COST_FEATURES + [TARGET_REPAIR, TARGET_COST_MIN, TARGET_COST_MAX]))
df = df.dropna(subset=needed)

X_repair = df[REPAIR_FEATURES]
y_repair = le.transform(df[TARGET_REPAIR])   # use the loaded LabelEncoder

X_cost   = df[COST_FEATURES]
y_min    = df[TARGET_COST_MIN]
y_max    = df[TARGET_COST_MAX]

# 80/20 split — same random_state as train.py
Xr_tr, Xr_te, yr_tr, yr_te = train_test_split(X_repair, y_repair, test_size=0.2, random_state=42)
Xc_tr, Xc_te, ym_tr, ym_te = train_test_split(X_cost,   y_min,    test_size=0.2, random_state=42)
_,     _,     yx_tr, yx_te = train_test_split(X_cost,   y_max,    test_size=0.2, random_state=42)

# Decode back to string labels for reporting
yr_te_labels   = le.inverse_transform(yr_te)
yr_pred_labels = le.inverse_transform(repair_model.predict(Xr_te))

# ── Evaluate classifier ────────────────────────────────────────────────────────
print("Evaluating repair classifier...")
yr_pred   = repair_model.predict(Xr_te)
yr_proba  = repair_model.predict_proba(Xr_te)

overall_acc  = accuracy_score(yr_te, yr_pred)
top1_conf    = yr_proba.max(axis=1)
top3_correct = np.mean([
    yr_te[i] in np.argsort(-yr_proba[i])[:3]
    for i in range(len(yr_te))
])

report = classification_report(yr_te_labels, yr_pred_labels, output_dict=True)
classes = le.classes_.tolist()

per_class = {
    cls: {
        "precision": report[cls]["precision"],
        "recall":    report[cls]["recall"],
        "f1":        report[cls]["f1-score"],
        "support":   report[cls]["support"],
    }
    for cls in classes if cls in report
}

cm = confusion_matrix(yr_te_labels, yr_pred_labels, labels=classes)

# ── Evaluate cost regressors ───────────────────────────────────────────────────
print("Evaluating cost regressors...")
ymin_pred = cost_min_model.predict(Xc_te)
ymax_pred = cost_max_model.predict(Xc_te)

mae_min = mean_absolute_error(ym_te, ymin_pred)
mae_max = mean_absolute_error(yx_te, ymax_pred)
r2_min  = r2_score(ym_te, ymin_pred)
r2_max  = r2_score(yx_te, ymax_pred)

residuals_min = ym_te.values - ymin_pred
residuals_max = yx_te.values - ymax_pred

print(f"\n  Classifier accuracy : {overall_acc:.4f}")
print(f"  Top-3 accuracy      : {top3_correct:.4f}")
print(f"  Avg top-1 confidence: {top1_conf.mean():.4f}")
print(f"  Cost-Min  MAE={mae_min:.1f}  R²={r2_min:.4f}")
print(f"  Cost-Max  MAE={mae_max:.1f}  R²={r2_max:.4f}")

# ── Build Plotly dashboard ─────────────────────────────────────────────────────
print("\nBuilding interactive dashboard...")

ACCENT  = "#00ffa3"
ORANGE  = "#ff6b35"
BLUE    = "#3b82f6"
BG      = "#0a0e1a"
CARD    = "#111820"
BORDER  = "#1c2a3a"
MUTED   = "#4a6080"
TEXT    = "#e2eaf4"

layout_base = dict(
    paper_bgcolor=BG, plot_bgcolor=CARD,
    font=dict(family="monospace", color=TEXT, size=11),
    margin=dict(t=40, b=40, l=40, r=20),
)

# Short names for labels
short = [c.replace("Replace ","").replace("Fix ","") for c in classes]

figs = []

# ── Fig 1: Per-class F1 horizontal bar ────────────────────────────────────────
f1_vals = [per_class[c]["f1"] for c in classes]
colors  = [ACCENT if v >= 0.90 else BLUE if v >= 0.84 else ORANGE for v in f1_vals]
order   = np.argsort(f1_vals)

fig1 = go.Figure(go.Bar(
    x=[f1_vals[i] for i in order],
    y=[short[i]   for i in order],
    orientation="h",
    marker_color=[colors[i] for i in order],
    text=[f"{f1_vals[i]:.3f}" for i in order],
    textposition="outside",
    hovertemplate="<b>%{y}</b><br>F1: %{x:.3f}<extra></extra>",
))
fig1.update_layout(**layout_base,
    title=dict(text="F1-Score per Repair Class", font=dict(size=14, color=TEXT)),
    xaxis=dict(range=[0, 1.05], gridcolor=BORDER, title="F1-Score"),
    yaxis=dict(gridcolor=BORDER),
    height=550,
)
figs.append(("Per-Class F1 Score", fig1))

# ── Fig 2: Precision / Recall / F1 grouped ────────────────────────────────────
fig2 = go.Figure()
metrics = {"Precision": "precision", "Recall": "recall", "F1": "f1"}
mc = [ACCENT, BLUE, ORANGE]
for (label, key), color in zip(metrics.items(), mc):
    vals = [per_class[c][key] for c in classes]
    fig2.add_trace(go.Bar(name=label, x=short, y=vals,
        marker_color=color, opacity=0.85,
        hovertemplate=f"<b>%{{x}}</b><br>{label}: %{{y:.3f}}<extra></extra>",
    ))
fig2.update_layout(**layout_base,
    title=dict(text="Precision / Recall / F1 by Class", font=dict(size=14, color=TEXT)),
    barmode="group",
    xaxis=dict(tickangle=-40, gridcolor=BORDER),
    yaxis=dict(range=[0, 1.05], gridcolor=BORDER, title="Score"),
    legend=dict(bgcolor=CARD, bordercolor=BORDER),
    height=420,
)
figs.append(("Precision / Recall / F1", fig2))

# ── Fig 3: Confidence distribution histogram ──────────────────────────────────
fig3 = go.Figure(go.Histogram(
    x=top1_conf, nbinsx=30,
    marker_color=ACCENT, opacity=0.8,
    hovertemplate="Confidence: %{x:.2f}<br>Count: %{y}<extra></extra>",
))
fig3.add_vline(x=top1_conf.mean(), line_dash="dash", line_color=ORANGE,
               annotation_text=f"mean={top1_conf.mean():.2f}", annotation_font_color=ORANGE)
fig3.update_layout(**layout_base,
    title=dict(text="Top-1 Prediction Confidence Distribution", font=dict(size=14, color=TEXT)),
    xaxis=dict(title="Confidence (probability)", gridcolor=BORDER),
    yaxis=dict(title="# Samples", gridcolor=BORDER),
    height=360,
)
figs.append(("Confidence Distribution", fig3))

# ── Fig 4: Confusion matrix heatmap ───────────────────────────────────────────
# Normalize rows so color = recall per class
cm_norm = cm.astype(float) / cm.sum(axis=1, keepdims=True)

fig4 = go.Figure(go.Heatmap(
    z=cm_norm, x=short, y=short,
    colorscale=[[0, BG],[0.5,"#1e3a5f"],[1, ACCENT]],
    hovertemplate="True: <b>%{y}</b><br>Pred: <b>%{x}</b><br>Rate: %{z:.2f}<extra></extra>",
    showscale=True,
))
fig4.update_layout(**layout_base,
    title=dict(text="Confusion Matrix (normalized by row = recall)", font=dict(size=14, color=TEXT)),
    xaxis=dict(title="Predicted", tickangle=-40, gridcolor=BORDER),
    yaxis=dict(title="True label", gridcolor=BORDER, autorange="reversed"),
    height=600,
)
figs.append(("Confusion Matrix", fig4))

# ── Fig 5: Cost regressor — actual vs predicted scatter ───────────────────────
fig5 = make_subplots(rows=1, cols=2,
    subplot_titles=["Cost-Min: Actual vs Predicted", "Cost-Max: Actual vs Predicted"])

sample = min(500, len(ym_te))
idx = np.random.choice(len(ym_te), sample, replace=False)

fig5.add_trace(go.Scatter(
    x=ym_te.values[idx], y=ymin_pred[idx], mode="markers",
    marker=dict(color=BLUE, size=5, opacity=0.6),
    hovertemplate="Actual: %{x}<br>Pred: %{y}<extra></extra>",
    name="Cost-Min",
), row=1, col=1)

fig5.add_trace(go.Scatter(
    x=yx_te.values[idx], y=ymax_pred[idx], mode="markers",
    marker=dict(color=ORANGE, size=5, opacity=0.6),
    hovertemplate="Actual: %{x}<br>Pred: %{y}<extra></extra>",
    name="Cost-Max",
), row=1, col=2)

# Perfect-prediction diagonal
for col, vals in [(1, ym_te), (2, yx_te)]:
    lo, hi = vals.min(), vals.max()
    fig5.add_trace(go.Scatter(x=[lo,hi], y=[lo,hi], mode="lines",
        line=dict(color=ACCENT, dash="dash", width=1), showlegend=False,
    ), row=1, col=col)

fig5.update_layout(**layout_base,
    title=dict(text=f"Cost Regressors — Actual vs Predicted  (MAE min={mae_min:.0f} MAD, max={mae_max:.0f} MAD)",
               font=dict(size=14, color=TEXT)),
    height=420,
)
figs.append(("Cost: Actual vs Predicted", fig5))

# ── Fig 6: Residuals distribution ─────────────────────────────────────────────
fig6 = go.Figure()
fig6.add_trace(go.Histogram(x=residuals_min, nbinsx=40, name="Cost-Min residuals",
    marker_color=BLUE, opacity=0.7))
fig6.add_trace(go.Histogram(x=residuals_max, nbinsx=40, name="Cost-Max residuals",
    marker_color=ORANGE, opacity=0.7))
fig6.add_vline(x=0, line_dash="dash", line_color=ACCENT)
fig6.update_layout(**layout_base,
    title=dict(text="Cost Regressor Residuals (Actual − Predicted)", font=dict(size=14, color=TEXT)),
    barmode="overlay",
    xaxis=dict(title="Residual (MAD)", gridcolor=BORDER),
    yaxis=dict(title="Count", gridcolor=BORDER),
    legend=dict(bgcolor=CARD, bordercolor=BORDER),
    height=360,
)
figs.append(("Cost Residuals", fig6))

# ── Assemble HTML ──────────────────────────────────────────────────────────────
tab_buttons = ""
tab_panels  = ""

for i, (title, fig) in enumerate(figs):
    active = "active" if i == 0 else ""
    tab_buttons += f'<button class="tab-btn {active}" onclick="showTab({i})">{title}</button>\n'
    html_chunk = fig.to_html(full_html=False, include_plotlyjs=False)
    display = "block" if i == 0 else "none"
    tab_panels += f'<div class="tab-panel" id="panel-{i}" style="display:{display}">{html_chunk}</div>\n'

html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>AI Model Evaluation</title>
<script src="https://cdn.plot.ly/plotly-2.27.0.min.js"></script>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet"/>
<style>
*{{box-sizing:border-box;margin:0;padding:0}}
body{{background:#060910;color:#e2eaf4;font-family:'JetBrains Mono',monospace;min-height:100vh}}
body::before{{content:'';position:fixed;inset:0;background-image:linear-gradient(rgba(0,255,163,.03)1px,transparent 1px),linear-gradient(90deg,rgba(0,255,163,.03)1px,transparent 1px);background-size:40px 40px;pointer-events:none}}
.header{{padding:40px 40px 0;position:relative;z-index:1}}
.header h1{{font-family:'Syne',sans-serif;font-size:clamp(22px,4vw,42px);font-weight:800;letter-spacing:-2px;line-height:1}}
.header h1 span{{color:#00ffa3;text-shadow:0 0 30px rgba(0,255,163,.5)}}
.header p{{color:#4a6080;font-size:12px;margin-top:8px}}
.kpi-row{{display:flex;flex-wrap:wrap;gap:12px;padding:28px 40px;position:relative;z-index:1}}
.kpi{{background:#111820;border:1px solid #1c2a3a;border-radius:14px;padding:18px 22px;min-width:160px;transition:border-color .3s}}
.kpi:hover{{border-color:#00ffa3}}
.kpi-label{{font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:#4a6080;margin-bottom:8px}}
.kpi-value{{font-family:'Syne',sans-serif;font-size:28px;font-weight:800;letter-spacing:-1px}}
.kpi-value.g{{color:#00ffa3}}.kpi-value.b{{color:#3b82f6}}.kpi-value.o{{color:#ff6b35}}
.tabs{{display:flex;flex-wrap:wrap;gap:8px;padding:0 40px 20px;position:relative;z-index:1}}
.tab-btn{{background:#111820;border:1px solid #1c2a3a;color:#4a6080;font-family:'JetBrains Mono',monospace;font-size:11px;padding:8px 16px;border-radius:8px;cursor:pointer;transition:all .2s;text-transform:uppercase;letter-spacing:1px}}
.tab-btn:hover{{border-color:#00ffa3;color:#00ffa3}}
.tab-btn.active{{background:rgba(0,255,163,.1);border-color:#00ffa3;color:#00ffa3}}
.tab-panel{{padding:0 40px 40px;position:relative;z-index:1}}
</style>
</head>
<body>
<div class="header">
  <h1>MODEL <span>EVALUATION</span> REPORT</h1>
  <p>XGBoost · 20 repair classes · Generated {pd.Timestamp.now().strftime("%Y-%m-%d %H:%M")}</p>
</div>
<div class="kpi-row">
  <div class="kpi"><div class="kpi-label">Overall Accuracy</div><div class="kpi-value g">{overall_acc:.2%}</div></div>
  <div class="kpi"><div class="kpi-label">Top-3 Accuracy</div><div class="kpi-value g">{top3_correct:.2%}</div></div>
  <div class="kpi"><div class="kpi-label">Avg Confidence</div><div class="kpi-value b">{top1_conf.mean():.2%}</div></div>
  <div class="kpi"><div class="kpi-label">Cost-Min MAE</div><div class="kpi-value o">{mae_min:.0f} MAD</div></div>
  <div class="kpi"><div class="kpi-label">Cost-Max MAE</div><div class="kpi-value o">{mae_max:.0f} MAD</div></div>
  <div class="kpi"><div class="kpi-label">Cost-Min R²</div><div class="kpi-value b">{r2_min:.4f}</div></div>
  <div class="kpi"><div class="kpi-label">Cost-Max R²</div><div class="kpi-value b">{r2_max:.4f}</div></div>
  <div class="kpi"><div class="kpi-label">Test Samples</div><div class="kpi-value g">{len(yr_te):,}</div></div>
</div>
<div class="tabs">
{tab_buttons}
</div>
{tab_panels}
<script>
function showTab(n) {{
  document.querySelectorAll('.tab-panel').forEach((p,i) => p.style.display = i===n?'block':'none');
  document.querySelectorAll('.tab-btn').forEach((b,i) => b.classList.toggle('active', i===n));
}}
</script>
</body>
</html>"""

# ── Save & open ────────────────────────────────────────────────────────────────
out = os.path.join(BASE, "model_evaluation.html")
with open(out, "w", encoding="utf-8") as f:
    f.write(html)

print(f"\n✅  Report saved → {out}")
print("Opening in browser...")
webbrowser.open(f"file://{os.path.abspath(out)}")