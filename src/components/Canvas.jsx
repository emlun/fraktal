import React from 'react';
import * as ReactRedux from 'react-redux';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import _ from 'underscore';

import * as fractals from 'fractals/common';
import { debug } from 'logging';

import * as viewpointActions from 'actions/viewpoint';
import AppState from 'data/AppState';
import Viewpoint from 'data/Viewpoint';

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

  componentDidUpdate(prevProps) {
    if (_.any(['colors', 'matrix'],
      name => prevProps.state.get(name) !== this.props.state.get(name))
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
    this.props.onCenterView(event.offsetX, event.offsetY);
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
    if (this.canvas) {
      if (this.rendering) {
        this.renderPixelsQueued = true;
      } else {
        this.rendering = true;

        const palette = fractals.computePalette(
          this.props.state.getIn(['colors', 'gradient']),
          this.props.state.get('numColors')
        );

        const ctx = this.canvas.getContext('2d');

        _.defer(() => {
          const imageData = renderPixels(
            ctx.getImageData(
              0,
              0,
              this.props.viewpoint.getIn(['dimensions', 'width']),
              this.props.viewpoint.getIn(['dimensions', 'height'])
            ),
            this.props.state.get('matrix'),
            Immutable.fromJS(palette.toJS()),
            this.props.state.getIn(['colors', 'inside']).toJS()
          );

          ctx.putImageData(imageData, 0, 0);
          ctx.save();
          this.rendering = false;

          if (this.renderPixelsQueued) {
            this.renderPixelsQueued = false;
            this.renderPixels();
          }
        });
      }
    }
  }

  render() {
    return <div>
      <canvas
        ref={ this.updateCanvas }
        height={ this.props.viewpoint.getIn(['dimensions', 'height']) }
        width={ this.props.viewpoint.getIn(['dimensions', 'width']) }
      />
      <ProgressBar
        max={ 1 }
        value={ this.props.state.get('computeProgress', 0) }
        width={ `${this.props.viewpoint.getIn(['dimensions', 'width'])}px` }
      />
    </div>;
  }

}
Canvas.propTypes = {
  state: PropTypes.instanceOf(AppState).isRequired,
  viewpoint: PropTypes.instanceOf(Viewpoint).isRequired,
  onCenterView: PropTypes.func.isRequired,
  onZoomIn: PropTypes.func.isRequired,
  onZoomOut: PropTypes.func.isRequired,
};

class CanvasContainer extends React.Component {

  constructor(props) {
    super(props);

    this.computeMatrix = _.throttle(this.computeMatrix.bind(this), 500);
    this.update = this.update.bind(this);
  }

  componentDidMount() {
    this.computeMatrix();
  }

  componentDidUpdate(prevProps) {
    if (
      _.any(['viewpoint', 'fractal', 'fractalParameters', 'numColors'],
        name => prevProps.state.get(name) !== this.get([name]))
      || prevProps.viewpoint !== this.props.viewpoint
    ) {
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
        center: this.props.viewpoint.get('center'),
        dimensions: this.props.viewpoint.get('dimensions').toJS(),
        fractal: this.props.fractal,
        fractalParameters: this.props.fractalParameters.toJS(),
        iterationLimit: this.get(['numColors']) - 1,
        scale: this.props.viewpoint.get('scale'),
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
      onCenterView={ this.props.onCenterView }
      onZoomIn={ this.props.onZoomIn }
      onZoomOut={ this.props.onZoomOut }
      state={ this.props.state }
      viewpoint={ this.props.viewpoint }
    />;
  }

}
CanvasContainer.propTypes = {
  fractal: PropTypes.string.isRequired,
  fractalParameters: PropTypes.instanceOf(Immutable.Record).isRequired,
  state: PropTypes.instanceOf(AppState).isRequired,
  update: PropTypes.func.isRequired,
  viewpoint: PropTypes.instanceOf(Viewpoint).isRequired,
  onCenterView: PropTypes.func.isRequired,
  onZoomIn: PropTypes.func.isRequired,
  onZoomOut: PropTypes.func.isRequired,
};

export default ReactRedux.connect(
  state => ({
    fractal: state.get('fractal'),
    fractalParameters: state.get('fractalParameters'),
    viewpoint: state.get('viewpoint'),
  }),
  dispatch => ({
    onCenterView: (x, y) => dispatch(viewpointActions.centerView(x, y)),
    onZoomIn: () => dispatch(viewpointActions.zoomIn()),
    onZoomOut: () => dispatch(viewpointActions.zoomOut()),
  })
)(CanvasContainer);
