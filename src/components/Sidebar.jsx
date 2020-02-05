import React from 'react';
import PropTypes from 'prop-types';

import styles from './Sidebar.css';


export default function Sidebar({
  children,
  expanded = false,
  title,

  onToggle,
}) {
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
Sidebar.propTypes = {
  expanded: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,

  onToggle: PropTypes.func.isRequired,

  children: PropTypes.node,
};
