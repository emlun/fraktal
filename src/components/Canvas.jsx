import React from 'react';

const W = 500;
const H = 400;

export default class Canvas extends React.Component {

  updateCanvas(canvas) {
    console.log('updateCanvas', canvas);

    const ctx = canvas.getContext('2d');

    const x = 250;
    const y = 200;

    const imageData = ctx.getImageData(x, y, 1, 1);

    imageData.data[0] = 0;
    imageData.data[1] = 0;
    imageData.data[2] = 0;
    imageData.data[3] = 255;

    ctx.putImageData(imageData, x, y);
    ctx.save();
  }

  render() {
    return <canvas width={ W } height={ H } ref={ this.updateCanvas.bind(this) }>
    </canvas>;
  }

}
