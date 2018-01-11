import React from 'react';
import Complex from 'complex.js';
import _ from 'underscore';

import * as mandelbrot from 'fractals/mandelbrot';


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
      dimensions: {
        height: 200,
        width: 300,
      },
      scale: 2.5,
      status: undefined,
    };
  }

  getLimits() {
    return getLimits({
      center: this.state.center,
      scale: this.state.scale,
      W: this.state.dimensions.width,
      H: this.state.dimensions.height,
    });
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
          ctx.getImageData(0, 0, this.state.dimensions.width, this.state.dimensions.height),
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
          (event.offsetX / this.state.dimensions.width - 0.5) * state.scale,
          (0.5 - event.offsetY / this.state.dimensions.height) * state.scale * (this.state.dimensions.height / this.state.dimensions.width)
        )
      ),
    }));
  }

  onSubmit(event) {
    if (event && event.preventDefault) {
      event.preventDefault();
    }
    this.renderPixels();
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
        width={ this.state.dimensions.width }
        height={ this.state.dimensions.height }
        ref={ this.updateCanvas.bind(this) }
      />

      <form onSubmit={ this.onSubmit.bind(this) }>
        <p> Center: { this.state.center.toString() } </p>
        <p> Scale: { this.state.scale } </p>
        <p>
          <button type="button" onClick={ this.zoomOut.bind(this) }> Zoom out </button>
          <button type="button" onClick={ this.zoomIn.bind(this) }> Zoom in </button>
        </p>
        <p> Top left: { this.getLimits().topLeft.toString() } </p>
        <p> Bottom right: { this.getLimits().btmRight.toString() } </p>
        <button type="submit" > Render </button>
        <p>
          Width: <input type="number"
            onChange={
              ({ target: { value } }) =>
                this.setState(state =>
                  ({
                    dimensions: {
                      ...state.dimensions,
                      width: parseInt(value),
                    },
                  })
                )
            }
            value={ this.state.dimensions.width }
          />
        </p>
        <p>
          Height: <input type="number"
            onChange={
              ({ target: { value } }) =>
                this.setState(state =>
                  ({
                    dimensions: {
                      ...state.dimensions,
                      height: parseInt(value),
                    },
                  })
                )
            }
            value={ this.state.dimensions.height }
          />
        </p>
        <p> { this.state.status } </p>
      </form>

    </div>;
  }

}
