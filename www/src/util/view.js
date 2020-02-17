import Complex from 'complex.js';


export function computeNumberAt({ center, aspectRatio, scale, x, y }) {
  return center.add(
    new Complex(
      (x - 0.5) * scale,
      (0.5 - y) * scale / aspectRatio
    )
  );
}
