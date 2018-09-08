import React from 'react';
import * as ReactRedux from 'react-redux';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import _ from 'underscore';

import * as fractals from 'fractals/common';
import { debug } from 'logging';
import { computeNumberAt } from 'util/view';

import * as viewpointActions from 'actions/viewpoint';
import * as workerActions from 'actions/worker';
import Colors from 'data/Colors';
import Viewpoint from 'data/Viewpoint';

import ProgressBar from 'components/ProgressBar';

import './Canvas.css';


function renderPixels( // eslint-disable-line max-params, max-statements
    imageData,
    matrix,
    palette,
    insideColor = [0, 0, 0],
    offset = { x: 0, y: 0 }
) {
  const W = imageData.width;
  const H = imageData.height;

  for (let x = 0; x < W; x += 1) {
    for (let y = 0; y < H; y += 1) {
      const iterations = (matrix[x - offset.x] || [])[y - offset.y] || 0;
      const X = x * 4;
      const Y = y * W * 4;

      if (iterations > 0) {
        imageData.data[Y + X] = palette.getIn([0, iterations], 255);
        imageData.data[Y + X + 1] = palette.getIn([1, iterations], 255);
        imageData.data[Y + X + 2] = palette.getIn([2, iterations], 255);
      } else {
        [
          imageData.data[Y + X],
          imageData.data[Y + X + 1],
          imageData.data[Y + X + 2],
        ] = insideColor;
      }
      imageData.data[Y + X + 3] = 255;
    }
  }

  return imageData;
}

class Canvas extends React.Component {

  constructor(props) { // eslint-disable-line max-statements
    super(props);

    this.state = {
      lastComputedViewpoint: props.viewpoint,
      mousePos: null,
      savedOffset: null,
      scrollStartPos: null,
    };

    this.getDimensions = this.getDimensions.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onWheel = this.onWheel.bind(this);
    this.onWindowResize = this.onWindowResize.bind(this);
    this.updateCanvas = this.updateCanvas.bind(this);
    this.updateCanvasSize = this.updateCanvasSize.bind(this);
    this.updateWrapper = this.updateWrapper.bind(this);
  }

  componentDidMount() {
    this.renderPixels();
  }

  componentWillReceiveProps(newProps) {
    if (newProps.matrix !== this.props.matrix) {
      this.setState({
        lastComputedViewpoint: newProps.viewpoint,
        savedOffset: null,
      });
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.colors !== this.props.colors
      || prevProps.matrix !== this.props.matrix
      || prevState.mousePos !== this.state.mousePos
      || prevState.scrollStartPos !== this.state.scrollStartPos
    ) {
      this.renderPixels();
    }
  }

  getScrollOffset() {
    if (this.state.scrollStartPos && this.state.mousePos) {
      return {
        x: this.state.mousePos.x - this.state.scrollStartPos.x,
        y: this.state.mousePos.y - this.state.scrollStartPos.y,
      };
    } else {
      return { x: 0, y: 0 };
    }
  }

  getRenderOffset() {
    const savedOffset = this.state.savedOffset || { x: 0, y: 0 };
    const scrollOffset = this.getScrollOffset();
    return {
      x: savedOffset.x + scrollOffset.x,
      y: savedOffset.y + scrollOffset.y,
    };
  }

  getDimensions() {
    return {
      height: this.canvas.height,
      width: this.canvas.width,
    };
  }

  updateCanvas(canvas) {
    if (canvas && canvas !== this.canvas) {
      this.canvas = canvas;
      this.updateCanvasSize();
    }
    this.renderPixels();
  }

  updateCanvasSize() {
    debug('updateCanvasSize', this.canvas.height, this.canvas.width, this.canvas.offsetHeight, this.canvas.offsetWidth);
    this.canvas.height = this.canvas.offsetHeight;
    this.canvas.width = this.canvas.offsetWidth;
    this.props.onChangeSize({
      height: this.canvas.height,
      width: this.canvas.width,
    });
  }

  updateWrapper(wrapper) {
    if (wrapper && wrapper !== this.wrapper) {
      this.wrapper = wrapper;
      this.wrapper.addEventListener('mousedown', this.onMouseDown);
      this.wrapper.addEventListener('mousemove', this.onMouseMove);
      this.wrapper.addEventListener('mouseup', this.onMouseUp);
      this.wrapper.addEventListener('wheel', this.onWheel);
      window.addEventListener('resize', this.onWindowResize);
    }
  }

  onMouseDown(event) {
    const pos = { x: event.offsetX, y: event.offsetY };
    this.setState({
      scrollStartPos: pos,
      mousePos: pos,
    });
  }

  onMouseMove(event) {
    if (this.state.scrollStartPos) {
      this.setState({ mousePos: { x: event.offsetX, y: event.offsetY } });
    }
  }

  onMouseUp(event) {
    const scrollOffset = this.getScrollOffset();

    if (Math.sqrt(Math.pow(scrollOffset.x, 2) + Math.pow(scrollOffset.y, 2)) >= this.props.panTriggerThreshold) {
      const offset = this.getRenderOffset();

      const dimensions = this.getDimensions();

      const viewpoint = this.state.lastComputedViewpoint; // eslint-disable-line react/no-access-state-in-setstate
      const center = computeNumberAt({
        center: viewpoint.get('center'),
        dimensions,
        scale: viewpoint.get('scale'),
        x: (dimensions.width / 2) - offset.x,
        y: (dimensions.height / 2) - offset.y,
      });

      this.props.onSetCenter(center);

      this.setState({
        scrollStartPos: null,
        savedOffset: offset,
      });
    } else {
      this.setState({ scrollStartPos: null });
    }
  }

  onWheel(event) {
    debug('onWheel', event);
    if (event.deltaY > 0) {
      this.props.onZoomOut();
    } else {
      this.props.onZoomIn();
    }
  }

  onWindowResize(event) {
    debug('onWindowResize', event, this.canvas.offsetWidth, this.canvas.offsetHeight);
    this.updateCanvasSize();
  }

  renderPixels() {
    if (this.canvas) {
      if (this.rendering) {
        this.renderPixelsQueued = true;
      } else {
        this.rendering = true;

        const palette = fractals.computePalette(
          this.props.colors.get('gradient'),
          this.props.numColors
        );

        const ctx = this.canvas.getContext('2d');

        _.defer(() => {
          const imageData = renderPixels(
            ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height),
            this.props.matrix,
            Immutable.fromJS(palette.toJS()),
            this.props.colors.get('inside').toJS(),
            this.getRenderOffset()
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
    return <div
      ref={ this.updateWrapper }
      styleName="Canvas-Container"
    >
      <canvas
        ref={ this.updateCanvas }
        styleName="main-canvas"
      />
      <ProgressBar
        max={ 1 }
        value={ this.props.computeProgress }
      />
    </div>;
  }

}
Canvas.propTypes = {
  colors: PropTypes.instanceOf(Colors).isRequired,
  computeProgress: PropTypes.number.isRequired,
  matrix: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)).isRequired,
  numColors: PropTypes.number.isRequired,
  panTriggerThreshold: PropTypes.number.isRequired,
  viewpoint: PropTypes.instanceOf(Viewpoint).isRequired,

  onChangeSize: PropTypes.func.isRequired,
  onSetCenter: PropTypes.func.isRequired,
  onZoomIn: PropTypes.func.isRequired,
  onZoomOut: PropTypes.func.isRequired,
};

class CanvasContainer extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      computeProgress: 0,
    };
    this.computing = false;

    this.computeMatrix = this.computeMatrix.bind(this);
  }

  componentDidMount() {
    this.computeMatrix();
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.fractal !== this.props.fractal
      || prevProps.fractalParameters !== this.props.fractalParameters
      || prevProps.numColors !== this.props.numColors
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

  computeMatrix() {
    debug('About to compute matrix...');
    this.computing = true;

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
        iterationLimit: this.props.numColors - 1,
        scale: this.props.viewpoint.get('scale'),
      },
    });
  }

  onWorkerMessage(message) {
    switch (message.data.type) {
      case 'compute-matrix':
        this.setState({ computeProgress: 0 });
        this.props.onComputationCompleted(message.data.data);
        this.computing = false;
        break;

      case 'compute-matrix-progress':
        if (this.computing) {
          this.setState({ computeProgress: message.data.data.completed / message.data.data.total });
        }
        break;

      default:
        debug('Ignoring message from worker:', message);
    }
  }

  render() {
    return <Canvas
      colors={ this.props.colors }
      computeProgress={ this.state.computeProgress }
      matrix={ this.props.matrix }
      numColors={ this.props.numColors }
      onChangeSize={ this.props.onCanvasChangeSize }
      onSetCenter={ this.props.onSetCenter }
      onZoomIn={ this.props.onZoomIn }
      onZoomOut={ this.props.onZoomOut }
      panTriggerThreshold={ 10 }
      viewpoint={ this.props.viewpoint }
    />;
  }

}
CanvasContainer.propTypes = {
  colors: PropTypes.instanceOf(Colors).isRequired,
  fractal: PropTypes.string.isRequired,
  fractalParameters: PropTypes.instanceOf(Immutable.Record).isRequired,
  matrix: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)).isRequired,
  numColors: PropTypes.number.isRequired,
  viewpoint: PropTypes.instanceOf(Viewpoint).isRequired,

  onCanvasChangeSize: PropTypes.func.isRequired,
  onComputationCompleted: PropTypes.func.isRequired,
  onSetCenter: PropTypes.func.isRequired,
  onZoomIn: PropTypes.func.isRequired,
  onZoomOut: PropTypes.func.isRequired,
};

export default ReactRedux.connect(
  state => ({
    colors: state.get('colors'),
    fractal: state.get('fractal'),
    fractalParameters: state.get('fractalParameters'),
    matrix: state.getIn(['worker', 'matrix']),
    numColors: state.get('numColors'),
    viewpoint: state.get('viewpoint'),
  }),
  {
    onSetCenter: viewpointActions.setCenter,
    onCanvasChangeSize: viewpointActions.setDimensions,
    onComputationCompleted: workerActions.computationCompleted,
    onZoomIn: viewpointActions.zoomIn,
    onZoomOut: viewpointActions.zoomOut,
  }
)(CanvasContainer);
