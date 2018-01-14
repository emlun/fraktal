import React from 'react';

import Canvas from 'components/Canvas';
import GithubCorner from 'components/GithubCorner';

import './App.css';


export default class App extends React.Component {

  render() {
    return <div styleName="wrapper">
      <div styleName="main">
        <GithubCorner repo="emlun/fraktal" fillColor="#626262" />
        <Canvas/>
      </div>

      <footer styleName="footer">
        <div>
          <a href="https://emlun.se/"> emlun.se </a>
        </div>
        <div styleName="middle"> { PROJECT_NAME } { VERSION } </div>
        <div>
        </div>
      </footer>
    </div>;
  }

}
