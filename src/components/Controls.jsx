import React from 'react';
import * as ReactRedux from 'react-redux';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { sprintf } from 'sprintf-js';

import * as fractals from 'fractals/common';
import * as propTypes from 'util/prop-types';

import * as rootActions from 'actions';
import * as colorsActions from 'actions/colors';
import * as viewpointActions from 'actions/viewpoint';
import Viewpoint from 'data/Viewpoint';

import ComplexInput from 'components/ComplexInput';


class Controls extends React.Component {

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
  }

  render() {
    const FractalParameters = this.props.fractalParametersControls;

    return <div>
      <form onSubmit={ this.onSubmit.bind(this) }>
        <p>
          { 'Center: ' }
          <ComplexInput
            onChange={ this.props.onSetCenter }
            value={ this.props.viewpoint.get('center') }
          />
        </p>
        <p>
          { `Scale: ${this.props.viewpoint.get('scale')}` }
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
        <p>
          { 'Width: ' }
          <input
            onChange={
              ({ target: { value } }) => this.props.onSetWidth(parseInt(value || 0, 10))
            }
            type="number"
            value={ this.props.viewpoint.getIn(['dimensions', 'width']) }
          />
        </p>
        <p>
          { 'Height: ' }
          <input
            onChange={
              ({ target: { value } }) => this.props.onSetHeight(parseInt(value || 0, 10))
            }
            type="number"
            value={ this.props.viewpoint.getIn(['dimensions', 'height']) }
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
              onChange={ ({ target: { value } }) => this.props.onSetNumColors(parseInt(value, 10)) }
              step={ 10 }
              type="range"
              value={ this.get(['numColors']) }
            />
            { this.get(['numColors']) }
          </p>

          <p>
            { 'Gradient:' }
          </p>
          { this.props.gradient.map((pivot, index) =>
            <div key={ pivot.get('id') }>
              <input
                max={ this.get(['numColors']) - 1 }
                min={ 0 }
                onChange={
                  ({ target: { value } }) => this.props.onSetPivotValue(index, parseInt(value, 10))
                }
                type="range"
                value={ pivot.get('value') }
              />
              <input
                onChange={ ({ target: { value } }) => this.props.onSetPivotColor(index, value) }
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
                onClick={ () => this.props.onAddGradientPivot(index) }
                type="button"
              >
                { '+' }
              </button>
              <button
                onClick={ () => this.props.onDeleteGradientPivot(index) }
                type="button"
              >
                { '-' }
              </button>
            </div>
          ) }

          <p>
            { 'Color inside set: ' }
            <input
              onChange={ ({ target: { value } }) => this.props.onSetInsideColor(value) }
              type="color"
              value={
                `#${
                  this.get(['colors', 'inside'])
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
            onChange={ ({ target: { value } }) => this.props.onSetFractal(value) }
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
          onChange={ this.props.onSetFractalParameters }
          parameters={ this.get(['fractalParameters']) }
        />
      </form>
    </div>;
  }

}
Controls.propTypes = {
  fractalParametersControls: PropTypes.oneOfType([PropTypes.element, PropTypes.func]).isRequired,
  gradient: ImmutablePropTypes.listOf(
    ImmutablePropTypes.contains({
      color: ImmutablePropTypes.listOf(PropTypes.number).isRequired,
      id: PropTypes.string.isRequired,
      value: PropTypes.number.isRequired,
    })
  ).isRequired,
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
  viewpoint: PropTypes.instanceOf(Viewpoint).isRequired,

  onAddGradientPivot: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  onDeleteGradientPivot: PropTypes.func.isRequired,
  onSetCenter: PropTypes.func.isRequired,
  onSetFractal: PropTypes.func.isRequired,
  onSetFractalParameters: PropTypes.func.isRequired,
  onSetHeight: PropTypes.func.isRequired,
  onSetInsideColor: PropTypes.func.isRequired,
  onSetNumColors: PropTypes.func.isRequired,
  onSetPivotColor: PropTypes.func.isRequired,
  onSetPivotValue: PropTypes.func.isRequired,
  onSetWidth: PropTypes.func.isRequired,
  onZoomIn: PropTypes.func.isRequired,
  onZoomOut: PropTypes.func.isRequired,
};

export default ReactRedux.connect(
  state => ({
    gradient: state.getIn(['colors', 'gradient']),
    viewpoint: state.get('viewpoint'),
  }),
  {
    onAddGradientPivot: colorsActions.addPivot,
    onDeleteGradientPivot: colorsActions.deletePivot,
    onSetCenter: viewpointActions.setCenter,
    onSetFractal: rootActions.setFractal,
    onSetFractalParameters: rootActions.setFractalParameters,
    onSetHeight: viewpointActions.setHeight,
    onSetInsideColor: colorsActions.setInsideColor,
    onSetNumColors: rootActions.setNumColors,
    onSetPivotColor: colorsActions.setPivotColor,
    onSetPivotValue: colorsActions.setPivotValue,
    onSetWidth: viewpointActions.setWidth,
    onZoomIn: viewpointActions.zoomIn,
    onZoomOut: viewpointActions.zoomOut,
  }
)(Controls);
