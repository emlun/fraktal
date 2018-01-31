import React from 'react';
import PropTypes from 'prop-types';
import _ from 'underscore';

export default class FloatInput extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      value: props.value,
    };

    this.onChange = this.onChange.bind(this);
    this.update = this.update.bind(this);
  }

  componentWillReceiveProps(newProps) {
    if (newProps.value !== this.props.value) {
      this.setState({ value: newProps.value });
    }
  }

  update(newValue) {
    this.setState({ value: newValue });
    const parsed = parseFloat(newValue);
    if (!_.isNaN(parsed)) {
      this.props.onChange(parsed);
      console.log('onChange', parsed);
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
      value={ this.state.value }
    />;
  }

}

FloatInput.propTypes = {
  placeholder: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
};
