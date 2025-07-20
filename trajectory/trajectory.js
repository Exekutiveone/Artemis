<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <title>Trajektorie</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body, html { margin:0; background:#000; color:#fff; font-family:sans-serif; }
    #canvas   { width:100%; height:90vh; display:none; }
    #controls { padding:10px; background:#111; color:#fff; display:flex; gap:8px; align-items:center; }
    #pointSlider { flex:1; }
    button   { padding:4px 10px; }
  </style>
</head>
<body>
  <div id="controls">
    <label for="pointSlider">Datenpunkte</label>
    <input type="range" id="pointSlider" min="1" max="10000" value="1000">
    <span id="pointCount">1000</span>
    <button id="playBtn">Play</button>
  </div>
  <canvas id="canvas"></canvas>
  <script>
'use strict';

function colorForSpeed(speed, max) {
  const r = max ? speed / max : 0;
  const h = (1 - r) * 240;
  return `hsl(${h},100%,50%)`;
}

function loadTrajectory() {
  const limit = Number(document.getElementById('pointSlider').value);
  fetch(`/api/trajectory_series?limit=${limit}`)
    .then(r => r.json())
    .then(d => drawTrajectory(d, limit));
}

function drawTrajectory(data, limit) {
  const len      = Math.min(limit, data.series.speed.length);
  const speed    = data.series.speed.slice(0, len);
  const steering = data.series.steering.slice(0, len);
  const accel    = (data.series.accel || []).slice(0, len - 1);

  const canvas = document.getElementById('canvas');
  const ctx    = canvas.getContext('2d');
  canvas.style.display = 'block';
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const dt = 1, steerFactor = Math.PI / 180 / 5;
  const pts = [{x:0, y:0, v:speed[0]}];
  let theta = 0, v = speed[0];

  for (let i = 1; i < len; i++) {
    v += (accel[i-1] || 0) * dt;
    const ds = v * dt;
    theta   += steering[i] * steerFactor;
    const p  = pts[pts.length-1];
    pts.push({x: p.x + ds*Math.cos(theta), y: p.y + ds*Math.sin(theta), v});
  }

  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const margin = 10;
  const sx = (canvas.width  - 2*margin) / (maxX - minX || 1);
  const sy = (canvas.height - 2*margin) / (maxY - minY || 1);
  const vmax = Math.max(...speed);

  ctx.lineWidth = 2;
  ctx.lineCap   = 'round';

  for (let i = 1; i < pts.length; i++) {
    const a = pts[i-1], b = pts[i];
    ctx.strokeStyle = colorForSpeed(b.v, vmax);
    ctx.beginPath();
    ctx.moveTo(margin + (a.x - minX)*sx, canvas.height - (margin + (a.y - minY)*sy));
    ctx.lineTo(margin + (b.x - minX)*sx, canvas.height - (margin + (b.y - minY)*sy));
    ctx.stroke();
  }
}

let playing = false, rafId = 0;
function togglePlay() {
  playing = !playing;
  document.getElementById('playBtn').textContent = playing ? 'Pause' : 'Play';
  if (playing) step();
  else cancelAnimationFrame(rafId);
}

function step() {
  const slider = document.getElementById('pointSlider');
  if (Number(slider.value) < Number(slider.max)) {
    slider.value = Number(slider.value) + 1;
    document.getElementById('pointCount').textContent = slider.value;
    loadTrajectory();
    rafId = requestAnimationFrame(step);
  } else {
    togglePlay();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const slider = document.getElementById('pointSlider');
  const count  = document.getElementById('pointCount');
  slider.addEventListener('input', () => { count.textContent = slider.value; loadTrajectory(); });
  document.getElementById('playBtn').addEventListener('click', togglePlay);
  loadTrajectory();
});
  </script>
</body>
</html>
