import React from 'react';
import PropTypes from 'prop-types';
import Complex from 'complex.js';

import FloatInput from 'components/FloatInput';

export default function ComplexInput({
  value: { im, re },
  onChange,
}) {
  return <span>
    <FloatInput
      onChange={ value => onChange(new Complex(value, im)) }
      placeholder="Re"
      value={ re }
    />
    { ' + ' }
    <FloatInput
      onChange={ value => onChange(new Complex(re, value)) }
      placeholder="Im"
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
