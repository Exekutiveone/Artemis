'use strict';

const aggregateChartRefs = {};
const sequenceChartRefs = {};

function buildAggregateChart(id, labels, values) {
  const ctx = document.getElementById(id).getContext('2d');
  if (aggregateChartRefs[id]) aggregateChartRefs[id].destroy();
  aggregateChartRefs[id] = new Chart(ctx, {
    type: 'bar',
    data: { labels: labels, datasets: [{ label: 'Geschwindigkeit (m/s)', data: values, backgroundColor: '#1abc9c' }] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { ticks: { color: '#f8f9fa' }, grid: { color: 'rgba(255,255,255,0.1)' } },
        y: { ticks: { color: '#f8f9fa' }, grid: { color: 'rgba(255,255,255,0.1)' }, title: { display: true, text: 'Geschwindigkeit (m/s)', color: '#f8f9fa' } }
      },
      plugins: { legend: { labels: { color: '#f8f9fa' } } }
    }
  });
}

function buildSequenceChart(id, dataArray) {
  const ctx = document.getElementById(id).getContext('2d');
  const categories = Array.from(new Set(dataArray));
  const mapping = {};
  categories.forEach((k, i) => { mapping[k] = i; });
  const numeric = dataArray.map(v => mapping[v]);
  const labels = labelsFull.map(String);
  if (sequenceChartRefs[id]) sequenceChartRefs[id].destroy();
  sequenceChartRefs[id] = new Chart(ctx, {
    type: 'line',
    data: { labels: labels, datasets: [{ label: id, data: numeric, stepped: true, borderColor: '#3498db', pointRadius: 0, fill: false }] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { title: { display: true, text: 'Index', color: '#f8f9fa' }, ticks: { color: '#f8f9fa' }, grid: { color: 'rgba(255,255,255,0.1)' } },
        y: { ticks: { callback: v => categories[v], color: '#f8f9fa' }, grid: { color: 'rgba(255,255,255,0.1)' }, title: { display: true, text: 'Kategorie', color: '#f8f9fa' } }
      },
      plugins: { legend: { labels: { color: '#f8f9fa' } } }
    }
  });
}

function updateWeatherCharts() {
  if (typeof aggregatesData === 'undefined') return;
  const wSel = document.getElementById('weatherSelect');
  const wKeys = Array.from(wSel.selectedOptions).map(o => o.value);
  const weatherLabels = wKeys.length ? wKeys : Object.keys(aggregatesData.by_weather);

  const weatherPairs = weatherLabels.map(k => [k, aggregatesData.by_weather[k].speed_m_s]);
  weatherPairs.sort((a, b) => b[1] - a[1]);

  const sortedLabels = weatherPairs.map(p => p[0]);
  const sortedValues = weatherPairs.map(p => p[1]);
  buildAggregateChart('weatherAggChart', sortedLabels, sortedValues);
}

function initWeatherFilters() {
  if (typeof aggregatesData === 'undefined') return;
  const wSel = document.getElementById('weatherSelect');
  Object.keys(aggregatesData.by_weather).forEach(k => {
    const opt = document.createElement('option');
    opt.value = k;
    opt.textContent = k;
    wSel.appendChild(opt);
  });
  wSel.addEventListener('change', updateWeatherCharts);
  updateWeatherCharts();
}

document.addEventListener('DOMContentLoaded', () => {
  initWeatherFilters();
  buildSequenceChart('weatherSeqChart', sFull.weather_condition);
});
