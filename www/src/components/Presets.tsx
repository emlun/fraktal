import React, { useCallback, useState } from 'react';

import styles from './Presets.module.css';

function compareBy<T>(f: (arg: T) => any) {
  return (a: T, b: T) => {
    const aa = f(a);
    const bb = f(b);
    if (aa < bb) {
      return -1;
    } else if (bb < aa) {
      return 1;
    } else {
      return 0;
    }
  };
}

const presets = [
  {
    name: "Singularity",
    state: "0:eNplii0KgDAAhWfYol0PYBabxZnE4HE07wjiKcyeQBGMRkG7Ybd429hP2QcPPj7e-dFukc9-p9N41D8v-jUr861pGfHAjJIIzN6EwBsqMCRWL-2chYzKXRQs2B1m",
  },
  {
    name: "The day they came",
    state: "0:eNpNirEJgDAURL9oaSUi6ADWYi9i51ZpQ1bIABkgENJlhQyRKktcCORDDg7uHu9z6zzJGPymF4v0nr_Zr2N48kgc1PJVHQ-8BYF9gHA3XABCkBQP",
  },
  {
    name: "My burning heart",
    state: "0:eNpli6ENgDAURD8JEgwOPGiCIRg0Dk2YgRnKGDgkmgm-gwG6Rk0nuLZpq_qSS564d8lfjdvH1V0eU6u5W566b975LCgCt5wSsAYR1vfMOwtCbAHCED4GhoAWgg",
  },
  {
    name: "Wildfire",
    state: "0:eNpljLsNgDAUAw8JQccMrAADwATswCbMwTRQU9FkgLRZwvnpVTnJ8jU2wOzeJxWnDzuFf2PFUE5Pg5auys2kY6j-XaNsKyG7iYkmEPs",
  },
  {
    name: "Poseidon's armory",
    state: "0:eNpFzDEOQEAQBdBBSDRKsWpRo9dLNG6hcYftlAoHEJ1TiESlWofQOILui-xgkkne_8WP1mo3x2vxHdV2XjPHxSSSMM1J0Ht43uZw0t8PBkuWCCxNtRF6V7s-JL4dABnzBlEkGUA",
  },
  {
    name: "Hyperspace",
    state: "0:eNpljCsKgEAAREcE81abyWSyi9VgsHkPT2EUD-QeRQTNWg0y7hcW9pV5DMMAxT1_hwSGd1zPFoanQW6NCh0ZIiidlOgoEt9enLxXPUVqddl2hp-1m_zt_R1g",
  },
  {
    name: "The Radiance",
    state: "0:eNpljb8KQFAUxm8UiuyU1SgxGWT1BmbMPIAX8Qhmuz-DzWLyBrp5Ad3xuDhF-S3n19fX-Wpq-ea-jv0yzCzYIjtuDNdsQ2KQG-BcRyE_oBTQnAQmEUNGgEpvXsnoeQep-mjGf2o69o8Cvlse1k8-ySiW",
  },
].sort(compareBy(a => a.name.toLowerCase()));

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
