import React, { useState } from 'react';

import styles from './CollapseBox.module.css';

interface Props {
  children: React.ReactNode,
  title: string,
}

export default function CollapseBox({
  children,
  title,
}: Props) {
  const [expanded, setExpanded] = useState(true);

  return <div
    className={ `${styles.CollapseBox} ${expanded ? styles.expanded : ''}` }
  >
    <button
      className={ styles.toggle }
      onClick={ () => setExpanded(b => !b) }
      type="button"
    >
      <span className={ styles['toggle-text'] }>
        { title }
      </span>
      <span className={ styles['toggle-icon'] }/>
    </button>
    <div className={ styles.Content }>
      { children }
    </div>
  </div>;
}
