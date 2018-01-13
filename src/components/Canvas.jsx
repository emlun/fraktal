import React from 'react';
import Complex from 'complex.js';
import Immutable from 'immutable';
import _ from 'underscore';

import * as mandelbrot from 'fractals/mandelbrot';


function range(length) {
  return Array(...Array(length)).map((_, i) => i);
}

function getLimits({ center, scale, W, H }) {
  const aspectRatio = H / W;
  const w = scale;
  const h = scale * aspectRatio;
  const topLeft = center.add(new Complex(-w/2, h/2));
  const btmRight = center.add(new Complex(w/2, -h/2));
  return { topLeft, btmRight };
}

function renderPixels(imageData, center, scale, palette) {
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

      if (iterations > 0) {
        imageData.data[y * W * 4 + x * 4] = palette[iterations][0];
        imageData.data[y * W * 4 + x * 4 + 1] = palette[iterations][1];
        imageData.data[y * W * 4 + x * 4 + 2] = palette[iterations][2];
      } else {
        imageData.data[y * W * 4 + x * 4] = 0;
        imageData.data[y * W * 4 + x * 4 + 1] = 0;
        imageData.data[y * W * 4 + x * 4 + 2] = 0;
      }
      imageData.data[y * W * 4 + x * 4 + 3] = 255;
    }
  }

  return imageData;
}

export default class Canvas extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      state: Immutable.Map({
        center: new Complex(-0.5, 0),
        dimensions: Immutable.fromJS({
          height: 200,
          width: 300,
        }),
        gradient: Immutable.fromJS({
          bottom: [0, 0, 0],
          top: [255, 255, 255],
        }),
        scale: 2.5,
        status: undefined,
      }),
    };
  }

  getLimits() {
    return getLimits({
      center: this.state.state.get('center'),
      scale: this.state.state.get('scale'),
      W: this.state.state.getIn(['dimensions', 'width']),
      H: this.state.state.getIn(['dimensions', 'height']),
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
      this.setState(state => ({ state: state.state.set('status', 'Computing...') }));

      console.log('About to render pixels...');

      const palette = range(256).map(i =>
        [
          (this.state.state.getIn(['gradient', 'top', 0]) - this.state.state.getIn(['gradient', 'bottom', 0])) * (i / 255.0) + this.state.state.getIn(['gradient', 'bottom', 0]),
          (this.state.state.getIn(['gradient', 'top', 1]) - this.state.state.getIn(['gradient', 'bottom', 1])) * (i / 255.0) + this.state.state.getIn(['gradient', 'bottom', 1]),
          (this.state.state.getIn(['gradient', 'top', 2]) - this.state.state.getIn(['gradient', 'bottom', 2])) * (i / 255.0) + this.state.state.getIn(['gradient', 'bottom', 2]),
        ]
      );

      _.defer(() => {
        const imageData = renderPixels(
          ctx.getImageData(0, 0, this.state.state.getIn(['dimensions', 'width']), this.state.state.getIn(['dimensions', 'height'])),
          this.state.state.get('center'),
          this.state.state.get('scale'),
          palette
        );

        console.log('Saving pixels', imageData);

        ctx.putImageData(imageData, 0, 0);
        ctx.save();
        this.setState(state => ({ state: state.state.set('status', undefined) }));
      });
    }
  }

  onClick(event) {
    console.log('onClick', event, event.offsetX, event.offsetY);
    this.setState(state => ({
      state: state.state.set(
        'center',
        state.state.get('center').add(
          new Complex(
            (event.offsetX / state.state.getIn(['dimensions', 'width']) - 0.5) * state.state.get('scale'),
            (0.5 - event.offsetY / state.state.getIn(['dimensions', 'height'])) * state.state.get('scale') * (state.state.getIn(['dimensions', 'height']) / state.state.getIn(['dimensions', 'width']))
          )
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
    this.setState(state => ({ state: state.state.update('scale', scale => scale / 2) }));
  }

  zoomOut() {
    this.setState(state => ({ state: state.state.update('scale', scale => scale * 2) }));
  }

  componentWillUpdate(newProps, newState) {
    if (
      newState.state.get('center') !== this.state.state.get('center')
        || newState.state.get('scale') !== this.state.state.get('scale')
    ) {
      this.renderPixels();
    }
  }

  render() {
    console.log('render', this.state);
    return <div>
      <canvas
        width={ this.state.state.getIn(['dimensions', 'width']) }
        height={ this.state.state.getIn(['dimensions', 'height']) }
        ref={ this.updateCanvas.bind(this) }
      />

      <form onSubmit={ this.onSubmit.bind(this) }>
        <p> Center: { this.state.state.get('center').toString() } </p>
        <p> Scale: { this.state.state.get('scale') } </p>
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
                this.setState(state => ({ state: state.state.setIn(['dimensions', 'width'], parseInt(value)) }))
            }
            value={ this.state.state.getIn(['dimensions', 'width']) }
          />
        </p>
        <p>
          Height: <input type="number"
            onChange={
              ({ target: { value } }) =>
                this.setState(state => ({ state: state.state.setIn(['dimensions', 'height'], parseInt(value)) }))
            }
            value={ this.state.state.getIn(['dimensions', 'height']) }
          />
        </p>
        <p> { this.state.state.get('status') } </p>

        <p>
          Gradient top:
          { [0, 1, 2].map(index =>
            <input type="number"
              key={ index }
              onChange={
                ({ target: { value } }) =>
                  this.setState(state => ({ state: state.state.setIn(['gradient', 'top', index], parseInt(value)) }))
              }
              value={ this.state.state.getIn(['gradient', 'top', index]) }
            />
          ) }
        </p>

      </form>

    </div>;
  }

}
