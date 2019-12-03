import React from 'react';
import { shallow, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import withUrqlClient, {
  NextContextWithAppTree,
} from '../src/with-urql-client';
import { NextFC } from 'next';
import { Client } from 'urql';

interface Props {
  urqlClient: Client;
}

/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/ban-ts-ignore */
// @ts-ignore
const MockApp = (props: Props) => {
  return <div />;
};
/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/ban-ts-ignore */

describe('withUrqlClient', () => {
  beforeAll(() => {
    configure({ adapter: new Adapter() });
  });

  describe('with client options', () => {
    let Component: NextFC<any>;
    const mockContext: NextContextWithAppTree = {
      // eslint-disable-next-line react/display-name
      AppTree: () => <div />,
      pathname: '/',
      query: {
        test: '',
      },
      asPath: '/',
    };

    beforeEach(() => {
      const tree = withUrqlClient({ url: 'http://localhost:3000' })(MockApp);
      Component = tree;
    });

    it('should instantiate and pass the urql client instance to the wrapped component if no client is passed by getInitialProps', () => {
      const tree = shallow(<Component />);
      const app = tree.find(MockApp);
      expect(app.props().urqlClient).toBeInstanceOf(Client);
      expect(app.props().urqlClient.url).toEqual('http://localhost:3000');
    });

    it('should instantiate and pass the urql client instance via getInitialProps', async () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const props = await Component.getInitialProps!(mockContext);
      const tree = shallow(<Component {...props} />);
      const app = tree.find(MockApp);
      expect(app.props().urqlClient).toBeInstanceOf(Client);
      expect(app.props().urqlClient.url).toEqual('http://localhost:3000');
    });
  });

  describe('with ctx callback to produce client options', () => {
    let Component: NextFC<any>;
    const token = Math.random()
      .toString(36)
      .slice(-10);
    const mockContext: NextContextWithAppTree = {
      // eslint-disable-next-line react/display-name
      AppTree: () => <div />,
      pathname: '/',
      query: {
        test: '',
      },
      asPath: '/',
      req: {
        headers: {
          cookie: token,
        },
      },
    };

    beforeEach(() => {
      const tree = withUrqlClient(ctx => ({
        url: 'http://localhost:3000',
        fetchOptions: {
          headers: { Authorization: ctx.req.headers.cookie },
        },
      }))(MockApp);
      Component = tree;
    });

    it('should allow a user to access the ctx object from Next', async () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const props = await Component.getInitialProps!(mockContext);
      const tree = shallow(<Component {...props} />);
      const app = tree.find(MockApp);
      expect(app.props().urqlClient.fetchOptions).toEqual({
        headers: { Authorization: token },
      });
    });
  });
});
