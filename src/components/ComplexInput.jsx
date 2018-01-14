import React from 'react';
import PropTypes from 'prop-types';
import Complex from 'complex.js';


export default function ComplexInput({
  value: { im, re },
  onChange,
}) {
  return <span>
    <input type="text"
      placeholder="Re"
      value={ re }
      onChange={ ({ target: { value } }) => onChange(new Complex(parseFloat(value), im)) }
    />
    +
    <input type="text"
      placeholder="Im"
      value={ im }
      onChange={ ({ target: { value } }) => onChange(new Complex(re, parseFloat(value))) }
    />i
  </span>;
}
ComplexInput.propTypes = {
  value: PropTypes.shape({
    im: PropTypes.number.isRequired,
    re: PropTypes.number.isRequired,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
};
