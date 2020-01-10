import React from 'react';
import Head from 'next/head';
import { NextPageContext } from 'next';
import { withUrqlClient } from 'next-urql';

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

export default withUrqlClient((ctx: NextPageContext) => {
  return {
    url: 'https://graphql-pokemon.now.sh',
    fetchOptions: {
      headers: {
        Authorization: `Bearer ${ctx.req.headers.authorization}`,
      },
    },
  };
})(Home);
