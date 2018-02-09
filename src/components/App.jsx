import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import * as fractals from 'fractals/common';
import AppState from 'data/AppState';

import Canvas from 'components/Canvas';
import Controls from 'components/Controls';
import GithubCorner from 'components/GithubCorner';

import './App.css';


class App extends React.Component {

  constructor(props) {
    super(props);

    this.update = this.update.bind(this);
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
      center: this.props.state.getIn(['viewpoint', 'center']),
      scale: this.props.state.getIn(['viewpoint', 'scale']),
      W: this.props.state.getIn(['viewpoint', 'dimensions', 'width']),
      H: this.props.state.getIn(['viewpoint', 'dimensions', 'height']),
    });
  }

  render() {
    return <div styleName="wrapper">
      <div styleName="main">
        <GithubCorner
          fillColor="#626262"
          repo="emlun/fraktal"
        />
        <Canvas
          state={ this.props.state }
          update={ this.update }
        />
        <Controls
          fractalParametersControls={
            fractals.getFractal(this.props.state.get('fractal')).ParameterControls
          }
          limits={ this.getLimits() }
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
  state: PropTypes.instanceOf(AppState).isRequired,
  onSetState: PropTypes.func.isRequired,
};

const AppContainer = connect(
  state => ({
    state,
  }),
  {
    onSetState: state => ({
      type: 'SET_STATE',
      state,
    }),
  }
)(App);
export default AppContainer;
