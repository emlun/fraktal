import React from 'react';
import Complex from 'complex.js';
import Immutable from 'immutable';
import _ from 'underscore';
import { sprintf } from 'sprintf-js';

import * as mandelbrot from 'fractals/mandelbrot';


function getLimits({ center, scale, W, H }) {
  const aspectRatio = H / W;
  const w = scale;
  const h = scale * aspectRatio;
  const topLeft = center.add(new Complex(-w/2, h/2));
  const btmRight = center.add(new Complex(w/2, -h/2));
  return { topLeft, btmRight };
}

function computeMatrix(W, H, center, scale) {
  console.log('computeMatrix', W, H, center, scale);

  const { topLeft, btmRight } = getLimits({ center, scale, W, H });

  return Immutable.Range(0, W).toJS().map(x =>
    Immutable.Range(0, H).toJS().map(y => {
      const c = new Complex(
        (btmRight.re - topLeft.re) * (x / W) + topLeft.re,
        (btmRight.im - topLeft.im) * (y / H) + topLeft.im
      );

      return mandelbrot.check(c);
    })
  );
}

function renderPixels(imageData, matrix, palette) {
  console.log('renderPixels', imageData, matrix, palette.toJS());

  const W = Math.min(imageData.width, matrix.length);
  const H = Math.min(imageData.height, matrix[0] ? matrix[0].length : 0);

  for (let x = 0; x < W; x += 1) {
    for (let y = 0; y < H; y += 1) {
      const iterations = matrix[x][y];

      if (iterations > 0) {
        imageData.data[y * W * 4 + x * 4] = palette.getIn([0, iterations], 0);
        imageData.data[y * W * 4 + x * 4 + 1] = palette.getIn([1, iterations], 0);
        imageData.data[y * W * 4 + x * 4 + 2] = palette.getIn([2, iterations], 0);
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
        matrix: [[]],
        scale: 2.5,
        status: undefined,
      }),
    };
  }

  get(path) {
    return this.state.state.getIn(path);
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

  getLimits() {
    return getLimits({
      center: this.get(['center']),
      scale: this.get(['scale']),
      W: this.get(['dimensions', 'width']),
      H: this.get(['dimensions', 'height']),
    });
  }

  updateCanvas(canvas) {
    if (canvas && canvas !== this.canvas) {
      this.canvas = canvas;
      this.canvas.addEventListener('mouseup', this.onClick.bind(this));
      this.canvas.addEventListener('wheel', this.onWheel.bind(this));
    }
  }

  renderPixels() {
    if (this.canvas) {
      console.log('About to render pixels...');

      const palette = Immutable.Range(0, 3).map(c =>
        Immutable.Range(0, 256).map(i =>
          (this.get(['gradient', 'top', c]) - this.get(['gradient', 'bottom', c])) * (i / 255.0) + this.get(['gradient', 'bottom', c])
        )
      );

      const ctx = this.canvas.getContext('2d');

      _.defer(() => {
        const imageData = renderPixels(
          ctx.getImageData(0, 0, this.get(['dimensions', 'width']), this.get(['dimensions', 'height'])),
          this.get(['matrix']),
          palette
        );

        ctx.putImageData(imageData, 0, 0);
        ctx.save();
      });
    }
  }

  computeMatrix() {
    this.set(['status'], 'Computing...');

    console.log('About to compute matrix...');

    _.defer(() => {
      const matrix = computeMatrix(
        this.get(['dimensions', 'width']),
        this.get(['dimensions', 'height']),
        this.get(['center']),
        this.get(['scale'])
      );

      console.log('Saving matrix', matrix);

      this.update(state =>
        state.set('status', undefined)
          .set('matrix', matrix)
      );
    });
  }

  onClick(event) {
    console.log('onClick', event, event.offsetX, event.offsetY);
    this.update(state =>
      state.set(
        'center',
        state.get('center').add(
          new Complex(
            (event.offsetX / state.getIn(['dimensions', 'width']) - 0.5) * state.get('scale'),
            (0.5 - event.offsetY / state.getIn(['dimensions', 'height'])) * state.get('scale') * (state.getIn(['dimensions', 'height']) / state.getIn(['dimensions', 'width']))
          )
        )
      )
    );
  }

  onSubmit(event) {
    if (event && event.preventDefault) {
      event.preventDefault();
    }
    this.computeMatrix();
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
    this.update(['scale'], scale => scale / 2);
  }

  zoomOut() {
    this.update(['scale'], scale => scale * 2);
  }

  componentWillUpdate(newProps, newState) {
    if (
      newState.state.get('center') !== this.get(['center'])
        || newState.state.get('scale') !== this.get(['scale'])
    ) {
      this.computeMatrix();
    }
    if (
      newState.state.get('matrix') !== this.get(['matrix'])
        || newState.state.get('gradient') !== this.get(['gradient'])
    ) {
      this.renderPixels();
    }
  }

  render() {
    console.log('render', this.state);
    return <div>
      <canvas
        width={ this.get(['dimensions', 'width']) }
        height={ this.get(['dimensions', 'height']) }
        ref={ this.updateCanvas.bind(this) }
      />

      <form onSubmit={ this.onSubmit.bind(this) }>
        <p> Center: { this.get(['center']).toString() } </p>
        <p> Scale: { this.get(['scale']) } </p>
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
              ({ target: { value } }) => this.set(['dimensions', 'width'], parseInt(value || 0))
            }
            value={ this.get(['dimensions', 'width']) }
          />
        </p>
        <p>
          Height: <input type="number"
            onChange={
              ({ target: { value } }) => this.set(['dimensions', 'height'], parseInt(value || 0))
            }
            value={ this.get(['dimensions', 'height']) }
          />
        </p>
        <p> { this.get(['status']) } </p>

        <p>
          Gradient top:
          <input type="color"
            value={ '#' + this.get(['gradient', 'top']).map(d => sprintf('%02x', d)).join('') }
            onChange={
              ({ target: { value } }) =>
                this.set(['gradient', 'top'],
                  Immutable.List([
                    parseInt(value.substring(1, 3), 16),
                    parseInt(value.substring(3, 5), 16),
                    parseInt(value.substring(5, 7), 16),
                  ])
                )
            }
          />
        </p>

      </form>

    </div>;
  }

}
