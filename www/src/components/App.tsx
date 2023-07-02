import React, { useCallback, useEffect, useState } from 'react';

import Canvas from 'components/Canvas';
import Controls from 'components/Controls';
import Sidebar from 'components/Sidebar';
import GithubCorner from 'components/GithubCorner';

import { EngineSettings } from 'fraktal-wasm';
import { presets } from 'presets';

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

  const [settings, setSettings] = useState<EngineSettings>(
    () => {
      if (window.location.search) {
        const params = new URLSearchParams(window.location.search);
        const state = params.get('state');
        if (state) {
          const settings = EngineSettings.restore(state);
          if (settings) {
            return settings;
          }
        }
      } else {
        const r = Math.floor(Math.random() * presets.length);
        const settings = EngineSettings.restore(presets[r].state);
        if (settings) {
          return settings;
        }
      }

      return EngineSettings.new();
    }
  );

  console.log("App", settings);

  if (settings) {
    return <div className={ styles.wrapper }>
      <GithubCorner
        fillColor="#626262"
        repo="emlun/fraktal"
        visible={ sidebarExpanded }
      />
      <Canvas
        settings={ settings }
        updateSettings={ setSettings }
      />
      <Sidebar
        expanded={ sidebarExpanded }
        onToggle={ () => setSidebarExpanded(!sidebarExpanded) }
        title="Settings"
      >
        <Controls
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
