#!/usr/bin/env python3
# test.z.py – Simulation mit Rundfahrt (Start = Ende)

import numpy as np
import pandas as pd
from pathlib import Path

def classify_event(speed, acc, steering, distance_front):
    if speed < 0.5:
        return "stand"
    elif distance_front < 5:
        return "gefahr"
    elif acc > 1.5:
        return "beschleunigung"
    elif acc < -1.5:
        return "bremsung"
    elif abs(steering) > 15:
        return "kurve"
    else:
        return "fahrt"

def classify_manoeuvre(speed, steering, acc):
    if abs(steering) < 5:
        return "geradeaus"
    elif steering > 15:
        return "rechtskurve"
    elif steering < -15:
        return "linkskurve"
    elif acc < -3 and speed > 10:
        return "notbremsung"
    elif speed < 2 and abs(steering) > 25:
        return "wenden"
    else:
        return "normal"

def simulate_drive_data(n: int = 3600, seed: int = 42) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    data = {
        "speed_m_s": [],
        "rpm": [],
        "steering_deg": [],
        "distance_m": [],
        "accel_m_s2": [],
        "lateral_acc_m_s2": [],
        "battery_pct": [],
        "distance_front_m": [],
        "event_code": [],
        "manoeuvre": [],
        "terrain_type": [],
        "weather_condition": [],
        "gps_lat": [],
        "gps_lon": [],
    }

    terrain_choices = ["indoor", "outdoor", "street", "forest", "field", "trail", "unknown"]
    weather_choices = ["clear", "rain", "heavy_rain", "wind", "storm", "fog", "snow", "unknown"]

    # Startpunkt
    center_lat = 48.775845
    center_lon = 9.182932
    radius_x = 80   # in Meter
    radius_y = 50   # in Meter
    angle_step = 2 * np.pi / n
    battery = 100.0

    for i in range(n):
        angle = angle_step * i

        # GPS
        lat = center_lat + (radius_y * 1e-5) * np.sin(angle)
        lon = center_lon + (radius_x * 1e-5) * np.cos(angle)

        # Fahrdynamik
        speed = 10 + 3 * np.sin(angle * 3)
        accel = 3 * np.cos(angle * 3)
        steering = 25 * np.sin(angle * 2)
        battery = max(0.0, battery - (0.002 * speed + 0.001 * abs(accel)) + rng.normal(0, 0.005))

        distance = 35 - 0.4 * speed + rng.normal(0, 2)
        distance_front = np.clip(30 - 0.25 * abs(steering) + rng.normal(0, 1), 0.5, 100)
        lateral_acc = (np.radians(steering) * speed**2) / 9.81 + rng.normal(0, 0.05)

        data["speed_m_s"].append(speed)
        data["rpm"].append(180 * speed + rng.normal(0, 50))
        data["steering_deg"].append(steering)
        data["distance_m"].append(distance)
        data["accel_m_s2"].append(accel)
        data["lateral_acc_m_s2"].append(lateral_acc)
        data["battery_pct"].append(battery)
        data["distance_front_m"].append(distance_front)
        data["terrain_type"].append(rng.choice(terrain_choices))
        data["weather_condition"].append(rng.choice(weather_choices))
        data["gps_lat"].append(round(lat, 6))
        data["gps_lon"].append(round(lon, 6))

    event_code = [
        classify_event(s, a, st, d)
        for s, a, st, d in zip(data["speed_m_s"], data["accel_m_s2"],
                               data["steering_deg"], data["distance_front_m"])
    ]
    manoeuvre = [
        classify_manoeuvre(s, st, a)
        for s, st, a in zip(data["speed_m_s"], data["steering_deg"], data["accel_m_s2"])
    ]
    data["event_code"] = event_code
    data["manoeuvre"] = manoeuvre

    return pd.DataFrame(data)

if __name__ == "__main__":
    df = simulate_drive_data()
    base_dir = Path(__file__).resolve().parent.parent / "Data Base"
    base_dir.mkdir(parents=True, exist_ok=True)
    data_path = base_dir / "fahrtanalyse_daten.csv"
    df.to_csv(data_path, index=False)

    gps_path = base_dir / "gps_route.csv"
    df[["gps_lat", "gps_lon"]].to_csv(gps_path, index=False)

    print(f"CSV geschrieben: {data_path.resolve()}")
    print(f"GPS CSV geschrieben: {gps_path.resolve()}")
