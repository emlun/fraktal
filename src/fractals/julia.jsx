import React from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import Complex from 'complex.js';

import ComplexInput from 'components/ComplexInput';


export const name = 'Julia set';

function step(z, c) {
  return z.mul(z).add(c);
}

function iterate(c, z, iterationLimit = 255, i = 0, escapeAbs = 2) {
  const next = step(z, c);
  if (next.abs() >= escapeAbs) {
    return i;
  } else if (i >= iterationLimit) {
    return -1;
  } else {
    return iterate(c, next, iterationLimit, i + 1, escapeAbs);
  }
}

export function makeCheck({ c }) {
  return function(z, iterationLimit) {
    return iterate(c, z, iterationLimit);
  };
}

export const defaultParameters = Immutable.Map({
  c: new Complex(0.285, 0.01),
});

export function ParameterControls({
  parameters = defaultParameters,
  onChange,
}) {
  return <div>
    <p>
      c: <ComplexInput value={ parameters.get('c') } onChange={ newValue => onChange(parameters.set('c', newValue)) } />
    </p>
  </div>;
}
ParameterControls.propTypes = {
  parameters: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};
