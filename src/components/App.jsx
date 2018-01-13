import React from 'react';

import Canvas from 'components/Canvas';
import GithubCorner from 'components/GithubCorner';

export default class App extends React.Component {

  render() {
    return <div>
      <GithubCorner repo="emlun/fraktal" fillColor="#626262" />
      <Canvas/>
    </div>;
  }

}
