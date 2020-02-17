import React from 'react';
import * as ReactRedux from 'react-redux';
import PropTypes from 'prop-types';

import { debug } from 'logging';

import * as viewpointActions from 'actions/viewpoint';

import { memory } from 'fraktal-wasm/fraktal_bg';

import styles from './Canvas.css';


class Canvas extends React.Component {

  static propTypes = {
    engine: PropTypes.shape({
      compute: PropTypes.func.isRequired,
      image_data: PropTypes.func.isRequired,
      render: PropTypes.func.isRequired,
      set_size: PropTypes.func.isRequired,
    }).isRequired,

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
      this.props.engine.compute(100000);
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
      this.props.engine.render();
      const { x, y } = this.getRenderOffset();
      this.ctx.putImageData(this.imageData, x, y);
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
        this.props.engine.image_data(),
        this.canvas.width * this.canvas.height * 4
      );

      this.imageData = new ImageData(
        imd,
        this.canvas.width,
      );
    }
  }

  updateCanvasSize() {
    debug('updateCanvasSize', this.canvas.width, this.canvas.height, this.canvas.offsetWidth, this.canvas.offsetHeight);
    this.canvas.width = this.canvas.offsetWidth;
    this.canvas.height = this.canvas.offsetHeight;
    this.props.engine.set_size(this.canvas.width, this.canvas.height);
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
      const { x, y } = this.getRenderOffset();
      const { width: w, height: h } = this.getDimensions();
      this.props.onSetCenter({
        x: x / w,
        y: y / h,
        aspectRatio: w / h,
      });
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
  }),
  {
    onSetCenter: viewpointActions.setCenter,
    onZoomIn: viewpointActions.zoomIn,
    onZoomOut: viewpointActions.zoomOut,
  }
)(Canvas);
