import React from 'react';
import { withUrqlClient } from 'next-urql';

interface IApp {
  Component: React.FC;
  pageProps: Record<string, any>;
}

const App: React.FC<IApp> = ({ Component, pageProps }) => (
  <Component {...pageProps} />
);

export default withUrqlClient({ url: 'https://graphql-pokemon.now.sh' })(App);
