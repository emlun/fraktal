import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import AppState from 'data/AppState';

import Canvas from 'components/Canvas';
import Controls from 'components/Controls';
import GithubCorner from 'components/GithubCorner';

import './App.css';


function computeTreeRef() {
  if (VERSION.includes('-g')) {
    const [, commit] = VERSION.split('-g');
    return commit;
  } else {
    return VERSION;
  }
}


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
        <Controls/>
      </div>

      <footer styleName="footer">
        <div>
          <a href="https://emlun.se/">
            { 'emlun.se' }
          </a>
        </div>
        <div styleName="middle">
          { PROJECT_NAME }
          { ' ' }
          <a href={ `https://github.com/emlun/fraktal/tree/${computeTreeRef()}` }>
            { VERSION }
          </a>
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
