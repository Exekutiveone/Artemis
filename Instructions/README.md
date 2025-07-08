# Artemis

This project contains a small Flask application and supporting scripts for analyzing driving data.  The project uses `pandas` and `numpy` to process CSV data and display the results in a web interface.

## Installation

Use pip to install the required dependencies:

```bash
pip install -r Instructions/requirements.txt
```

## Usage

Generate the example dataset with:

```bash
python "Driving Data/Test_Set.py"
```

This will create `Data Base/fahrtanalyse_daten.csv` and a separate
`Data Base/gps_route.csv` containing only the latitude and longitude
columns. The chart page now loads a base map even if no GPS data is
present. You can generate the GPS file from any CSV later with:
columns. You can also generate the GPS file from any CSV later with:

```bash
python "Driving Data/export_gps_points.py" Data\ Base/fahrtanalyse_daten.csv
```

Start the Flask app by running:

```bash
python app.py
```

The application will start a local development server and open `http://localhost:5000/`,
which provides links to the available views.  The interactive chart is accessible
at `http://localhost:5000/chart` and now displays the GPS route on an interactive
Leaflet map.

### Offline JavaScript libraries

`Chart.js` is bundled in `static/js/chart.min.js` so the app works without internet
access.  Additional analysis pages are served at
`/zweidimensionale_analyse.html` and `/analyse/drive_style.html`.

### Terrain map preview

A bare interactive map is available at `http://localhost:5000/terrain/`.  It
shows a Leaflet base map and will later be used to visualise the recorded routes.
