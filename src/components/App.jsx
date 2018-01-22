import React from 'react';

import Canvas from 'components/Canvas';
import GithubCorner from 'components/GithubCorner';

import './App.css';


export default function App() {
  return <div styleName="wrapper">
    <div styleName="main">
      <GithubCorner
        fillColor="#626262"
        repo="emlun/fraktal"
      />
      <Canvas/>
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
