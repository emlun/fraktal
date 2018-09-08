import React from 'react';
import PropTypes from 'prop-types';

import './Sidebar.css';


export default function Sidebar({
  children,
  expanded = false,
  title,

  onToggle,
}) {
  return <div
    styleName={ `Sidebar ${expanded ? ' expanded' : ''}` }
  >
    <button
      onClick={ onToggle }
      styleName="toggle"
      type="button"
    >
      <span styleName="toggle-icon"/>
      <span styleName="toggle-text">
        { title }
      </span>
      <span styleName="toggle-icon"/>
    </button>
    <div styleName="Content">
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
