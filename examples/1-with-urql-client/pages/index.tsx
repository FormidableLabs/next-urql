import React from 'react';
import Head from 'next/head';
import { withUrqlClient } from 'next-urql';

import { NextContext } from '../../../node_modules/@types/next/index';
import PokémonList from '../components/pokemon_list';

const Home: React.FC = () => (
  <div>
    <Head>
      <title>Home</title>
      <link rel="icon" href="/static/favicon.ico" />
    </Head>

    <PokémonList />
  </div>
);

export default withUrqlClient((ctx: NextContext) => {
  return {
    url: 'https://graphql-pokemon.now.sh',
    fetchOptions: {
      headers: {
        Authorization: `Bearer ${ctx.req.headers.authorization}`,
      },
    },
  };
})(Home);
