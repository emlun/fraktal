import React from 'react';
import Complex from 'complex.js';
import Immutable from 'immutable';

import * as fractals from 'fractals/common';

import Canvas from 'components/Canvas';
import Controls from 'components/Controls';
import GithubCorner from 'components/GithubCorner';

import './App.css';


export default class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      state: Immutable.Map({
        center: new Complex(-0.5, 0),
        computing: false,
        computeProgress: 0,
        dimensions: Immutable.fromJS({
          height: 400,
          width: 400,
        }),
        fractal: 'mandelbrot',
        fractalParameters: Immutable.Map(),
        gradient: Immutable.fromJS([
          fractals.defaultGradientBottom,
          fractals.defaultGradientTop,
        ]),
        insideColor: Immutable.fromJS([0, 0, 0]),
        numColors: 50,
        matrix: [[]],
        scale: 3,
      }),
    };

    this.update = this.update.bind(this);
    this.zoomIn = this.zoomIn.bind(this);
    this.zoomOut = this.zoomOut.bind(this);
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
    return fractals.getLimits({
      center: this.state.state.get('center'),
      scale: this.state.state.get('scale'),
      W: this.state.state.getIn(['dimensions', 'width']),
      H: this.state.state.getIn(['dimensions', 'height']),
    });
  }

  zoomIn() {
    this.update(['scale'], scale => scale / 2);
  }

  zoomOut() {
    this.update(['scale'], scale => scale * 2);
  }

  render() {
    return <div styleName="wrapper">
      <div styleName="main">
        <GithubCorner
          fillColor="#626262"
          repo="emlun/fraktal"
        />
        <Canvas
          onZoomIn={ this.zoomIn }
          onZoomOut={ this.zoomOut }
          state={ this.state.state }
          update={ this.update }
        />
        <Controls
          fractalParametersControls={
            fractals.getFractal(this.state.state.get('fractal')).ParameterControls
          }
          limits={ this.getLimits() }
          onChange={ newState => this.update(() => newState) }
          onZoomIn={ this.zoomIn }
          onZoomOut={ this.zoomOut }
          state={ this.state.state }
        />
      </div>

      <footer styleName="footer">
        <div>
          <a href="https://emlun.se/">
            { 'emlun.se' }
          </a>
        </div>
        <div styleName="middle">
          { `${PROJECT_NAME} ${VERSION}` }
        </div>
        <div/>
      </footer>
    </div>;
  }

}
