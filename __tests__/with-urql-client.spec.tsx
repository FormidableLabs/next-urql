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

  const spyInitUrqlClient = jest.spyOn(init, 'initUrqlClient');
  const mockMergeExchanges = jest.fn(() => defaultExchanges);
  let Component: NextComponentType<any>;

  beforeEach(() => {
    Component = withUrqlClient({ url: 'http://localhost:3000' })(MockApp);
  });

  afterEach(() => {
    spyInitUrqlClient.mockClear();
    mockMergeExchanges.mockClear();
  });

  describe('with client options', () => {
    const mockContext: NextUrqlContext = {
      AppTree: MockAppTree,
      pathname: '/',
      query: {},
      asPath: '/',
      urqlClient: {} as Client,
    };

    it('should create the client instance when the component mounts', () => {
      const tree = shallow(<Component />);
      const app = tree.find(MockApp);

      expect(app.props().urqlClient).toBeInstanceOf(Client);
      expect(app.props().urqlClient.url).toBe('http://localhost:3000');
      expect(spyInitUrqlClient).toHaveBeenCalledTimes(1);
    });

    it('should create the urql client instance server-side inside getInitialProps and client-side in the component', async () => {
      const props =
        Component.getInitialProps &&
        (await Component.getInitialProps(mockContext));
      expect(spyInitUrqlClient).toHaveBeenCalledTimes(1);

      const tree = shallow(<Component {...props} />);
      const app = tree.find(MockApp);

      expect(spyInitUrqlClient).toHaveBeenCalledTimes(2);
      expect(app.props().urqlClient).toBeInstanceOf(Client);
      expect(app.props().urqlClient.url).toEqual('http://localhost:3000');
    });
  });

  describe('with ctx callback to create client options', () => {
    // Simulate a token that might be passed in a request to the server-rendered application.
    const token = Math.random()
      .toString(36)
      .slice(-10);

    const mockContext: NextUrqlContext = {
      AppTree: MockAppTree,
      pathname: '/',
      query: {},
      asPath: '/',
      req: {
        headers: {
          cookie: token,
        },
      } as NextUrqlContext['req'],
      urqlClient: {} as Client,
    };

    beforeEach(() => {
      Component = withUrqlClient(
        ctx => ({
          url: 'http://localhost:3000',
          fetchOptions: {
            headers: { Authorization: ctx?.req?.headers?.cookie ?? '' },
          },
        }),
        mockMergeExchanges,
      )(MockApp);
    });

    it('should allow a user to access the ctx object from Next on the server', async () => {
      Component.getInitialProps &&
        (await Component.getInitialProps(mockContext));
      expect(spyInitUrqlClient).toHaveBeenCalledWith(
        {
          url: 'http://localhost:3000',
          fetchOptions: { headers: { Authorization: token } },
        },
        mockMergeExchanges,
      );
    });
  });

  describe('with mergeExchanges provided', () => {
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
