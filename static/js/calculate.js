'use strict';

function computeStats(data) {
  const n = data.length;
  const avgNum = data.reduce((a, b) => a + b, 0) / n;
  const sorted = [...data].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0
    ? ((sorted[mid - 1] + sorted[mid]) / 2).toFixed(2)
    : sorted[mid].toFixed(2);
  const rangeVal = (sorted[sorted.length - 1] - sorted[0]).toFixed(2);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = (q3 - q1).toFixed(2);

  const varianceNum = data.reduce((sum, val) => sum + Math.pow(val - avgNum, 2), 0) / n;
  const stdNum = Math.sqrt(varianceNum);
  const varCoeffNum = avgNum !== 0 ? stdNum / avgNum : 0;

  return {
    avg: avgNum.toFixed(2),
    median,
    rangeVal,
    iqr,
    variance: varianceNum.toFixed(2),
    stdDev: stdNum.toFixed(2),
    varCoeff: varCoeffNum.toFixed(2)
  };
}

function computeMovingAverage(data, window) {
  const result = [];
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = data.slice(start, i + 1);
    const avg = slice.reduce((sum, v) => sum + v, 0) / slice.length;
    result.push(Number(avg.toFixed(2)));
  }
  return result;
}
function computeHistogram(data, bins = 10) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const width = (max - min) / bins || 1;
  const counts = new Array(bins).fill(0);
  for (const v of data) {
    const idx = Math.min(Math.floor((v - min) / width), bins - 1);
    counts[idx]++;
  }
  const labels = counts.map((_, i) => (min + i * width).toFixed(2));
  return { labels, counts };
}

function computeTrend(data) {
  const n = data.length;
  const meanX = (n - 1) / 2;
  const meanY = data.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - meanX) * (data[i] - meanY);
    den += (i - meanX) * (i - meanX);
  }
  const slope = den ? num / den : 0;
  const intercept = meanY - slope * meanX;
  const trend = [];
  for (let i = 0; i < n; i++) {
    trend.push(Number((intercept + slope * i).toFixed(2)));
  }
  return { slope, intercept, trend };
}



