type P = { x: number; y: number };
function sqr(x: number) {
  return x * x;
}
function dist2(v: P, w: P) {
  return sqr(v.x - w.x) + sqr(v.y - w.y);
}
function distToSegmentSquared(p: P, v: P, w: P) {
  const l2 = dist2(v, w);
  if (l2 == 0) return dist2(p, v);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return dist2(p, { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) });
}
function distToSegment(p: P, v: P, w: P) {
  return Math.sqrt(distToSegmentSquared(p, v, w));
}

export function getClosestEdge(points: number[], x: number, y: number) {
  let minDistance = Number.MAX_VALUE;
  let nearestIndex = 0;

  for (let i = 0; i < points.length; i += 2) {
    const x0 = points[i];
    const y0 = points[i + 1];

    const x1 = points[(i + 2) % points.length];
    const y1 = points[(i + 3) % points.length];

    const distance = distToSegment(
      { x, y },
      { x: x0, y: y0 },
      { x: x1, y: y1 },
    );

    if (distance < minDistance) {
      minDistance = distance;
      nearestIndex = i;
    }
  }

  return nearestIndex;
}
