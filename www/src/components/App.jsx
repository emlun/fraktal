import React from 'react';
import * as ReactRedux from 'react-redux';
import PropTypes from 'prop-types';

import * as actions from 'actions/index';

import Canvas from 'components/Canvas';
import Controls from 'components/Controls';
import Sidebar from 'components/Sidebar';
import GithubCorner from 'components/GithubCorner';

import styles from './App.css';


function computeTreeRef() {
  if (VERSION.includes('-g')) {
    const [, commit] = VERSION.split('-g');
    return commit;
  } else {
    return VERSION;
  }
}


function App({
  sidebarExpanded,
  onToggleSidebar,
}) {
  return <div className={ styles.wrapper }>
    <GithubCorner
      fillColor="#626262"
      repo="emlun/fraktal"
      visible={ sidebarExpanded }
    />
    <Canvas/>
    <Sidebar
      expanded={ sidebarExpanded }
      onToggle={ onToggleSidebar }
      title="Settings"
    >
      <Controls/>

      <footer className={ styles.footer }>
        <div>
          { PROJECT_NAME }
          { ' ' }
          <a href={ `https://github.com/emlun/fraktal/tree/${computeTreeRef()}` }>
            { VERSION }
          </a>
        </div>
        <div>
          <a href="https://emlun.se/">
            emlun.se
          </a>
        </div>
      </footer>
    </Sidebar>
  </div>;
}
App.propTypes = {
  sidebarExpanded: PropTypes.bool.isRequired,
  onToggleSidebar: PropTypes.func.isRequired,
};

export default ReactRedux.connect(
  state => ({
    sidebarExpanded: state.getIn(['sidebar', 'expanded'], false),
  }),
  {
    onToggleSidebar: actions.toggleSidebar,
  }
)(App);
