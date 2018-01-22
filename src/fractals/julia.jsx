import React from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import Complex from 'complex.js';

import { contained } from './constants';

import ComplexInput from 'components/ComplexInput';


export const name = 'Julia set';
const defaultEscapeAbs = 2;

function step(z, c) {
  return z.mul(z).add(c);
}

function iterate(c, iterationLimit, escapeAbs = defaultEscapeAbs) {
  return function recur(z, i = 0) {
    const next = step(z, c);
    if (next.abs() >= escapeAbs) {
      return i;
    } else if (i >= iterationLimit) {
      return contained;
    } else {
      return recur(next, i + 1);
    }
  };
}

export function makeCheck({ c }) {
  return function check(z, iterationLimit) {
    return iterate(c, iterationLimit)(z);
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
      { 'c: ' }
      <ComplexInput
        onChange={ newValue => onChange(parameters.set('c', newValue)) }
        value={ parameters.get('c') }
      />
    </p>
  </div>;
}
ParameterControls.propTypes = {
  parameters: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};
