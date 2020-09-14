import React from 'react';
import PropTypes from 'prop-types';

import { hot } from 'react-hot-loader/root';
import { Provider } from 'react-redux';

import App from 'components/App';
import DevTools from 'components/DevTools';


function Root({ store }) {
  return <Provider store={ store }>
    <div>
      <App/>
      <DevTools/>
    </div>
  </Provider>;
}
Root.propTypes = {
  store: PropTypes.shape({
    dispatch: PropTypes.func.isRequired,
    getState: PropTypes.func.isRequired,
  }).isRequired,
};

export default hot(Root);
