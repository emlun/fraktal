import React, { useCallback, useMemo, useState } from 'react';

import Canvas from 'components/Canvas';
import Controls from 'components/Controls';
import Sidebar from 'components/Sidebar';
import GithubCorner from 'components/GithubCorner';

import { Engine, Viewpoint } from 'fraktal-wasm';

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

  const [viewpoint, setViewpoint] = useState<Viewpoint>();

  const engine = useMemo(Engine.new, [Engine]);

  const restoreViewpoint = useCallback(
    (restored: Viewpoint) => {
      setViewpoint(engine.set_viewpoint(restored.center.x, restored.center.y, restored.scale));
    },
    [engine]
  );

  if (engine) {
    return <div className={ styles.wrapper }>
      <GithubCorner
        fillColor="#626262"
        repo="emlun/fraktal"
        visible={ sidebarExpanded }
      />
      <Canvas
        engine={ engine }
        viewpoint={ viewpoint }
        setViewpoint={ setViewpoint }
      />
      <Sidebar
        expanded={ sidebarExpanded }
        onToggle={ () => setSidebarExpanded(!sidebarExpanded) }
        title="Settings"
      >
        <Controls
          engine={ engine }
          viewpoint={ viewpoint }
          restoreViewpoint={ restoreViewpoint }
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
