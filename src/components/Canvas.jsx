import React from 'react';
import Complex from 'complex.js';
import Immutable from 'immutable';
import _ from 'underscore';
import { sprintf } from 'sprintf-js';

import * as fractals from 'fractals/common';
import { debug } from 'logging';

import ComplexInput from 'components/ComplexInput';
import ProgressBar from 'components/ProgressBar';


function renderPixels(imageData, matrix, palette, insideColor = [0, 0, 0]) { // eslint-disable-line max-params, max-statements
  const W = imageData.width;
  const H = imageData.height;

  for (let x = 0; x < W; x += 1) {
    for (let y = 0; y < H; y += 1) {
      const iterations = (matrix[x] || [])[y] || 0;

      if (iterations > 0) {
        imageData.data[(y * W * 4) + (x * 4)] = palette.getIn([0, iterations], 255);
        imageData.data[(y * W * 4) + (x * 4) + 1] = palette.getIn([1, iterations], 255);
        imageData.data[(y * W * 4) + (x * 4) + 2] = palette.getIn([2, iterations], 255);
      } else {
        [
          imageData.data[(y * W * 4) + (x * 4)],
          imageData.data[(y * W * 4) + (x * 4) + 1],
          imageData.data[(y * W * 4) + (x * 4) + 2],
        ] = insideColor;
      }
      imageData.data[(y * W * 4) + (x * 4) + 3] = 255;
    }
  }

  return imageData;
}

function parseColor(hexString) {
  return Immutable.List([
    parseInt(hexString.substring(1, 3), 16),
    parseInt(hexString.substring(3, 5), 16),
    parseInt(hexString.substring(5, 7), 16),
  ]);
}

export default class Canvas extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      state: Immutable.Map({
        center: new Complex(-0.5, 0),
        computing: false,
        computeProgress: 0,
        dimensions: Immutable.fromJS({
          height: 400,
          width: 400,
        }),
        fractal: 'mandelbrot',
        fractalParameters: Immutable.Map(),
        gradient: Immutable.fromJS([
          fractals.defaultGradientBottom,
          fractals.defaultGradientTop,
        ]),
        insideColor: Immutable.fromJS([0, 0, 0]),
        numColors: 50,
        matrix: [[]],
        scale: 3,
      }),
    };
  }

  componentDidMount() {
    this.computeMatrix();
  }

  componentDidUpdate(prevProps, prevState) {
    if (_.any(['center', 'fractal', 'scale'], name => prevState.state.get(name) !== this.get([name]))) {
      this.computeMatrix();
    }
    if (_.any(['matrix', 'gradient'], name => prevState.state.get(name) !== this.get([name]))) {
      this.renderPixels();
    }
  }

  componentWillUnmount() {
    if (this.worker) {
      this.worker.terminate();
    }
  }

  get(path, defaultValue) {
    return this.state.state.getIn(path, defaultValue);
  }

  set(path, value) {
    return this.setState(state => ({
      state: state.state.setIn(path, value),
    }));
  }

  update(pathOrUpdater, updater) {
    if (updater) {
      return this.setState(state => ({
        state: state.state.updateIn(pathOrUpdater, updater),
      }));
    } else {
      return this.setState(state => ({
        state: pathOrUpdater(state.state),
      }));
    }
  }

  getLimits() {
    return fractals.getLimits({
      center: this.get(['center']),
      scale: this.get(['scale']),
      W: this.get(['dimensions', 'width']),
      H: this.get(['dimensions', 'height']),
    });
  }

  updateCanvas(canvas) {
    if (canvas && canvas !== this.canvas) {
      this.canvas = canvas;
      this.canvas.addEventListener('mouseup', this.onClick.bind(this));
      this.canvas.addEventListener('wheel', this.onWheel.bind(this));
    }
    this.renderPixels();
  }

  computeMatrix() {
    debug('About to compute matrix...');
    this.set(['computing'], true);

    if (this.worker) {
      this.worker.terminate();
    }

    this.worker = new Worker('worker.js');
    this.worker.onmessage = this.onWorkerMessage.bind(this);
    this.worker.postMessage({
      type: 'compute-matrix',
      data: {
        center: this.get(['center']),
        dimensions: this.get(['dimensions']).toJS(),
        fractal: this.get(['fractal']),
        fractalParameters: this.get(['fractalParameters']).toJS(),
        iterationLimit: this.get(['numColors']) - 1,
        scale: this.get(['scale']),
      },
    });
  }

  zoomIn() {
    this.update(['scale'], scale => scale / 2);
  }

  zoomOut() {
    this.update(['scale'], scale => scale * 2);
  }

  onClick(event) {
    debug('onClick', event, event.offsetX, event.offsetY);
    this.update(state =>
      state.set(
        'center',
        state.get('center').add(
          new Complex(
            ((event.offsetX / state.getIn(['dimensions', 'width'])) - 0.5) * state.get('scale'),
            (0.5 - (event.offsetY / state.getIn(['dimensions', 'height']))) * state.get('scale') * (state.getIn(['dimensions', 'height']) / state.getIn(['dimensions', 'width']))
          )
        )
      )
    );
  }

  onComputationCompleted(matrix) {
    debug('Saving matrix', matrix);

    this.update(state =>
      state
        .set('computing', false)
        .set('computeProgress', 0)
        .set('matrix', matrix)
    );
  }

  onSubmit(event) {
    if (event && event.preventDefault) {
      event.preventDefault();
    }
    this.computeMatrix();
  }

  onWheel(event) {
    debug('onWheel', event);
    if (event.deltaY > 0) {
      this.zoomOut();
    } else {
      this.zoomIn();
    }
  }

  onWorkerMessage(message) {
    switch (message.data.type) {
      case 'compute-matrix':
        this.onComputationCompleted(message.data.data);
        break;

      case 'compute-matrix-progress':
        if (this.get(['computing'])) {
          this.set(['computeProgress'], message.data.data.completed / message.data.data.total);
        }
        break;

      default:
        debug('Ignoring message from worker:', message);
    }
  }

  renderPixels() {
    if (this.canvas && !this.rendering) {
      this.rendering = true;

      const palette = fractals.computePalette(this.get(['gradient']), this.get(['numColors']));

      const ctx = this.canvas.getContext('2d');

      _.defer(() => {
        const imageData = renderPixels(
          ctx.getImageData(0, 0, this.get(['dimensions', 'width']), this.get(['dimensions', 'height'])),
          this.get(['matrix']),
          Immutable.fromJS(palette.toJS()),
          this.get(['insideColor']).toJS()
        );

        ctx.putImageData(imageData, 0, 0);
        ctx.save();
        this.rendering = false;
      });
    }
  }

  render() {
    const FractalParameters = fractals.getFractal(this.get(['fractal'])).ParameterControls;

    return <div>
      <canvas
        ref={ this.updateCanvas.bind(this) }
        height={ this.get(['dimensions', 'height']) }
        width={ this.get(['dimensions', 'width']) }
      />
      <ProgressBar
        max={ 1 }
        value={ this.get(['computeProgress'], 0) }
        width={ `${this.get(['dimensions', 'width'])}px` }
      />

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
            onClick={ this.zoomOut.bind(this) }
            type="button"
          >
            { 'Zoom out' }
          </button>
          <button
            onClick={ this.zoomIn.bind(this) }
            type="button"
          >
            { 'Zoom in' }
          </button>
        </p>
        <p>
          { `Top left: ${this.getLimits().topLeft.toString()}` }
        </p>
        <p>
          { `Bottom right: ${this.getLimits().btmRight.toString()}` }
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
            <div key={ index }>
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
                        this.get(['gradient', Math.max(-Infinity, index - 1), 'value'], 0)
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
                      .set('value', Math.round((pivot.get('value') + next.get('value')) / 2.0))
                      .set('color', pivot.get('color').zipWith((c1, c2) => Math.round((c1 + c2) / 2.0), next.get('color')));

                    this.update(['gradient'], gradient => gradient.insert(index + 1, middle));
                  } else {
                    this.update(['gradient'], gradient => gradient.insert(index, gradient.get(index)));
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
