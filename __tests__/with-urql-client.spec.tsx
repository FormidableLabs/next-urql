import React from 'react';
import { shallow, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import { NextComponentType } from 'next';
import { Client, defaultExchanges, composeExchanges } from 'urql';

import withUrqlClient, { NextUrqlContext } from '../src/with-urql-client';
import * as init from '../src/init-urql-client';

interface Props {
  urqlClient: Client;
}

const MockApp: React.FC<Props> = () => {
  return <div />;
};

const MockAppTree: React.FC = () => {
  return <div />;
};

describe('withUrqlClient', () => {
  beforeAll(() => {
    configure({ adapter: new Adapter() });
  });

  describe('with client options', () => {
    let Component: NextComponentType<any>;

    const mockContext: NextUrqlContext = {
      AppTree: MockAppTree,
      pathname: '/',
      query: {
        test: '',
      },
      asPath: '/',
      urqlClient: {} as Client,
    };

    const spyInitUrqlClient = jest.spyOn(init, 'initUrqlClient');

    beforeEach(() => {
      Component = withUrqlClient({ url: 'http://localhost:3000' })(MockApp);
    });

    afterEach(() => {
      spyInitUrqlClient.mockClear();
    });

    it('should instantiate an empty client before getInitialProps has been run', () => {
      const tree = shallow(<Component />);
      const app = tree.find(MockApp);

      expect(app.props().urqlClient).toBeInstanceOf(Client);
      expect(app.props().urqlClient.url).toBeUndefined();
      expect(spyInitUrqlClient).toHaveBeenCalled();
    });

    it('should instantiate and pass the urql client instance via getInitialProps', async () => {
      const props =
        Component.getInitialProps &&
        (await Component.getInitialProps(mockContext));
      const tree = shallow(<Component {...props} />);
      const app = tree.find(MockApp);

      expect(app.props().urqlClient).toBeInstanceOf(Client);
      expect(app.props().urqlClient.url).toEqual('http://localhost:3000');
      expect(spyInitUrqlClient).toHaveBeenCalled();
    });
  });

  describe('with ctx callback to create client options', () => {
    let Component: NextComponentType<any>;

    // Fake up a string to simulate, say, a token accessed via browser cookies or localStorage.
    const token = Math.random()
      .toString(36)
      .slice(-10);

    const mockContext: NextUrqlContext = {
      AppTree: MockAppTree,
      pathname: '/',
      query: {
        test: '',
      },
      asPath: '/',
      req: {
        headers: {
          cookie: token,
        },
      } as NextUrqlContext['req'],
      urqlClient: {} as Client,
    };

    beforeEach(() => {
      Component = withUrqlClient(ctx => ({
        url: 'http://localhost:3000',
        fetchOptions: {
          headers: { Authorization: ctx.req ? ctx.req.headers.cookie : null },
        },
      }))(MockApp);
    });

    it('should allow a user to access the ctx object from Next', async () => {
      const props =
        Component.getInitialProps &&
        (await Component.getInitialProps(mockContext));
      const tree = shallow(<Component {...props} />);
      const app = tree.find(MockApp);
      expect(app.props().urqlClient.fetchOptions).toEqual({
        headers: { Authorization: token },
      });
    });
  });

  describe('with mergeExchanges provided', () => {
    let Component: NextComponentType<any>;
    const mockMergeExchanges = jest.fn(() => defaultExchanges);

    beforeEach(() => {
      Component = withUrqlClient(
        { url: 'http://localhost:3000' },
        mockMergeExchanges,
      )(MockApp);
    });

    it('should call the user-supplied mergeExchanges function', () => {
      const tree = shallow(<Component />);
      const app = tree.find(MockApp);

      expect(app.props().urqlClient).toBeInstanceOf(Client);
      expect(app.props().urqlClient.exchange.toString()).toEqual(
        composeExchanges(defaultExchanges).toString(),
      );
      expect(mockMergeExchanges).toHaveBeenCalledTimes(1);
    });
  });
});
