import React from 'react';
import PropTypes from 'prop-types';

import { AppContainer } from 'react-hot-loader';
import { Provider } from 'react-redux';

import App from 'components/App';
import DevTools from 'components/DevTools';


export default function Root({ store }) {
  return <AppContainer>
    <Provider store={ store }>
      <div>
        <App/>
        <DevTools/>
      </div>
    </Provider>
  </AppContainer>;
}
Root.propTypes = {
  store: PropTypes.shape({
    dispatch: PropTypes.func.isRequired,
    getState: PropTypes.func.isRequired,
  }).isRequired,
};
