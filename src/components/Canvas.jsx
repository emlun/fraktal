import React from 'react';
import PropTypes from 'prop-types';
import Complex from 'complex.js';
import Immutable from 'immutable';
import _ from 'underscore';

import * as fractals from 'fractals/common';
import { debug } from 'logging';

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
    this.onWheel = this.onWheel.bind(this);
    this.updateCanvas = this.updateCanvas.bind(this);
  }

  componentDidMount() {
    this.renderPixels();
  }

  componentWillReceiveProps(newProps) {
    if (_.any(['insideColor', 'gradient', 'matrix'],
      name => newProps.state.get(name) !== this.props.state.get(name))
    ) {
      this.renderPixels();
    }
  }

  updateCanvas(canvas) {
    if (canvas && canvas !== this.canvas) {
      this.canvas = canvas;
      this.canvas.addEventListener('mouseup', this.onClick);
      this.canvas.addEventListener('wheel', this.onWheel);
    }
    this.renderPixels();
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

  onWheel(event) {
    debug('onWheel', event);
    if (event.deltaY > 0) {
      this.props.onZoomOut();
    } else {
      this.props.onZoomIn();
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
    </div>;
  }

}
Canvas.propTypes = {
  state: PropTypes.object.isRequired,
  update: PropTypes.func.isRequired,
  onZoomIn: PropTypes.func.isRequired,
  onZoomOut: PropTypes.func.isRequired,
};

export default class CanvasContainer extends React.Component {

  constructor(props) {
    super(props);

    this.computeMatrix = _.throttle(this.computeMatrix.bind(this), 500);
    this.update = this.update.bind(this);
  }

  componentDidMount() {
    this.computeMatrix();
  }

  componentDidUpdate(prevProps) {
    if (_.any(['center', 'fractal', 'scale'], name => prevProps.state.get(name) !== this.get([name]))) {
      this.computeMatrix();
    }
  }

  componentWillUnmount() {
    if (this.worker) {
      this.worker.terminate();
    }
  }

  get(path, defaultValue) {
    return this.props.state.getIn(path, defaultValue);
  }

  set(path, value) {
    return this.update(state => state.setIn(path, value));
  }

  update(pathOrUpdater, updater) {
    return this.props.update(pathOrUpdater, updater);
  }

  computeMatrix() {
    debug('About to compute matrix...');
    this.set(['computing'], true);
    debug('Status set.');

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
      onZoomIn={ this.props.onZoomIn }
      onZoomOut={ this.props.onZoomOut }
      state={ this.props.state }
      update={ this.update }
    />;
  }

}
CanvasContainer.propTypes = {
  state: PropTypes.object.isRequired,
  update: PropTypes.func.isRequired,
  onZoomIn: PropTypes.func.isRequired,
  onZoomOut: PropTypes.func.isRequired,
};
