import React from 'react';
import * as ReactRedux from 'react-redux';
import PropTypes from 'prop-types';

import * as fractals from 'fractals/common';
import { debug } from 'logging';
import { computeNumberAt } from 'util/view';

import * as viewpointActions from 'actions/viewpoint';
import Viewpoint from 'data/Viewpoint';

import { memory } from 'fraktal-wasm/fraktal_bg';

import styles from './Canvas.css';


class Canvas extends React.Component {

  static propTypes = {
    viewpoint: PropTypes.instanceOf(Viewpoint).isRequired,
    onSetCenter: PropTypes.func.isRequired,
    onZoomIn: PropTypes.func.isRequired,
    onZoomOut: PropTypes.func.isRequired,

    panTriggerThreshold: PropTypes.number,
  };

  static defaultProps = {
    panTriggerThreshold: 10,
  };

  constructor(props) { // eslint-disable-line max-statements
    super(props);

    this.state = {
      mousePos: null,
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
    this.updateWrapper = this.updateWrapper.bind(this);
  }

  componentDidMount() {
    const renderLoop = () => {
      fractals.engine.compute(100000);
      this.drawPixels();
      window.requestAnimationFrame(renderLoop);
    };
    this.stopRenderLoop = window.requestAnimationFrame(renderLoop);
  }

  componentWillUnmount() {
    if (this.renderLoop) {
      window.cancelAnimationFrame(this.renderLoop);
    }
  }

  drawPixels() {
    if (this.ctx && this.imageData) {
      fractals.engine.render();
      this.ctx.putImageData(this.imageData, 0, 0);
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

      const imd = new Uint8ClampedArray(
        memory.buffer,
        fractals.engine.image_data(),
        this.canvas.width * this.canvas.height * 4
      );
      console.log('imd:', imd);

      this.imageData = new ImageData(
        imd,
        this.canvas.width,
      );
      console.log('imd set!');
    }
  }

  updateCanvasSize() {
    debug('updateCanvasSize', this.canvas.height, this.canvas.width, this.canvas.offsetHeight, this.canvas.offsetWidth);
    this.canvas.height = this.canvas.offsetHeight;
    this.canvas.width = this.canvas.offsetWidth;
    fractals.setView({
      dimensions: { height: this.canvas.height, width: this.canvas.width },
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
      const { viewpoint } = this.props;

      const center = computeNumberAt({
        center: viewpoint.get('center'),
        dimensions,
        scale: viewpoint.get('scale'),
        x: (dimensions.width / 2) - offset.x,
        y: (dimensions.height / 2) - offset.y,
      });

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
    </div>;
  }
}

export default ReactRedux.connect(
  state => ({
    viewpoint: state.get('viewpoint'),
  }),
  {
    onSetCenter: viewpointActions.setCenter,
    onZoomIn: viewpointActions.zoomIn,
    onZoomOut: viewpointActions.zoomOut,
  }
)(Canvas);
