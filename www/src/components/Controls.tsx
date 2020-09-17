import React, { useCallback, useEffect, useState } from 'react';
import _ from 'underscore';

import { Color, Engine, Viewpoint } from 'fraktal-wasm/fraktal';

import styles from './Controls.module.css';


function onSubmit(event: React.FormEvent<HTMLFormElement>) {
  if (event && event.preventDefault) {
    event.preventDefault();
  }
}

interface Props {
  engine: Engine,
  viewpoint?: Viewpoint,
  restoreViewpoint: (vp: Viewpoint) => void,
}

interface GradientPivot {
  value: number,
  color: string,
  id: string,
}

function Controls({ engine, viewpoint, restoreViewpoint }: Props) {

  const [maxPrecision, setMaxPrecision] = useState(100);
  const [numColors, setNumColors] = useState(50);
  const [insideColor, setInsideColor] = useState<string>('#000000');
  const [gradient, setGradient] = useState<GradientPivot[]>([
    { id: _.uniqueId('gradient-pivot-'), value: 0, color: '#000000' },
    { id: _.uniqueId('gradient-pivot-'), value: numColors, color: '#ff00ff' },
  ]);
  const [serializedViewpoint, setSerializedViewpoint] = useState("");

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

  const onSetNumColors = useCallback(
    (numColors: number) => {
      let n = engine.set_iteration_limit(numColors);
      setNumColors(n);
      setPivotValue(gradient.length - 1, n);
    },
    [engine, gradient, setPivotValue],
  );

  const onReduceMaxPrecision = useCallback(
    () => {
      setMaxPrecision(maxPrecision / 2);
      onSetNumColors(numColors / 2);
    },
    [maxPrecision, numColors, onSetNumColors]
  );

  const onIncreaseMaxPrecision = useCallback(
    () => {
      if (numColors >= maxPrecision) {
        const newMax = maxPrecision * 2;
        setMaxPrecision(newMax);
        onSetNumColors(newMax);
      } else {
        onSetNumColors(maxPrecision);
      }
    },
    [maxPrecision, numColors, onSetNumColors]
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

        <div className={ styles['Precision-Slider'] }>
          <button
            type="button"
            disabled={ maxPrecision <= 100 }
            onClick={ onReduceMaxPrecision }
          >
            -
          </button>
          <input
            max={ maxPrecision }
            min={ 10 }
            onChange={ ({ target: { value } }) => onSetNumColors(parseInt(value, 10)) }
            step={ Math.max(maxPrecision / 100, 10) }
            type="range"
            value={ numColors }
          />
          <button
            type="button"
            onClick={ onIncreaseMaxPrecision }
          >
            +
          </button>
          <span>
            { numColors }
          </span>
        </div>

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

        { viewpoint &&
          <>
            <p>
              Center: { viewpoint.center.x } + {viewpoint.center.y}i
            </p>
            <p>
              Scale: { viewpoint.scale } units/px
            </p>
            <p>
              Viewpoint:
            </p>
            <pre>
              { viewpoint.serialize() }
            </pre>
            <p>
              <input
                type="text"
                value={ serializedViewpoint }
                onChange={ ({ target: { value } }) => setSerializedViewpoint(value) }
              />
              <button
                type="button"
                onClick={ () => {
                  const restored = Viewpoint.deserialize(serializedViewpoint);
                  if (restored) {
                    restoreViewpoint(restored);
                  }
                }}
              >
                Restore
              </button>
            </p>
          </>
        }
      </div>
    </form>
  </div>;
}

export default Controls;
