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

    <div styleName="Title">
      <button
        onClick={ onToggle }
        styleName="toggle"
        type="button"
      >
        <span styleName="toggle-icon"/>
        { expanded && <span styleName="toggle-text">
          { title }
        </span> }
        { expanded && <span styleName="toggle-icon"/> }
      </button>
    </div>
    { expanded && <div styleName="Content">
      { children }
    </div> }
  </div>;
}
Sidebar.propTypes = {
  expanded: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,

  onToggle: PropTypes.func.isRequired,

  children: PropTypes.node,
};
