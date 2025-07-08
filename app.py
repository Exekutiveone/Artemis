#!/usr/bin/env python3
from flask import Flask, render_template, send_from_directory
import pandas as pd
from pathlib import Path
import os
import json
import subprocess
import sys

CSV_PATH = Path(__file__).resolve().parent / "fahrtanalyse_daten.csv"
ANALYSIS_JSON = Path(__file__).resolve().parent / "regression_data.json"
ANALYSIS_SCRIPT = Path(__file__).resolve().parent / "export_regression_data.py"

app = Flask(__name__)
app.config['TEMPLATES_AUTO_RELOAD'] = True
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0  # Verhindert Browser-Caching statischer Dateien

def load_series():
    df = pd.read_csv(CSV_PATH)
    idx = list(range(len(df)))
    return idx, {
        "speed": df["speed_m_s"].tolist(),
        "rpm": df["rpm"].tolist(),
        "steering": df["steering_deg"].tolist(),
        "distance": df["distance_m"].tolist(),
        "accel": df["accel_m_s2"].tolist(),
        "lateral_acc": df["lateral_acc_m_s2"].tolist(),
        "battery": df["battery_pct"].tolist(),
        "distance_front": df["distance_front_m"].tolist(),
        "event": df["event_code"].tolist(),
        "manoeuvre": df["manoeuvre"].tolist(),
        "terrain_type": df["terrain_type"].tolist(),
        "weather_condition": df["weather_condition"].tolist(),
        "gps_lat": df["gps_lat"].round(6).tolist(),
        "gps_lon": df["gps_lon"].round(6).tolist(),
    }


def load_analysis_results():
    """Return regression analysis data, generating it if necessary."""
    if not ANALYSIS_JSON.exists():
        subprocess.run(
            [sys.executable, str(ANALYSIS_SCRIPT), str(CSV_PATH), str(ANALYSIS_JSON)],
            check=True,
        )
    with open(ANALYSIS_JSON, "r") as f:
        return json.load(f)

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/chart")
def chart():
    idx, series = load_series()
    analysis = load_analysis_results()
    return render_template("chart.html", idx=idx, series=series, analysis=analysis)


@app.route("/zweidimensionale_analyse.html")
def zweidimensionale_analyse():
    """Serve the zweidimensionale Analyse page."""
    return send_from_directory(app.root_path, "zweidimensionale_analyse.html")


@app.route("/analyse/drive_style.html")
def drive_style_html():
    """Serve the drive style analysis page."""
    return send_from_directory(os.path.join(app.root_path, "analyse"), "drive_style.html")


@app.route("/analyse/drive_style.js")
def drive_style_js():
    """Serve the drive style script."""
    return send_from_directory(os.path.join(app.root_path, "analyse"), "drive_style.js")

if __name__ == "__main__":
    app.run(debug=True)
