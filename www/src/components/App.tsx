import React, { useCallback, useEffect, useState } from 'react';

import Canvas from 'components/Canvas';
import Controls from 'components/Controls';
import Sidebar from 'components/Sidebar';
import GithubCorner from 'components/GithubCorner';

import { Engine, EngineSettings } from 'fraktal-wasm';

import styles from './App.module.module.css';


function computeTreeRef() {
  if (VERSION.includes('-g')) {
    const [, commit] = VERSION.split('-g');
    return commit;
  } else {
    return VERSION;
  }
}

function App() {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  const [engine, setEngine] = useState<Engine>();
  const [settings, setSettings] = useState<EngineSettings>();

  useEffect(
    () => {
      const eng = Engine.new();
      let settings = eng.get_settings();
      setEngine(eng);
      setSettings(settings);
    },
    [Engine]
  );

  if (engine && settings) {
    return <div className={ styles.wrapper }>
      <GithubCorner
        fillColor="#626262"
        repo="emlun/fraktal"
        visible={ sidebarExpanded }
      />
      <Canvas
        engine={ engine }
        settings={ settings }
        updateSettings={ setSettings }
      />
      <Sidebar
        expanded={ sidebarExpanded }
        onToggle={ () => setSidebarExpanded(!sidebarExpanded) }
        title="Settings"
      >
        <Controls
          engine={ engine }
          settings={ settings }
          updateSettings={ setSettings }
        />

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
  } else {
    return <>Loading...</>;
  }
}

export default App;
