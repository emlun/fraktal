import React from 'react';
import * as ReactRedux from 'react-redux';
import PropTypes from 'prop-types';
import Immutable from 'immutable';

import * as fractals from 'fractals/common';
import { debug } from 'logging';
import { computeNumberAt } from 'util/view';

import * as viewpointActions from 'actions/viewpoint';
import Colors from 'data/Colors';
import Viewpoint from 'data/Viewpoint';

import ProgressBar from 'components/ProgressBar';

import styles from './Canvas.css';


function renderColumns( // eslint-disable-line max-params, max-statements
    imageData,
    matrix,
    xInit,
    xWidth,
    palette,
    insideColor = [0, 0, 0],
) {
  const W = xWidth;
  const H = imageData.height;

  for (let x = 0; x < xWidth; x += 1) {
    const column = matrix[(xInit + x) % matrix.length];

    for (let y = 0; y < H; y += 1) {
      const iterations = column[y] || 0;
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

  static propTypes = {
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

  constructor(props) { // eslint-disable-line max-statements
    super(props);

    this.state = {
      mousePos: null,
      scrollStartMatrix: null,
      scrollStartPos: null,
    };

    this.drawPixels = this.drawPixels.bind(this);
    this.getDimensions = this.getDimensions.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onWheel = this.onWheel.bind(this);
    this.onWindowResize = this.onWindowResize.bind(this);
    this.updateCanvas = this.updateCanvas.bind(this);
    this.updateCanvasSize = this.updateCanvasSize.bind(this);
    this.updatePalette = this.updatePalette.bind(this);
    this.updateWrapper = this.updateWrapper.bind(this);
  }

  componentDidMount() {
    const columnsAtATime = 20;
    const renderLoop = () => {
      const x = fractals.computeNextColumn();
      for (let i = 1; i < columnsAtATime; i += 1) {
        fractals.computeNextColumn();
      }
      if (x !== false) {
        this.drawPixels(x, columnsAtATime, fractals.matrix);
      }
      window.requestAnimationFrame(renderLoop);
    };
    this.stopRenderLoop = window.requestAnimationFrame(renderLoop);
  }

  componentDidUpdate() {
    this.updatePalette();
  }

  componentWillUnmount() {
    if (this.renderLoop) {
      window.cancelAnimationFrame(this.renderLoop);
    }
  }

  drawPixels(x, xWidth, matrix) {
    if (this.ctx && matrix) {
      const imageData = renderColumns(
        this.ctx.getImageData(x, 0, xWidth, this.ctx.canvas.height),
        matrix,
        x,
        xWidth,
        Immutable.fromJS(this.palette.toJS()),
        this.props.colors.get('inside').toJS()
      );

      this.ctx.putImageData(imageData, x, 0);
      this.ctx.save();
    }
  }

  getScrollOffset() {
    if (this.isKeepingScrollOffset() || (this.state.scrollStartPos && this.state.mousePos)) {
      return {
        x: this.state.mousePos.x - this.state.scrollStartPos.x,
        y: this.state.mousePos.y - this.state.scrollStartPos.y,
      };
    } else {
      return { x: 0, y: 0 };
    }
  }

  isKeepingScrollOffset() {
    return this.state.scrollStartMatrix === this.props.matrix;
  }

  getRenderOffset() {
    return this.getScrollOffset();
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
      this.ctx = this.canvas.getContext('2d');
    }
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

  updatePalette() {
    this.palette = fractals.computePalette(
      this.props.colors.get('gradient'),
      this.props.numColors
    );
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
      const { viewpoint } = this.props;

      const center = computeNumberAt({
        center: viewpoint.get('center'),
        dimensions,
        scale: viewpoint.get('scale'),
        x: (dimensions.width / 2) - offset.x,
        y: (dimensions.height / 2) - offset.y,
      });

      this.setState({ scrollStartMatrix: this.props.matrix });
      this.props.onSetCenter(center);
    }

    this.setState({ scrollStartPos: null });
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

  render() {
    return <div
      ref={ this.updateWrapper }
      className={ styles['Canvas-Container'] }
    >
      <canvas
        ref={ this.updateCanvas }
        className={ styles['main-canvas'] }
      />
      <ProgressBar
        max={ 1 }
        value={ this.props.computeProgress }
      />
    </div>;
  }

}

class CanvasContainer extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      computeProgress: 0,
    };
    this.computing = false;

    this.updateMatrixSettings = this.updateMatrixSettings.bind(this);
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.fractal !== this.props.fractal
      || prevProps.fractalParameters !== this.props.fractalParameters
      || prevProps.numColors !== this.props.numColors
      || prevProps.viewpoint !== this.props.viewpoint
    ) {
      this.updateMatrixSettings();
    }
  }

  updateMatrixSettings() {
    debug('Updating matrix settings...');

    fractals.setView({
      center: this.props.viewpoint.get('center'),
      dimensions: this.props.viewpoint.get('dimensions').toJS(),
      fractal: this.props.fractal,
      fractalParameters: this.props.fractalParameters.toJS(),
      iterationLimit: this.props.numColors - 1,
      scale: this.props.viewpoint.get('scale'),
    });
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
    onZoomIn: viewpointActions.zoomIn,
    onZoomOut: viewpointActions.zoomOut,
  }
)(CanvasContainer);
