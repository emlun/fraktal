import React from 'react';
import Complex from 'complex.js';
import _ from 'underscore';

import * as mandelbrot from 'fractals/mandelbrot';

const W = 300;
const H = 200;

function getLimits({ center, scale, W, H }) {
  const aspectRatio = H / W;
  const w = scale;
  const h = scale * aspectRatio;
  const topLeft = center.add(new Complex(-w/2, h/2));
  const btmRight = center.add(new Complex(w/2, -h/2));
  return { topLeft, btmRight };
}

function renderPixels(imageData, center, scale) {
  console.log('renderPixels', center, scale);

  const W = imageData.width;
  const H = imageData.height;
  const { topLeft, btmRight } = getLimits({ center, scale, W, H });

  for (let x = 0; x < W; x += 1) {
    for (let y = 0; y < H; y += 1) {
      const c = new Complex(
        (btmRight.re - topLeft.re) * (x / W) + topLeft.re,
        (btmRight.im - topLeft.im) * (y / H) + topLeft.im
      );

      const iterations = mandelbrot.check(c);
      const color = iterations > 0 ? iterations : 0;

      imageData.data[y * W * 4 + x * 4] = color;
      imageData.data[y * W * 4 + x * 4 + 1] = color;
      imageData.data[y * W * 4 + x * 4 + 2] = color;
      imageData.data[y * W * 4 + x * 4 + 3] = 255;
    }
  }

  return imageData;
}

export default class Canvas extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      center: new Complex(-0.5, 0),
      scale: 2.5,
      status: undefined,
    };
  }

  getLimits() {
    return getLimits({ center: this.state.center, scale: this.state.scale, W, H });
  }

  updateCanvas(canvas) {
    console.log('updateCanvas', canvas, this.canvas);

    if (canvas && canvas !== this.canvas) {
      this.canvas = canvas;
      this.canvas.addEventListener('mouseup', this.onClick.bind(this));
      this.canvas.addEventListener('wheel', this.onWheel.bind(this));
    }
  }

  renderPixels() {
    if (this.canvas) {
      const ctx = this.canvas.getContext('2d');
      this.setState({ status: 'Computing...' });

      console.log('About to render pixels...');

      _.defer(() => {
        const imageData = renderPixels(
          ctx.getImageData(0, 0, W, H),
          this.state.center,
          this.state.scale
        );

        console.log('Saving pixels', imageData);

        ctx.putImageData(imageData, 0, 0);
        ctx.save();
        this.setState({ status: undefined });
      });
    }
  }

  onClick(event) {
    console.log('onClick', event, event.offsetX, event.offsetY);
    this.setState(state => ({
      center: state.center.add(
        new Complex(
          (event.offsetX / W - 0.5) * state.scale,
          (0.5 - event.offsetY / H) * state.scale * (H / W)
        )
      ),
    }));
  }

  onWheel(event) {
    console.log('onWheel', event);
    if (event.deltaY > 0) {
      this.zoomOut();
    } else {
      this.zoomIn();
    }
  }

  zoomIn() {
    this.setState(state => ({ scale: state.scale / 2 }));
  }

  zoomOut() {
    this.setState(state => ({ scale: state.scale * 2 }));
  }

  componentWillUpdate(newProps, newState) {
    if (
      newState.center !== this.state.center
        || newState.scale !== this.state.scale
    ) {
      this.renderPixels();
    }
  }

  render() {
    console.log('render', this.state);
    return <div>
      <canvas
        width={ W }
        height={ H }
        ref={ this.updateCanvas.bind(this) }
      />
      <p> Center: { this.state.center.toString() } </p>
      <p> Scale: { this.state.scale } </p>
      <p>
        <button onClick={ this.zoomOut.bind(this) }> Zoom out </button>
        <button onClick={ this.zoomIn.bind(this) }> Zoom in </button>
      </p>
      <p> Top left: { this.getLimits().topLeft.toString() } </p>
      <p> Bottom right: { this.getLimits().btmRight.toString() } </p>
      <button onClick={ this.renderPixels.bind(this) } > Render </button>
      <p> { this.state.status } </p>
    </div>;
  }

}
