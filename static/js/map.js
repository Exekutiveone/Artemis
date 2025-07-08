'use strict';

document.addEventListener('DOMContentLoaded', () => {
  if (!window.sFull) return;

  const lats = sFull.gps_lat || [];
  const lons = sFull.gps_lon || [];
  if (!lats.length || !lons.length) return;

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);

  const canvas = document.getElementById('mapCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.strokeStyle = 'orange';
  ctx.lineWidth = 2;
  ctx.beginPath();
  lats.forEach((lat, i) => {
    const x = (lons[i] - minLon) / (maxLon - minLon) * canvas.width;
    const y = canvas.height - (lat - minLat) / (maxLat - minLat) * canvas.height;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();
});
