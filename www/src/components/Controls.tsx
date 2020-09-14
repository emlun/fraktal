import React from 'react';
import * as ReactRedux from 'react-redux';
import { sprintf } from 'sprintf-js';

import * as rootActions from 'actions';
import * as colorsActions from 'actions/colors';
import { Color, GradientPivot } from 'data/Colors';

import styles from './Controls.module.css';


function onSubmit(event: React.FormEvent<HTMLFormElement>) {
  if (event && event.preventDefault) {
    event.preventDefault();
  }
}

interface Props {
  gradient: GradientPivot[],
  insideColor: Color,
  numColors: number,

  onAddGradientPivot: (index: number) => {},
  onDeleteGradientPivot: (index: number) => {},
  onSetInsideColor: (color: string) => {},
  onSetNumColors: (num: number) => {},
  onSetPivotColor: (index: number, color: string) => {},
  onSetPivotValue: (index: number, value: number) => {},
}

function Controls({
  gradient,
  insideColor,
  numColors,

  onAddGradientPivot,
  onDeleteGradientPivot,
  onSetInsideColor,
  onSetNumColors,
  onSetPivotColor,
  onSetPivotValue,
}: Props) {
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
            pivot.color
              .map(d => sprintf('%02x', d))
              .join('')
          }`;

          return <div
            key={ pivot.id }
            className={ styles['Gradient-Row'] }
          >
            <input
              max={ numColors - 1 }
              min={ 0 }
              onChange={
                ({ target: { value } }) => onSetPivotValue(index, parseInt(value, 10))
              }
              type="range"
              value={ pivot.value }
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
    </form>
  </div>;
}

export default ReactRedux.connect(
  state => ({
    gradient: state.colors.gradient,
    insideColor: state.colors.inside,
    numColors: state.numColors,
  }),
  {
    onAddGradientPivot: colorsActions.addPivot,
    onDeleteGradientPivot: colorsActions.deletePivot,
    onSetInsideColor: colorsActions.setInsideColor,
    onSetNumColors: rootActions.setNumColors,
    onSetPivotColor: colorsActions.setPivotColor,
    onSetPivotValue: colorsActions.setPivotValue,
  }
)(Controls);
