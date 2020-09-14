import React from 'react';

import styles from './Sidebar.module.css';

interface Props {
  children: React.ReactNode,
  expanded: boolean,
  title: string,
  onToggle: () => void,
}

export default function Sidebar({
  children,
  expanded = true,
  title,
  onToggle,
}: Props) {
  return <div
    className={ `${styles.Sidebar} ${expanded ? styles.expanded : ''}` }
  >
    <button
      className={ styles.toggle }
      onClick={ onToggle }
      type="button"
    >
      <span className={ styles['toggle-icon'] }/>
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
