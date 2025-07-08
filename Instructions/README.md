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

Start the Flask app by running:

```bash
python app.py
```

The application will start a local development server and open `http://localhost:5000/`,
which provides links to the available views.  The interactive chart is accessible
at `http://localhost:5000/chart` and now displays the GPS route on an interactive
Leaflet map.  Additional analysis pages are served at
`/zweidimensionale_analyse.html` and `/analyse/drive_style.html`.
