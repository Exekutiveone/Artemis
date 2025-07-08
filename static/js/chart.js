'use strict';

// Data from Flask will set labelsFull and sFull globals before this script loads.

const eventNumericFull = sFull.event.map(e => {
  if (e === "bremsung") return -1;
  if (e === "fahrt") return 0;
  if (e === "beschleunigung") return 1;
  return null;
});

const chartData = [
  ['speed', 'Geschwindigkeit (m/s)', sFull.speed],
  ['rpm', 'RPM', sFull.rpm],
  ['steering', 'Lenkwinkel (°)', sFull.steering],
  ['distance', 'Distanz (m)', sFull.distance],
  ['accel', 'Beschleunigung (m/s²)', sFull.accel],
  ['lateral_acc', 'Querbeschleunigung (m/s²)', sFull.lateral_acc],
  ['battery', 'Batteriestand (%)', sFull.battery],
  ['distance_front', 'Distanz vorne (m)', sFull.distance_front],
  ['event_graph', 'Fahrereignis', eventNumericFull]
];

const chartRefs = {};

function insertChartBoxes() {
  const container = document.getElementById("charts");
  container.innerHTML = "";
  for (const [id, label] of chartData) {
    const col = document.createElement("div");
    col.className = "col-12 col-md-6";
    col.innerHTML = `
      <div class="card p-3">
        <div class="chart-container mb-2"><canvas id="${id}"></canvas></div>
        <div class="chart-container mb-2"><canvas id="lorenz_${id}"></canvas></div>
        <div class="boxplot-container"><canvas id="boxplot_${id}"></canvas></div>
        <div class="stat-box mt-2">
          Mittelwert: <span id="mean_${id}">-</span> |
          Median: <span id="median_${id}">-</span> |
          Spannweite: <span id="range_${id}">-</span> |
          IQA: <span id="iqr_${id}">-</span> |
          Varianz: <span id="var_${id}">-</span> |
          Std-Abw.: <span id="std_${id}">-</span> |
          V-Koeff.: <span id="vcoeff_${id}">-</span><br>
          Gini: <span id="gini_${id}">-</span>
        </div>
      </div>`;
    container.appendChild(col);
  }

  const pie1 = document.createElement("div");
  pie1.className = "col-12 col-md-6";
  pie1.innerHTML = `<div class="card p-3 chart-container"><canvas id="freq_chart"></canvas></div>`;
  container.appendChild(pie1);

  const pie2 = document.createElement("div");
  pie2.className = "col-12 col-md-6";
  pie2.innerHTML = `<div class="card p-3 chart-container"><canvas id="manoeuvre_chart"></canvas></div>`;
  container.appendChild(pie2);

}

function buildChart(id, label, data, range) {
  const ctx = document.getElementById(id).getContext('2d');
  if (chartRefs[id]) chartRefs[id].destroy();

  const sliced = data.slice(range[0], range[1]);
  const stats = computeStats(sliced);

  document.getElementById(`mean_${id}`).textContent = stats.avg;
  document.getElementById(`median_${id}`).textContent = stats.median;
  document.getElementById(`range_${id}`).textContent = stats.rangeVal;
  document.getElementById(`iqr_${id}`).textContent = stats.iqr;
  document.getElementById(`var_${id}`).textContent = stats.variance;
  document.getElementById(`std_${id}`).textContent = stats.stdDev;
  document.getElementById(`vcoeff_${id}`).textContent = stats.varCoeff;

  chartRefs[id] = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labelsFull.slice(range[0], range[1]),
      datasets: [{
        label: label,
        data: sliced,
        borderColor: '#1abc9c',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.15,
        fill: false
      }]
    },
    options: {
      animation: false,
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: { display: true, text: 'Index', color: '#f8f9fa' },
          ticks: { color: '#f8f9fa' },
          grid: { color: 'rgba(255,255,255,0.1)' }
        },
        y: {
          title: { display: true, text: label, color: '#f8f9fa' },
          ticks: { color: '#f8f9fa' },
          grid: { color: 'rgba(255,255,255,0.1)' }
        }
      },
      plugins: {
        legend: { labels: { color: '#f8f9fa' } },
        title: { display: false }
      }
    }
  });
}

function buildPieChart(id, dataMap) {
  const ctx = document.getElementById(id).getContext("2d");
  if (chartRefs[id]) chartRefs[id].destroy();

  const labels = Object.keys(dataMap);
  const values = Object.values(dataMap);
  const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];

  chartRefs[id] = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: colors,
        borderColor: '#1e1e1e',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#f8f9fa' } }
      }
    }
  });
}

function applyRange() {
  const start = parseInt(document.getElementById('startIdx').value);
  const end = parseInt(document.getElementById('endIdx').value);
  const range = [start, end];

  insertChartBoxes();
  chartData.forEach(([id, label, data]) => buildChart(id, label, data, range));

  const tbody = document.querySelector("#eventTable tbody");
  tbody.innerHTML = "";

  const eventFreq = {};
  const manoeuvreFreq = {};

  for (let i = start; i < Math.min(end, sFull.event.length); i++) {
    const e = sFull.event[i];
    const m = sFull.manoeuvre[i];
    eventFreq[e] = (eventFreq[e] || 0) + 1;
    manoeuvreFreq[m] = (manoeuvreFreq[m] || 0) + 1;
    tbody.insertAdjacentHTML("beforeend", `<tr><td>${i}</td><td>${e}</td><td>${m}</td></tr>`);
  }

  buildPieChart("freq_chart", eventFreq);
  buildPieChart("manoeuvre_chart", manoeuvreFreq);

  if (typeof buildBoxplot === 'function') {
    buildBoxplot(range);
  }

  if (typeof buildAllLorenz === 'function') {
    buildAllLorenz(range);
  }
}

applyRange();
