import React, { useCallback, useState } from 'react';

import { Engine, EngineSettings, GradientPivot } from 'fraktal-wasm/fraktal';

import CollapseBox from 'components/CollapseBox';
import Presets from 'components/Presets';

import styles from './Controls.module.css';
import sidebarStyles from './Sidebar.module.css';


function onSubmit(event: React.FormEvent<HTMLFormElement>) {
  if (event && event.preventDefault) {
    event.preventDefault();
  }
}

interface Props {
  engine: Engine,
  settings: EngineSettings,
  updateSettings: (settings: EngineSettings) => void,
}

function Controls({ engine, settings, updateSettings }: Props) {

  const gradient = settings.get_gradient();
  const numColors = settings.get_iteration_limit();

  const [maxPrecision, setMaxPrecision] = useState(Math.max(100, numColors));
  const [serializedSettings, setSerializedSettings] = useState("");
  const [restoreError, setRestoreError] = useState("");

  const stateString = engine.serialize_settings();
  const stateHref = window.location.origin + window.location.pathname + '?state=' + stateString;

  const setPivotValue = useCallback(
    (index, value) => {
      updateSettings(engine.gradient_set_pivot_value(index, value));
    },
    [engine],
  );

  const onSetNumColors = useCallback(
    (numColors: number) => {
      updateSettings(engine.set_iteration_limit(numColors));
    },
    [engine],
  );

  const onReduceMaxPrecision = useCallback(
    () => {
      setMaxPrecision(maxPrecision / 2);
      onSetNumColors(numColors / 2);
    },
    [numColors, onSetNumColors]
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
      updateSettings(engine.gradient_set_pivot_color(index, color));
    },
    [engine],
  );

  const addGradientPivot = useCallback(
    (index) => {
      updateSettings(engine.gradient_insert_pivot(index));
    },
    [engine],
  );

  const deleteGradientPivot = useCallback(
    (index) => {
      updateSettings(engine.gradient_delete_pivot(index));
    },
    [engine],
  );

  const onSetInsideColor = useCallback(
    (color) => {
      updateSettings(engine.gradient_set_inside_color(color));
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
        { Array.from(Array(gradient.len_pivots()).keys()).map((index: number) => {
          const pivot = gradient.get_pivot(index) as GradientPivot;
          const colorHex = pivot.color.as_hex();

          return <div
            key={ index }
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
            value={ gradient.get_inside_color().as_hex() }
          />
        </p>

        <p style={{ textAlign: 'center' }}>
          <button
            type="button"
            onClick={ () => engine.zoom_out() }
            style={{ marginRight: '1em' }}
          >
            Zoom out
          </button>
          <button type="button" onClick={ () => engine.zoom_in() }>
            Zoom in
          </button>
        </p>

        <CollapseBox title="Presets">
          <Presets current={ stateString } />
        </CollapseBox>

        <p>
          Viewing range: <pre style={{ whiteSpace: 'break-spaces' }}>{ engine.describe_range() }</pre>
        </p>

        <div className={ styles['Controls-Legend'] }>
          <p>
            Pan: Click and drag
          </p>
          <p>
            Zoom around pointer: Mouse wheel, double click
          </p>
          <p>
            Static zoom: <kbd>Shift</kbd> + Mouse wheel
          </p>
        </div>

        <div style={{ textAlign: 'center' }}>
          <a className={ sidebarStyles['button'] } href={ stateHref }>Share this view</a>
        </div>
      </div>
    </form>
  </div>;
}

export default Controls;
