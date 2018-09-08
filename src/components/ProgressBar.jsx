import React from 'react';
import PropTypes from 'prop-types';

import './ProgressBar.css';

export default function ProgressBar({
  max = 100,
  value,
}) {
  return <div
    styleName="ProgressBar"
  >
    <div
      style={ { flexGrow: value } }
      styleName="bar filled"
    />
    <div
      style={ { flexGrow: max - value } }
      styleName="bar empty"
    />
  </div>;
}

ProgressBar.propTypes = {
  value: PropTypes.number.isRequired,

  max: PropTypes.number,
};
