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

import { SamlAuthRoutes } from './routes';

const SIGN_IN_ERROR_LOCATION = '/basepath/app/customerror/sso-sign-in-error';

describe('SAML routes sign-in failures', () => {
  const handlers: Record<string, Function> = {};
  const routes: Record<string, any> = {};
  const register = (route: { path: string }, handler: Function) => {
    handlers[route.path] = handler;
    routes[route.path] = route;
  };
  const router = { get: jest.fn(register), post: jest.fn(register) };
  const coreSetup = {
    http: { basePath: { serverBasePath: '/basepath' }, resources: { register } },
  };
  const securityClient = {
    getSamlHeader: jest.fn().mockRejectedValue(new Error('metadata unreachable')),
    authToken: jest.fn().mockRejectedValue(new Error('invalid SAML response')),
  };
  const sessionStorageFactory = {
    asScoped: jest.fn(() => ({
      get: jest.fn().mockResolvedValue({ saml: { requestId: 'request-id' } }),
      set: jest.fn(),
    })),
  };
  const logger = { error: jest.fn() };
  const context = { security_plugin: { logger } };
  const response = {
    redirected: jest.fn((value) => value),
    internalError: jest.fn(),
    badRequest: jest.fn(),
  };

  new SamlAuthRoutes(
    router as any,
    {} as any,
    sessionStorageFactory as any,
    securityClient as any,
    coreSetup as any
  ).setupRoutes();

  beforeEach(() => jest.clearAllMocks());

  it('redirects to the sign-in error page when the login request fails', async () => {
    const request = { auth: { isAuthenticated: false }, query: { redirectHash: 'false' } };

    const result = await handlers['/auth/saml/login'](context, request, response);

    expect(result).toEqual({ headers: { location: SIGN_IN_ERROR_LOCATION } });
    expect(response.internalError).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('metadata unreachable'));
  });

  it('redirects to the sign-in error page when the ACS request fails', async () => {
    const request = { body: { SAMLResponse: 'response' } };

    const result = await handlers['/_opendistro/_security/saml/acs'](context, request, response);

    expect(result).toEqual({ headers: { location: SIGN_IN_ERROR_LOCATION } });
    expect(response.internalError).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('invalid SAML response'));
  });

  it('serves the sign-in error page without a session', async () => {
    const path = '/app/customerror/sso-sign-in-error';
    const resourceResponse = { renderAnonymousCoreApp: jest.fn().mockResolvedValue('page') };

    const result = await handlers[path](context, {}, resourceResponse);

    expect(routes[path].options.authRequired).toBe(false);
    expect(result).toBe('page');
  });
});
