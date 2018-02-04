import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import * as fractals from 'fractals/common';

import Canvas from 'components/Canvas';
import Controls from 'components/Controls';
import GithubCorner from 'components/GithubCorner';

import './App.css';


class App extends React.Component {

  constructor(props) {
    super(props);

    this.update = this.update.bind(this);
    this.zoomIn = this.zoomIn.bind(this);
    this.zoomOut = this.zoomOut.bind(this);
  }

  update(pathOrUpdater, updater) {
    if (updater) {
      this.props.onSetState(this.props.state.updateIn(pathOrUpdater, updater));
    } else {
      this.props.onSetState(this.props.state.update(pathOrUpdater));
    }
  }

  getLimits() {
    return fractals.getLimits({
      center: this.props.state.get('center'),
      scale: this.props.state.get('scale'),
      W: this.props.state.getIn(['dimensions', 'width']),
      H: this.props.state.getIn(['dimensions', 'height']),
    });
  }

  zoomIn() {
    this.update(['scale'], scale => scale / 2);
    this.props.onZoomIn();
  }

  zoomOut() {
    this.update(['scale'], scale => scale * 2);
    this.props.onZoomOut();
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
          state={ this.props.state }
          update={ this.update }
        />
        <Controls
          fractalParametersControls={
            fractals.getFractal(this.props.state.get('fractal')).ParameterControls
          }
          limits={ this.getLimits() }
          onChange={ newState => this.update(() => newState) }
          onZoomIn={ this.zoomIn }
          onZoomOut={ this.zoomOut }
          state={ this.props.state }
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
App.propTypes = {
  state: PropTypes.object.isRequired,
  onSetState: PropTypes.func.isRequired,
  onZoomIn: PropTypes.func.isRequired,
  onZoomOut: PropTypes.func.isRequired,
};

const AppContainer = connect(
  state => ({
    state,
  }),
  dispatch => ({
    onSetState: state =>
      dispatch({
        type: 'SET_STATE',
        state,
      }),
    onZoomIn: () => dispatch({ type: 'ZOOM_IN' }),
    onZoomOut: () => dispatch({ type: 'ZOOM_OUT' }),
  })
)(App);
export default AppContainer;
