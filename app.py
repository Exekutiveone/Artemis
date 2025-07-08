#!/usr/bin/env python3
from flask import Flask, render_template, send_from_directory, jsonify
import pandas as pd
from pathlib import Path
import os
import sys

# Allow imports from the "Driving Data" folder
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "Driving Data"))

from analysis_utils import compute_regression_pairs, compute_drive_style_series


# CSV data is stored inside the "Data Base" directory
CSV_PATH = Path(__file__).resolve().parent / "Data Base" / "fahrtanalyse_daten.csv"

# Templates are stored in the "template" directory
app = Flask(__name__, template_folder="template")
app.config["TEMPLATES_AUTO_RELOAD"] = True
app.config["SEND_FILE_MAX_AGE_DEFAULT"] = (
    0  # Verhindert Browser-Caching statischer Dateien
)


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


def load_aggregates():
    """Compute average metrics grouped by weather condition and terrain type."""
    df = pd.read_csv(CSV_PATH)
    numeric = [
        "speed_m_s",
        "rpm",
        "steering_deg",
        "distance_m",
        "accel_m_s2",
        "lateral_acc_m_s2",
        "battery_pct",
        "distance_front_m",
    ]
    by_weather = (
        df.groupby("weather_condition")[numeric].mean().round(2).to_dict(orient="index")
    )
    by_terrain = (
        df.groupby("terrain_type")[numeric].mean().round(2).to_dict(orient="index")
    )
    return {"by_weather": by_weather, "by_terrain": by_terrain}


def load_analysis_results():
    """Return regression analysis data computed from the CSV."""
    return compute_regression_pairs(str(CSV_PATH))


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/chart")
def chart():
    idx, series = load_series()
    analysis = load_analysis_results()
    return render_template("chart.html", idx=idx, series=series, analysis=analysis)


@app.route("/terrain")
def terrain_page():
    """Separate page showing Wetterdaten charts."""
    idx, series = load_series()
    aggregates = load_aggregates()
    return render_template(
        "terrain.html", idx=idx, series=series, aggregates=aggregates
    )


@app.route("/zweidimensionale_analyse.html")
def zweidimensionale_analyse():
    """Serve the zweidimensionale Analyse page."""
    return send_from_directory(
        os.path.join(app.root_path, "Driving Analysis"), "zweidimensionale_analyse.html"
    )


@app.route("/analyse/drive_style.html")
def drive_style_html():
    """Serve the drive style analysis page."""
    return send_from_directory(
        os.path.join(app.root_path, "Driving Analysis"), "drive_style.html"
    )


@app.route("/analyse/drive_style.js")
def drive_style_js():
    """Serve the drive style script."""
    return send_from_directory(
        os.path.join(app.root_path, "static/js"), "drive_style_analysis.js"
    )


@app.route("/api/drive_style")
def drive_style_api():
    """Return drive style series as JSON."""
    data = compute_drive_style_series(str(CSV_PATH))
    return jsonify(data)


@app.route("/api/series")
def series_api():
    """Return full time series data as JSON."""
    idx, series = load_series()
    return jsonify({"idx": idx, "series": series})


@app.route("/api/regression_pairs")
def regression_pairs_api():
    """Return regression analysis pairs as JSON."""
    data = load_analysis_results()
    return jsonify(data)


# ---------------------------------------------------------------
# Terrain map
# ---------------------------------------------------------------


@app.route("/terrain/")
def terrain_index():
    """Serve the basic interactive map."""
    return send_from_directory(os.path.join(app.root_path, "terrain"), "index.html")


@app.route("/terrain/<path:filename>")
def terrain_files(filename):
    """Serve static files for the terrain page."""
    return send_from_directory(os.path.join(app.root_path, "terrain"), filename)


@app.route("/api/aggregates")
def aggregates_api():
    """Return aggregated metrics by weather and terrain."""
    data = load_aggregates()
    return jsonify(data)


# ---------------------------------------------------------------
# Trajectory visualisation
# ---------------------------------------------------------------


@app.route("/trajectory/")
def trajectory_index():
    """Serve the trajectory visualisation page."""
    return send_from_directory(os.path.join(app.root_path, "trajectory"), "index.html")


@app.route("/trajectory/<path:filename>")
def trajectory_files(filename):
    """Serve static files for the trajectory page."""
    return send_from_directory(os.path.join(app.root_path, "trajectory"), filename)


if __name__ == "__main__":
    app.run(debug=True)
