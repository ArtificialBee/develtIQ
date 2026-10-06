type Point = [x: number, y: number];

/** The points of a small line chart that fills a `width` × `height` box, with `pad` px inside each edge. */
export const sparklinePoints = (
  values: number[],
  width: number,
  height: number,
  pad = 2,
): Point[] => {
  const min = Math.min(...values);
  const span = Math.max(...values) - min || 1;
  const step = values.length > 1 ? (width - pad * 2) / (values.length - 1) : 0;

  return values.map((value, i) => [
    values.length > 1 ? pad + i * step : width / 2,
    pad + (1 - (value - min) / span) * (height - pad * 2),
  ]);
};

const toPath = (points: Point[]) =>
  points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x} ${y}`).join(" ");

/** The SVG path of the line. */
export const sparklinePath = (values: number[], width: number, height: number, pad = 2) =>
  toPath(sparklinePoints(values, width, height, pad));

/** The SVG path of the area under the line, closed along the bottom edge. */
export const sparklineArea = (values: number[], width: number, height: number, pad = 2) => {
  const points = sparklinePoints(values, width, height, pad);
  const first = points[0];
  const last = points[points.length - 1];
  return `${toPath(points)} L${last[0]} ${height} L${first[0]} ${height} Z`;
};
