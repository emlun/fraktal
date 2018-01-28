import React from 'react';
import PropTypes from 'prop-types';
import Complex from 'complex.js';
import Immutable from 'immutable';
import _ from 'underscore';

import * as fractals from 'fractals/common';
import { debug } from 'logging';

import Controls from 'components/Controls';
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

class Canvas extends React.Component {

  constructor(props) {
    super(props);
    this.onClick = this.onClick.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.onWheel = this.onWheel.bind(this);
    this.updateCanvas = this.updateCanvas.bind(this);
    this.zoomIn = this.zoomIn.bind(this);
    this.zoomOut = this.zoomOut.bind(this);
  }

  componentDidMount() {
    this.renderPixels();
  }

  componentDidUpdate(prevProps, prevState) {
    if (_.any(['insideColor', 'gradient', 'matrix'],
      name => prevProps.state.get(name) !== this.props.state.get(name))
    ) {
      this.renderPixels();
    }
  }

  componentWillUnmount() {
    if (this.worker) {
      this.worker.terminate();
    }
  }

  getLimits() {
    return fractals.getLimits({
      center: this.props.state.get('center'),
      scale: this.props.state.get('scale'),
      W: this.props.state.getIn(['dimensions', 'width']),
      H: this.props.state.getIn(['dimensions', 'height']),
    });
  }

  updateCanvas(canvas) {
    if (canvas && canvas !== this.canvas) {
      this.canvas = canvas;
      this.canvas.addEventListener('mouseup', this.onClick);
      this.canvas.addEventListener('wheel', this.onWheel);
    }
    this.renderPixels();
  }

  zoomIn() {
    this.props.update(['scale'], scale => scale / 2);
  }

  zoomOut() {
    this.props.update(['scale'], scale => scale * 2);
  }

  onClick(event) {
    debug('onClick', event, event.offsetX, event.offsetY);
    this.props.update(state =>
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

  onSubmit(event) {
    if (event && event.preventDefault) {
      event.preventDefault();
    }
    this.props.onRender();
  }

  onWheel(event) {
    debug('onWheel', event);
    if (event.deltaY > 0) {
      this.zoomOut();
    } else {
      this.zoomIn();
    }
  }

  renderPixels() {
    if (this.canvas && !this.rendering) {
      this.rendering = true;

      const palette = fractals.computePalette(
        this.props.state.get('gradient'),
        this.props.state.get('numColors')
      );

      const ctx = this.canvas.getContext('2d');

      _.defer(() => {
        const imageData = renderPixels(
          ctx.getImageData(
            0,
            0,
            this.props.state.getIn(['dimensions', 'width']),
            this.props.state.getIn(['dimensions', 'height'])
          ),
          this.props.state.get('matrix'),
          Immutable.fromJS(palette.toJS()),
          this.props.state.get('insideColor').toJS()
        );

        ctx.putImageData(imageData, 0, 0);
        ctx.save();
        this.rendering = false;
      });
    }
  }

  render() {
    return <div>
      <canvas
        ref={ this.updateCanvas }
        height={ this.props.state.getIn(['dimensions', 'height']) }
        width={ this.props.state.getIn(['dimensions', 'width']) }
      />
      <ProgressBar
        max={ 1 }
        value={ this.props.state.get('computeProgress', 0) }
        width={ `${this.props.state.getIn(['dimensions', 'width'])}px` }
      />

      <Controls
        fractalParametersControls={
          fractals.getFractal(this.props.state.get('fractal')).ParameterControls
        }
        limits={ this.getLimits() }
        onChange={ newState => this.props.update(() => newState) }
        onSubmit={ this.onSubmit }
        onZoomIn={ this.zoomIn }
        onZoomOut={ this.zoomOut }
        state={ this.props.state }
      />
    </div>;
  }

}
Canvas.propTypes = {
  state: PropTypes.object.isRequired,
  update: PropTypes.func.isRequired,

  onRender: PropTypes.func.isRequired,
};

export default class CanvasContainer extends React.Component {

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

    this.computeMatrix = _.debounce(this.computeMatrix.bind(this), 500);
    this.update = this.update.bind(this);
  }

  componentDidMount() {
    this.computeMatrix();
  }

  componentDidUpdate(prevProps, prevState) {
    if (_.any(['center', 'fractal', 'scale'], name => prevState.state.get(name) !== this.get([name]))) {
      this.computeMatrix();
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

  onComputationCompleted(matrix) {
    debug('Saving matrix', matrix);

    this.update(state =>
      state
        .set('computing', false)
        .set('computeProgress', 0)
        .set('matrix', matrix)
    );
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

  render() {
    return <Canvas
      onRender={ this.computeMatrix }
      state={ this.state.state }
      update={ this.update }
    />;
  }

}
