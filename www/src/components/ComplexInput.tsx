import React from 'react';
import Complex from 'complex.js';

import FloatInput from 'components/FloatInput';

interface Props {
  value: Complex,
  onChange: (value: Complex) => void,
}

export default function ComplexInput({
  value: { im, re },
  onChange,
}: Props) {
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
    i
  </span>;
}
