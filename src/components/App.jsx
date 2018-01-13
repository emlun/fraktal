import React from 'react';

import Canvas from 'components/Canvas';
import GithubRibbon from 'components/GithubRibbon';

export default class App extends React.Component {

  render() {
    return <div>
      <GithubRibbon repo="emlun/fraktal"/>
      <Canvas/>
    </div>;
  }

}
