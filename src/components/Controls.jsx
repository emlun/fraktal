import React from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import _ from 'underscore';
import { sprintf } from 'sprintf-js';

import * as fractals from 'fractals/common';
import * as propTypes from 'util/prop-types';

import ComplexInput from 'components/ComplexInput';


function parseColor(hexString) {
  return Immutable.List([
    parseInt(hexString.substring(1, 3), 16),
    parseInt(hexString.substring(3, 5), 16),
    parseInt(hexString.substring(5, 7), 16),
  ]);
}

export default class Controls extends React.Component {

  get(path, defaultValue) {
    return this.props.state.getIn(path, defaultValue);
  }

  set(path, value) {
    this.props.onChange(this.props.state.setIn(path, value));
  }

  update(pathOrUpdater, updater) {
    if (updater) {
      this.props.onChange(this.props.state.updateIn(pathOrUpdater, updater));
    } else {
      this.props.onChange(this.props.state.update(pathOrUpdater));
    }
  }

  onSubmit(event) {
    if (event && event.preventDefault) {
      event.preventDefault();
    }
    this.props.onSubmit();
  }

  render() {
    const FractalParameters = this.props.fractalParametersControls;

    return <div>
      <form onSubmit={ this.onSubmit.bind(this) }>
        <p>
          { 'Center: ' }
          <ComplexInput
            onChange={ newCenter => this.set(['center'], newCenter) }
            value={ this.get(['center']) }
          />
        </p>
        <p>
          { `Scale: ${this.get(['scale'])}` }
        </p>
        <p>
          <button
            onClick={ this.props.onZoomOut }
            type="button"
          >
            { 'Zoom out' }
          </button>
          <button
            onClick={ this.props.onZoomIn }
            type="button"
          >
            { 'Zoom in' }
          </button>
        </p>
        <p>
          { `Top left: ${this.props.limits.topLeft.toString()}` }
        </p>
        <p>
          { `Bottom right: ${this.props.limits.btmRight.toString()}` }
        </p>
        <button type="submit" >
          { 'Render' }
        </button>
        <p>
          { 'Width: ' }
          <input
            onChange={
              ({ target: { value } }) => this.set(['dimensions', 'width'], parseInt(value || 0, 10))
            }
            type="number"
            value={ this.get(['dimensions', 'width']) }
          />
        </p>
        <p>
          { 'Height: ' }
          <input
            onChange={
              ({ target: { value } }) => this.set(['dimensions', 'height'], parseInt(value || 0, 10))
            }
            type="number"
            value={ this.get(['dimensions', 'height']) }
          />
        </p>

        <div>
          <p>
            { 'Number of color values:' }
          </p>
          <p>
            <input
              max={ 1000 }
              min={ 10 }
              onChange={ ({ target: { value } }) => this.set(['numColors'], parseInt(value, 10)) }
              step={ 10 }
              type="range"
              value={ this.get(['numColors']) }
            />
            { this.get(['numColors']) }
          </p>

          <p>
            { 'Gradient:' }
          </p>
          { this.get(['gradient']).map((pivot, index) =>
            <div key={ pivot.get('id') }>
              <input
                max={ this.get(['numColors']) - 1 }
                min={ 0 }
                onChange={
                  ({ target: { value } }) =>
                    this.set(
                      ['gradient', index, 'value'],
                      Math.max(
                        Math.min(
                          parseInt(value, 10),
                          this.get(['gradient', index + 1, 'value'], Infinity)
                        ),
                        this.get(['gradient', index < 1 ? 'foo' : index - 1, 'value'], 0)
                      )
                    )
                }
                type="range"
                value={ pivot.get('value') }
              />
              <input
                onChange={ ({ target: { value } }) => this.set(['gradient', index, 'color'], parseColor(value)) }
                type="color"
                value={
                  `#${
                    pivot.get('color')
                      .map(d => sprintf('%02x', d))
                      .join('')
                  }`
                }
              />
              <button
                onClick={ () => {
                  const next = this.get(['gradient', index + 1]);
                  if (next) {
                    const middle = pivot
                      .set('id', _.uniqueId('gradient-pivot-'))
                      .set('value', Math.round((pivot.get('value') + next.get('value')) / 2.0))
                      .set('color', pivot.get('color').zipWith((c1, c2) => Math.round((c1 + c2) / 2.0), next.get('color')));

                    this.update(['gradient'], gradient => gradient.insert(index + 1, middle));
                  } else {
                    this.update(['gradient'], gradient =>
                      gradient.insert(index,
                        gradient.get(index)
                          .set('id', _.uniqueId('gradient-pivot-'))
                      )
                    );
                  }
                } }
                type="button"
              >
                { '+' }
              </button>
              <button
                onClick={ () => this.update(['gradient'], gradient => gradient.delete(index)) }
                type="button"
              >
                { '-' }
              </button>
            </div>
          ) }

          <p>
            { 'Color inside set: ' }
            <input
              onChange={ ({ target: { value } }) => this.set(['insideColor'], parseColor(value)) }
              type="color"
              value={
                `#${
                  this.get(['insideColor'])
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
            onChange={ ({ target: { value } }) =>
              this.update(state =>
                state
                  .set('fractal', value)
                  .set('fractalParameters', fractals.getFractal(value).defaultParameters)
              )
            }
            value={ this.get(['fractal']) }
          >
            { ['julia', 'mandelbrot'].map(fractal =>
              <option
                key={ fractal }
                value={ fractal }
              >
                { fractals.getFractal(fractal).name }
              </option>
            ) }
          </select>
        </div>

        <FractalParameters
          onChange={ parameters => this.set(['fractalParameters'], parameters) }
          parameters={ this.get(['fractalParameters']) }
        />
      </form>
    </div>;
  }

}
Controls.propTypes = {
  fractalParametersControls: PropTypes.oneOfType([PropTypes.element, PropTypes.func]).isRequired,
  limits: PropTypes.shape({
    btmRight: propTypes.complex.isRequired,
    topLeft: propTypes.complex.isRequired,
  }).isRequired,
  state: PropTypes.shape({
    getIn: PropTypes.func.isRequired,
    setIn: PropTypes.func.isRequired,
    update: PropTypes.func.isRequired,
    updateIn: PropTypes.func.isRequired,
  }).isRequired,

  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onZoomIn: PropTypes.func.isRequired,
  onZoomOut: PropTypes.func.isRequired,
};
