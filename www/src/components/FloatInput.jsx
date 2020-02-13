import React from 'react';
import PropTypes from 'prop-types';
import _ from 'underscore';

export default class FloatInput extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      volatileValue: false,
    };

    this.onChange = this.onChange.bind(this);
  }

  shouldComponentUpdate(nextProps, nextState) {
    return nextState.volatileValue !== this.state.volatileValue
      || (nextState.volatileValue === false && nextProps.value !== this.props.value);
  }

  update(newValue) {
    const parsed = parseFloat(newValue);
    if (_.isNaN(parsed)) {
      this.setState({ volatileValue: newValue });
    } else {
      this.setState({ volatileValue: false });
      this.props.onChange(parsed);
    }
  }

  onChange({ target: { value } }) {
    this.update(value);
  }

  render() {
    return <input
      onChange={ this.onChange }
      placeholder={ this.props.placeholder }
      type="text"
      value={ this.state.volatileValue === false ? this.props.value : this.state.volatileValue }
    />;
  }

}

FloatInput.propTypes = {
  placeholder: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
};
