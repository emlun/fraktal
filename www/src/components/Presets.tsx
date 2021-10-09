import React, { useCallback, useState } from 'react';

import { presets } from 'presets';

import styles from './Presets.module.css';


function Presets({ current }: { current?: string }) {
  return <div className={ styles["Presets"] }>
    <ul>
      { presets.map(preset =>
        <li key={ preset.state }>
          <a
            href={ `?state=${preset.state}`}
            className={ preset.state === current ? styles["current"] : '' }
          >
            { preset.name }
          </a>
        </li>
      )}
    </ul>
  </div>;
}

export default Presets;
