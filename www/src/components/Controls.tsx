import React, { useCallback, useEffect, useState } from 'react';
import _ from 'underscore';

import { Color, Engine } from 'fraktal-wasm/fraktal';

import styles from './Controls.module.css';


function onSubmit(event: React.FormEvent<HTMLFormElement>) {
  if (event && event.preventDefault) {
    event.preventDefault();
  }
}

interface Props {
  engine: Engine,
}

interface GradientPivot {
  value: number,
  color: string,
  id: string,
}

function Controls({ engine }: Props) {

  const [numColors, setNumColors] = useState(50);
  const [insideColor, setInsideColor] = useState<string>('#000000');
  const [gradient, setGradient] = useState<GradientPivot[]>([
    { id: _.uniqueId('gradient-pivot-'), value: 0, color: '#000000' },
    { id: _.uniqueId('gradient-pivot-'), value: numColors, color: '#ff00ff' },
  ]);

  useEffect(
    () => {
      engine.gradient_set_inside_color(insideColor);
      for (let i = 0; i < gradient.length; ++i) {
        if (engine.gradient_set_pivot_color(i, gradient[i].color)) {
          engine.gradient_set_pivot_value(i, gradient[i].value);
        } else {
          engine.gradient_insert_pivot(i);
          engine.gradient_set_pivot_color(i, gradient[i].color);
          engine.gradient_set_pivot_value(i, gradient[i].value);
        }
      }
    },
    [engine, gradient, insideColor]
  );

  const setPivotValue = useCallback(
    (index, value) => {
      const updated = engine.gradient_set_pivot_value(index, value);
      if (updated) {
        setGradient([
          ...gradient.slice(0, index),
          {
            ...gradient[index],
            value: updated,
          },
          ...gradient.slice(index + 1),
        ]);
      }
    },
    [engine, gradient],
  );

  const setPivotColor = useCallback(
    (index, color) => {
      if (engine.gradient_set_pivot_color(index, color)) {
        setGradient([
          ...gradient.slice(0, index),
          {
            ...gradient[index],
            color,
          },
          ...gradient.slice(index + 1),
        ]);
      }
    },
    [engine, gradient],
  );

  const addGradientPivot = useCallback(
    (index) => {
      const pivot = engine.gradient_insert_pivot(index);
      setGradient([
        ...gradient.slice(0, index + 1),
        {
          id: _.uniqueId('gradient-pivot-'),
          value: pivot.value,
          color: pivot.color.as_hex(),
        },
        ...gradient.slice(index + 1),
      ]);
    },
    [engine, gradient],
  );

  const deleteGradientPivot = useCallback(
    (index) => {
      const pivot = engine.gradient_delete_pivot(index);
      setGradient([
        ...gradient.slice(0, index),
        ...gradient.slice(index + 1),
      ]);
    },
    [engine, gradient],
  );

  const onSetInsideColor = useCallback(
    (color) => {
      engine.gradient_set_inside_color(color);
      setInsideColor(color);
    },
    [engine],
  );

  return <div>
    <form onSubmit={ onSubmit }>
      <div>
        <p>
          Precision:
        </p>
        <p>
          <input
            max={ 1000 }
            min={ 10 }
            onChange={ ({ target: { value } }) => setNumColors(parseInt(value, 10)) }
            step={ 10 }
            type="range"
            value={ numColors }
          />
          { numColors }
        </p>

        <p>
          Gradient:
        </p>
        { gradient.map((pivot, index) => {
          const colorHex = pivot.color;

          return <div
            key={ pivot.id }
            className={ styles['Gradient-Row'] }
          >
            <input
              max={ numColors - 1 }
              min={ 0 }
              onChange={ ({ target: { value } }) => setPivotValue(index, parseInt(value, 10)) }
              type="range"
              value={ pivot.value }
            />
            <input
              onChange={ ({ target: { value } }) => setPivotColor(index, value) }
              type="color"
              value={ colorHex }
            />
            <button
              onClick={ () => addGradientPivot(index) }
              type="button"
            >
              +
            </button>
            <button
              onClick={ () => deleteGradientPivot(index) }
              type="button"
            >
              -
            </button>
          </div>;
        }) }

        <p>
          { 'Color inside set: ' }
          <input
            onChange={ ({ target: { value } }) => onSetInsideColor(value) }
            type="color"
            value={ insideColor }
          />
        </p>
      </div>
    </form>
  </div>;
}

export default Controls;
