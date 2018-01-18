import React from 'react';
import PropTypes from 'prop-types';

import './ProgressBar.css';

export default function ProgressBar({
  max = 100,
  value,
  width,
}) {
  return <div styleName="ProgressBar"
    style={ { width } }
  >
    <div styleName="bar filled" style={ { flexGrow: value } }></div>
    <div styleName="bar empty" style={ { flexGrow: max - value } }></div>
  </div>;
}

ProgressBar.propTypes = {
  max: PropTypes.number,
  value: PropTypes.number.isRequired,
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};
