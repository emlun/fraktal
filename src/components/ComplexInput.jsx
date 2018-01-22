import React from 'react';
import PropTypes from 'prop-types';
import Complex from 'complex.js';


export default function ComplexInput({
  value: { im, re },
  onChange,
}) {
  return <span>
    <input
      onChange={ ({ target: { value } }) => onChange(new Complex(parseFloat(value), im)) }
      placeholder="Re"
      type="text"
      value={ re }
    />
    { ' + ' }
    <input
      onChange={ ({ target: { value } }) => onChange(new Complex(re, parseFloat(value))) }
      placeholder="Im"
      type="text"
      value={ im }
    />
    { 'i' }
  </span>;
}
ComplexInput.propTypes = {
  value: PropTypes.shape({
    im: PropTypes.number.isRequired,
    re: PropTypes.number.isRequired,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
};
