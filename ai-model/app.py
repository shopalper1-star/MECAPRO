from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np
import json
import sys
import os
from datetime import datetime

# Force Python to flush output immediately
sys.stdout.reconfigure(line_buffering=True)
sys.stderr.reconfigure(line_buffering=True)

# Log file for debugging
LOG_FILE = '/var/www/html/ai-model/flask.log'

class Tee:
    def __init__(self, *files):
        self.files = files
    def write(self, obj):
        for f in self.files:
            f.write(obj)
            f.flush()
    def flush(self):
        for f in self.files:
            f.flush()

# Redirect stdout/stderr to both console and log file
log_f = open(LOG_FILE, 'a')
sys.stdout = Tee(sys.stdout, log_f)
sys.stderr = Tee(sys.stderr, log_f)

np.set_printoptions(suppress=True)

app = Flask(__name__)
CORS(app)

# Try to load models with error handling
try:
    repair_model   = joblib.load('models/repair_model.pkl')
    cost_min_model = joblib.load('models/cost_min_model.pkl')
    cost_max_model = joblib.load('models/cost_max_model.pkl')
    label_encoder  = joblib.load('models/label_encoder.pkl')
    print("✅ Models loaded successfully")
except Exception as e:
    print(f"❌ Error loading models: {e}")
    raise

try:
    with open('models/repair_classes.json') as f:
        repair_classes = json.load(f)
    with open('models/options.json') as f:
        options = json.load(f)
    print("✅ JSON files loaded successfully")
except Exception as e:
    print(f"❌ Error loading JSON files: {e}")
    raise

CAT_COLS = ['vehicle_type', 'make', 'model', 'fuel_type', 'transmission', 'severity_level']
NUM_COLS = ['year', 'vehicle_age_years', 'mileage', 'engine_size_cc', 'symptom_count']
TEXT_COL = 'symptoms'
ALL_COLS = CAT_COLS + NUM_COLS + [TEXT_COL]

COST_CATS = ['vehicle_type', 'severity_level', 'probable_cause']
COST_NUMS = ['year', 'vehicle_age_years', 'mileage', 'engine_size_cc', 'symptom_count']
COST_COLS = COST_CATS + COST_NUMS

CURRENT_YEAR = datetime.now().year


def _warmup():
    try:
        dummy_row = {
            'vehicle_type': 'car', 'make': 'Toyota', 'model': 'Corolla',
            'fuel_type': 'gasoline', 'transmission': 'automatic',
            'severity_level': 'moderate', 'year': CURRENT_YEAR,
            'vehicle_age_years': 3, 'mileage': 50000,
            'engine_size_cc': 1600, 'symptom_count': 2,
            'symptoms': 'noise,vibration', 'probable_cause': 'engine',
        }
        repair_df = pd.DataFrame.from_records([{col: dummy_row[col] for col in ALL_COLS}])
        cost_df   = pd.DataFrame.from_records([{col: dummy_row[col] for col in COST_COLS}])
        repair_model.predict_proba(repair_df)
        cost_min_model.predict(cost_df)
        cost_max_model.predict(cost_df)
        print("✅ Model warmup complete")
    except Exception as e:
        print(f"⚠️ Warmup error (non-fatal): {e}")

_warmup()


def _is_gibberish(text: str) -> bool:
    text = text.strip()
    if len(text) < 2:
        return True
    words = text.replace(',', ' ').split()
    avg_len = sum(len(w) for w in words) / max(len(words), 1)
    if avg_len > 12:
        return True
    VOWELS = set('aeiouAEIOU')
    streak = max_streak = 0
    for ch in text:
        if ch.isalpha() and ch not in VOWELS:
            streak += 1
            max_streak = max(max_streak, streak)
        else:
            streak = 0
    if max_streak >= 6:
        return True
    return False


def _validate_enum(value, valid_list, field_name):
    if value not in valid_list:
        sample = ', '.join(list(valid_list)[:5])
        return f"'{field_name}' value \"{value}\" is not recognized. Valid options include: {sample}..."
    return None


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'message': 'Auto Repair AI is running'})


@app.route('/options', methods=['GET'])
def get_options():
    return jsonify(options)


@app.route('/predict', methods=['POST'])
def predict():
    try:
        body = request.json
        errors = []

        # Enum field validation
        enum_checks = [
            ('vehicle_type',   options.get('vehicle_type', [])),
            ('make',           options.get('make', [])),
            ('fuel_type',      options.get('fuel_type', [])),
            ('transmission',   options.get('transmission', [])),
            ('severity_level', options.get('severity_level', [])),
        ]
        for field, valid_list in enum_checks:
            err = _validate_enum(body.get(field, ''), valid_list, field)
            if err:
                errors.append(err)

        # Probable cause (optional)
        probable_cause = body.get('probable_cause', '')
        if probable_cause:
            err = _validate_enum(probable_cause, options.get('probable_causes', []), 'probable_cause')
            if err:
                errors.append(err)

        # Symptoms — free text, only gibberish check
        symptoms_raw = body.get('symptoms', '')
        if not symptoms_raw.strip():
            errors.append("Please describe at least one symptom.")
        elif _is_gibberish(symptoms_raw):
            errors.append(
                "I don't understand the symptoms you entered. "
                "Please describe them in plain words (e.g. 'brake noise, engine vibration')."
            )

        # Numeric sanity checks
        try:
            year = int(body.get('year', 0))
            if not (1980 <= year <= CURRENT_YEAR):
                errors.append(f"'year' must be between 1980 and {CURRENT_YEAR}.")
        except (ValueError, TypeError):
            errors.append("'year' must be a valid number.")

        try:
            mileage = float(body.get('mileage', -1))
            if mileage < 0 or mileage > 2_000_000:
                errors.append("'mileage' must be a realistic value (0 - 2,000,000 km).")
        except (ValueError, TypeError):
            errors.append("'mileage' must be a valid number.")

        try:
            engine_cc = float(body.get('engine_size_cc', -1))
            if engine_cc <= 0 or engine_cc > 20_000:
                errors.append("'engine_size_cc' must be a realistic value (50 - 20,000 cc).")
        except (ValueError, TypeError):
            errors.append("'engine_size_cc' must be a valid number.")

        if errors:
            return jsonify({
                'success': False,
                'error':   "I couldn't understand your input. Please check the following:",
                'details': errors,
            }), 422

        body['vehicle_age_years'] = CURRENT_YEAR - int(body.get('year', 2015))
        body['symptom_count']     = len(body.get('symptoms', '').split(','))

        repair_df = pd.DataFrame.from_records([{col: body[col] for col in ALL_COLS}])
        cost_df   = pd.DataFrame.from_records([{col: body[col] for col in COST_COLS}])

        proba    = repair_model.predict_proba(repair_df)[0]
        top3_idx = np.argpartition(-proba, 3)[:3]
        top3_idx = top3_idx[np.argsort(-proba[top3_idx])]

        cost_min = round(float(cost_min_model.predict(cost_df)[0]))
        cost_max = round(float(cost_max_model.predict(cost_df)[0]))
        if cost_max < cost_min:
            cost_max = int(cost_min * 1.5)

        predictions = []
        for idx in top3_idx:
            predictions.append({
                'repair':             label_encoder.inverse_transform([idx])[0],
                'confidence_percent': round(float(proba[idx]) * 100, 1),
                'cost_min_mad':       cost_min,
                'cost_max_mad':       cost_max,
            })

        return jsonify({'success': True, 'predictions': predictions})

    except KeyError as e:
        return jsonify({'success': False, 'error': f'Missing field: {str(e)}'}), 400
    except Exception as e:
        print(f"❌ Prediction error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    print(f'✅ Auto Repair AI running on http://0.0.0.0:{port}')
    sys.stdout.flush()
    app.run(debug=False, host='0.0.0.0', port=port)