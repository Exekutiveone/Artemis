#!/usr/bin/env python3
# test.z.py – erweiterte Simulation mit Manöverklassifikation

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

def simulate_drive_data(n: int = 1000, seed: int = 42) -> pd.DataFrame:
    """Simulate a coherent driving route with simple vehicle dynamics."""

    rng = np.random.default_rng(seed)
    dt = 1.0

    # Route plan: (duration, target_speed[m/s], steering radius[m] or None)
    route = [
        (20, 13.0, None),          # accelerate to ~47 km/h
        (60, 13.0, None),          # straight section
        (30, 8.0, 30.0),           # left curve
        (50, 13.0, None),
        (25, 8.0, -25.0),          # right curve
        (15, 0.0, None),           # decelerate to stop
        (10, 0.0, None),           # wait
        (25, 15.0, None),
        (60, 15.0, None),
        (30, 9.0, -40.0),          # right curve
        (40, 12.0, None),
        (30, 9.0, 40.0),           # left curve
    ]

    # Repeat the route pattern to fill n samples
    steps = sum(seg[0] for seg in route)
    reps = max(1, int(np.ceil(n / steps)))
    route = route * reps

    # State variables
    speed = 0.0
    heading = 0.0
    lat = 48.775845
    lon = 9.182932
    battery = 100.0

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

    idx = 0
    for duration, tgt_speed, radius in route:
        for _ in range(int(duration)):
            if idx >= n:
                break

            # Acceleration toward target speed
            accel = (tgt_speed - speed) * 0.4
            accel = float(np.clip(accel, -3.0, 2.0))
            speed = max(0.0, speed + accel * dt + rng.normal(0, 0.05))

            # Steering from curve radius (positive for left, negative for right)
            if radius is None:
                steering = rng.normal(0, 1)
            else:
                sign = 1 if radius > 0 else -1
                r = abs(radius)
                steering = sign * np.degrees(speed**2 / (r * 9.81))
                steering += rng.normal(0, 0.5)

            heading += np.radians(steering) * dt
            step = speed * dt * 1e-5
            lat += step * np.cos(heading)
            lon += step * np.sin(heading)
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

            idx += 1
            if idx >= n:
                break

    accel_arr = np.array(data["accel_m_s2"])
    steering_arr = np.array(data["steering_deg"])
    speed_arr = np.array(data["speed_m_s"])
    distance_front_arr = np.array(data["distance_front_m"])

    event_code = [
        classify_event(s, a, st, d)
        for s, a, st, d in zip(speed_arr, accel_arr, steering_arr, distance_front_arr)
    ]
    manoeuvre = [
        classify_manoeuvre(s, st, a) for s, st, a in zip(speed_arr, steering_arr, accel_arr)
    ]

    data["event_code"] = event_code
    data["manoeuvre"] = manoeuvre

    return pd.DataFrame(data)

if __name__ == "__main__":
    df = simulate_drive_data()
    base_dir = Path(__file__).resolve().parent.parent / "Data Base"
    data_path = base_dir / "fahrtanalyse_daten.csv"
    df.to_csv(data_path, index=False)

    # Export GPS points separately for easy use with mapping tools
    gps_path = base_dir / "gps_route.csv"
    df[["gps_lat", "gps_lon"]].to_csv(gps_path, index=False)

    print(f"CSV geschrieben: {data_path.resolve()}")
    print(f"GPS CSV geschrieben: {gps_path.resolve()}")
