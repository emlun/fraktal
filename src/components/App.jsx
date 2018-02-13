import React from 'react';

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


export default function App() {
  return <div styleName="wrapper">
    <div styleName="main">
      <GithubCorner
        fillColor="#626262"
        repo="emlun/fraktal"
      />
      <Canvas/>
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
