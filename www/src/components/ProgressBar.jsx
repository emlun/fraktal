import React from 'react';
import PropTypes from 'prop-types';

import styles from './ProgressBar.css';

export default function ProgressBar({
  max = 100,
  value,
}) {
  return <div
    className={ styles.ProgressBar }
  >
    <div
      className={ `${styles.bar} ${styles.filled}` }
      style={ { flexGrow: value } }
    />
    <div
      className={ `${styles.bar} ${styles.empty}` }
      style={ { flexGrow: max - value } }
    />
  </div>;
}

ProgressBar.propTypes = {
  value: PropTypes.number.isRequired,

  max: PropTypes.number,
};
