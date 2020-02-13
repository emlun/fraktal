import PropTypes from 'prop-types';

export const complex = PropTypes.shape({
  im: PropTypes.number.isRequired,
  re: PropTypes.number.isRequired,
});
