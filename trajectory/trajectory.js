'use strict';

// Fetch movement data and render the 2D trajectory on a black canvas.

function colorForSpeed(speed, maxSpeed) {
  const ratio = maxSpeed ? speed / maxSpeed : 0;
  const hue = (1 - ratio) * 240; // blue to red
  return `hsl(${hue}, 100%, 50%)`;
}

function drawTrajectory(data) {
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  // Resize canvas to fill window
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const speed = data.series.speed;
  const steering = data.series.steering;
  const accel = data.series.accel || [];
  // The data was generated with one sample per second. Steering angles were
  // converted to orientation changes by dividing the degree value by five
  // (see Test_Set.py).  This factor yields a visible path with realistic curves.
  const dt = 1;
  const steerFactor = Math.PI / 180 / 5;

  const points = [{x:0, y:0, v:speed[0], a:accel[0] || 0}];
  let theta = 0;
  let v = speed[0];
  for (let i = 1; i < speed.length; i++) {
    // integrate acceleration to update the current speed so braking and
    // acceleration phases affect the travelled distance
    v += (accel[i - 1] || 0) * dt;
    const ds = v * dt;
    theta += steering[i] * steerFactor;
    const prev = points[points.length - 1];
    const x = prev.x + ds * Math.cos(theta);
    const y = prev.y + ds * Math.sin(theta);
    points.push({x, y, v, a: accel[i] || 0});
  }

  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const margin = 10;
  const scaleX = (canvas.width - 2 * margin) / (maxX - minX || 1);
  const scaleY = (canvas.height - 2 * margin) / (maxY - minY || 1);
  const maxSpeed = Math.max(...speed);

  ctx.lineWidth = 2;
  ctx.lineCap = 'round';

  for (let i = 1; i < points.length; i++) {
    const p0 = points[i - 1];
    const p1 = points[i];
    ctx.strokeStyle = colorForSpeed(p1.v, maxSpeed);
    ctx.beginPath();
    ctx.moveTo(margin + (p0.x - minX) * scaleX,
               canvas.height - (margin + (p0.y - minY) * scaleY));
    ctx.lineTo(margin + (p1.x - minX) * scaleX,
               canvas.height - (margin + (p1.y - minY) * scaleY));
    ctx.stroke();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  fetch('/api/series')
    .then(r => r.json())
    .then(drawTrajectory);
});
