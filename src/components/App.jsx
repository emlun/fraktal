import React from 'react';

import Canvas from 'components/Canvas';

export default class App extends React.Component {

  render() {
    return <div>
      <p> Hello, World! </p>
      <input type="text"/>

      <Canvas/>
    </div>;
  }

}
