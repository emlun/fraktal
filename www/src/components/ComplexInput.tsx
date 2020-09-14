import React from 'react';

import FloatInput from 'components/FloatInput';

interface Complex {
  re: number,
  im: number,
}

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
      onChange={ value => onChange({ re: value, im }) }
      placeholder="Re"
      value={ re }
    />
    { ' + ' }
    <FloatInput
      onChange={ value => onChange({ re, im: value }) }
      placeholder="Im"
      value={ im }
    />
    i
  </span>;
}
