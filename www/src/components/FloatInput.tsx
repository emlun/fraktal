import React, { useState, useEffect } from 'react';
import _ from 'underscore';

interface FloatInputProps {
  onChange: (v: number) => void,
  placeholder: string,
  value: number,
}

export default function FloatInput({
  onChange,
  placeholder,
  value,
}: FloatInputProps) {
  const [volatileValue, setVolatileValue] = useState<string | undefined>(undefined);

  const handleChange = ({ target: { value: newValue } }: { target: { value: string } }) => {
    const parsed = parseFloat(newValue);
    if (_.isNaN(parsed)) {
      setVolatileValue(newValue);
    } else {
      setVolatileValue(undefined);
      onChange(parsed);
    }
  };

  return <input
    onChange={ handleChange }
    placeholder={ placeholder }
    type="text"
    value={ volatileValue === undefined ? value : volatileValue }
  />;

}
