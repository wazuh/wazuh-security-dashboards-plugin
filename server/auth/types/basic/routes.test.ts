/*
 *   Copyright OpenSearch Contributors
 *
 *   Licensed under the Apache License, Version 2.0 (the "License").
 *   You may not use this file except in compliance with the License.
 *   A copy of the License is located at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   or in the "license" file accompanying this file. This file is distributed
 *   on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 *   express or implied. See the License for the specific language governing
 *   permissions and limitations under the License.
 */

import { BasicAuthRoutes } from './routes';

describe('Basic auth login page', () => {
  let handler: Function;
  const register = (route: { path: string }, routeHandler: Function) => {
    if (route.path === '/app/login') {
      handler = routeHandler;
    }
  };
  const session = { get: jest.fn(), clear: jest.fn() };
  const response = {
    redirected: jest.fn((value) => ({ redirected: value })),
    renderAnonymousCoreApp: jest.fn(() => 'login page'),
  };

  new BasicAuthRoutes(
    { get: jest.fn(register), post: jest.fn(register) } as any,
    { cookie: { secure: true } } as any,
    { asScoped: () => session } as any,
    {} as any,
    { http: { basePath: { serverBasePath: '' }, resources: { register } } } as any
  ).setupRoutes();

  beforeEach(() => jest.clearAllMocks());

  it.each([
    [{}, '/'],
    [{ nextUrl: '/app/wz-home' }, '/app/wz-home'],
  ])(
    'sends a logged-in user (query %j) to %s without clearing the session',
    async (query, location) => {
      session.get.mockResolvedValue({ username: 'admin', expiryTime: Date.now() + 1000 });

      const result = await handler({}, { query }, response);

      expect(result).toEqual({ redirected: { headers: { location } } });
      expect(session.clear).not.toHaveBeenCalled();
    }
  );

  it.each([
    ['no session', null],
    ['an anonymous session', { username: 'opendistro_security_anonymous', isAnonymousAuth: true }],
    ['a SAML request in progress', { saml: { requestId: 'id' } }],
  ])('renders the login page with %s', async (_, cookie) => {
    session.get.mockResolvedValue(cookie);

    expect(await handler({}, { query: {} }, response)).toBe('login page');
    expect(session.clear).toHaveBeenCalled();
  });

  it('renders the login page when the session cookie cannot be read', async () => {
    session.get.mockRejectedValue(new Error('bad cookie'));

    expect(await handler({}, { query: {} }, response)).toBe('login page');
    expect(session.clear).toHaveBeenCalled();
  });
});
