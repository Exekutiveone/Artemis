'use strict';

const lorenzRefs = {};

function computeLorenz(data) {
  const sorted = [...data].map(v => Math.abs(v)).sort((a, b) => a - b);
  const n = sorted.length;
  const cum = [0];
  for (let i = 0; i < n; i++) {
    cum.push(cum[i] + sorted[i]);
  }
  const total = cum[n];
  const xs = [0];
  const ys = [0];
  for (let i = 1; i <= n; i++) {
    xs.push(i / n);
    ys.push(cum[i] / total);
  }
  let area = 0;
  for (let i = 1; i <= n; i++) {
    area += (ys[i] + ys[i - 1]) * (xs[i] - xs[i - 1]);
  }
  const gini = (1 - area).toFixed(2);
  return { xs, ys, gini };
}

function buildLorenzChart(id, label, data, range) {
  const ctx = document.getElementById(`lorenz_${id}`).getContext('2d');
  if (lorenzRefs[id]) lorenzRefs[id].destroy();
  const slice = data.slice(range[0], range[1]);
  const { xs, ys, gini } = computeLorenz(slice);
  const giniEl = document.getElementById(`gini_${id}`);
  if (giniEl) giniEl.textContent = gini;
  lorenzRefs[id] = new Chart(ctx, {
    type: 'line',
    data: {
      labels: xs,
      datasets: [{
        label: `Lorenzkurve (${label})`,
        data: ys,
        borderColor: '#e67e22',
        borderWidth: 2,
        fill: false,
        pointRadius: 0
      }]
    },
    options: {
      animation: false,
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: { display: true, text: 'Kumulierter Anteil Fahrzeuge', color: '#f8f9fa' },
          ticks: { color: '#f8f9fa' },
          grid: { color: 'rgba(255,255,255,0.1)' }
        },
        y: {
          title: { display: true, text: 'Kumulierter Anteil Geschwindigkeit', color: '#f8f9fa' },
          ticks: { color: '#f8f9fa' },
          grid: { color: 'rgba(255,255,255,0.1)' }
        }
      },
      plugins: {
        legend: { labels: { color: '#f8f9fa' } }
      }
    }
  });
}

function buildAllLorenz(range) {
  chartData.forEach(([id, label, data]) => {
    const canvas = document.getElementById(`lorenz_${id}`);
    if (!canvas) return;
    buildLorenzChart(id, label, data, range);
  });
}
