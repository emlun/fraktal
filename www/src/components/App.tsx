import React from 'react';
import * as ReactRedux from 'react-redux';

import * as actions from 'actions/index';

import Canvas from 'components/Canvas';
import Controls from 'components/Controls';
import Sidebar from 'components/Sidebar';
import GithubCorner from 'components/GithubCorner';

import { Engine } from 'fraktal-wasm';

import styles from './App.module.module.css';


const engine = Engine.new();


function computeTreeRef() {
  if (VERSION.includes('-g')) {
    const [, commit] = VERSION.split('-g');
    return commit;
  } else {
    return VERSION;
  }
}

interface Props {
  sidebarExpanded: boolean,
  onToggleSidebar: () => {},
}

function App({
  sidebarExpanded,
  onToggleSidebar,
}: Props) {
  return <div className={ styles.wrapper }>
    <GithubCorner
      fillColor="#626262"
      repo="emlun/fraktal"
      visible={ sidebarExpanded }
    />
    <Canvas engine={ engine }/>
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

export default ReactRedux.connect(
  state => ({
    sidebarExpanded: state.sidebar.expanded,
  }),
  {
    onToggleSidebar: actions.toggleSidebar,
  }
)(App);
