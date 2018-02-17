import Complex from 'complex.js';


export function computeNumberAt({ center, dimensions, scale, x, y }) {
  const aspectRatio = dimensions.get('height') / dimensions.get('width');
  return center.add(
    new Complex(
      ((x / dimensions.get('width')) - 0.5) * scale,
      (0.5 - (y / dimensions.get('height'))) * scale * aspectRatio
    )
  );
}
