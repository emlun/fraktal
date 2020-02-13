import Complex from 'complex.js';


export function computeNumberAt({ center, dimensions, scale, x, y }) {
  const aspectRatio = dimensions.height / dimensions.width;
  return center.add(
    new Complex(
      ((x / dimensions.width) - 0.5) * scale,
      (0.5 - (y / dimensions.height)) * scale * aspectRatio
    )
  );
}
