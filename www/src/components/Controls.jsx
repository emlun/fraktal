import React from 'react';
import * as ReactRedux from 'react-redux';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { sprintf } from 'sprintf-js';

import * as fractals from 'fractals/common';

import * as rootActions from 'actions';
import * as colorsActions from 'actions/colors';

import styles from './Controls.css';


function onSubmit(event) {
  if (event && event.preventDefault) {
    event.preventDefault();
  }
}

function Controls({
  fractal,
  fractalParameters,
  fractalParametersControls: FractalParameters,
  gradient,
  insideColor,
  numColors,

  onAddGradientPivot,
  onDeleteGradientPivot,
  onSetFractal,
  onSetFractalParameters,
  onSetInsideColor,
  onSetNumColors,
  onSetPivotColor,
  onSetPivotValue,
}) {
  return <div>
    <form onSubmit={ onSubmit }>
      <div>
        <p>
          Number of color values:
        </p>
        <p>
          <input
            max={ 1000 }
            min={ 10 }
            onChange={ ({ target: { value } }) => onSetNumColors(parseInt(value, 10)) }
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
          const colorHex = `#${
            pivot.get('color')
              .map(d => sprintf('%02x', d))
              .join('')
          }`;

          return <div
            key={ pivot.get('id') }
            className={ styles['Gradient-Row'] }
          >
            <input
              max={ numColors - 1 }
              min={ 0 }
              onChange={
                ({ target: { value } }) => onSetPivotValue(index, parseInt(value, 10))
              }
              type="range"
              value={ pivot.get('value') }
            />
            <input
              onChange={ ({ target: { value } }) => onSetPivotColor(index, value) }
              type="color"
              value={ colorHex }
            />
            <button
              onClick={ () => onAddGradientPivot(index) }
              type="button"
            >
              +
            </button>
            <button
              onClick={ () => onDeleteGradientPivot(index) }
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
            value={
              `#${
                insideColor
                  .map(d => sprintf('%02x', d))
                  .join('')
              }`
            }
          />
        </p>
      </div>

      <div>
        { 'Fractal: ' }
        <select
          onChange={ ({ target: { value } }) => onSetFractal(value) }
          value={ fractal }
        >
          { ['julia', 'mandelbrot'].map(fractalOption =>
            <option
              key={ fractalOption }
              value={ fractalOption }
            >
              { fractals.getFractal(fractalOption).name }
            </option>
          ) }
        </select>
      </div>

      <FractalParameters
        onChange={ onSetFractalParameters }
        parameters={ fractalParameters }
      />
    </form>
  </div>;
}
Controls.propTypes = {
  fractal: PropTypes.string.isRequired,
  fractalParameters: PropTypes.instanceOf(Immutable.Record).isRequired,
  fractalParametersControls: PropTypes.oneOfType([PropTypes.element, PropTypes.func]).isRequired,
  gradient: ImmutablePropTypes.listOf(
    ImmutablePropTypes.contains({
      color: ImmutablePropTypes.listOf(PropTypes.number).isRequired,
      id: PropTypes.string.isRequired,
      value: PropTypes.number.isRequired,
    })
  ).isRequired,
  insideColor: PropTypes.instanceOf(Immutable.List).isRequired,
  numColors: PropTypes.number.isRequired,

  onAddGradientPivot: PropTypes.func.isRequired,
  onDeleteGradientPivot: PropTypes.func.isRequired,
  onSetFractal: PropTypes.func.isRequired,
  onSetFractalParameters: PropTypes.func.isRequired,
  onSetInsideColor: PropTypes.func.isRequired,
  onSetNumColors: PropTypes.func.isRequired,
  onSetPivotColor: PropTypes.func.isRequired,
  onSetPivotValue: PropTypes.func.isRequired,
};

export default ReactRedux.connect(
  state => ({
    fractal: state.get('fractal'),
    fractalParameters: state.get('fractalParameters'),
    fractalParametersControls: fractals.getFractal(state.get('fractal')).ParameterControls,
    gradient: state.getIn(['colors', 'gradient']),
    insideColor: state.getIn(['colors', 'inside']),
    numColors: state.get('numColors'),
  }),
  {
    onAddGradientPivot: colorsActions.addPivot,
    onDeleteGradientPivot: colorsActions.deletePivot,
    onSetFractal: rootActions.setFractal,
    onSetFractalParameters: rootActions.setFractalParameters,
    onSetInsideColor: colorsActions.setInsideColor,
    onSetNumColors: rootActions.setNumColors,
    onSetPivotColor: colorsActions.setPivotColor,
    onSetPivotValue: colorsActions.setPivotValue,
  }
)(Controls);
