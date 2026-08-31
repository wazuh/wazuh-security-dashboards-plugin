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

import { SessionStorageCookieOptions } from '../../../../src/core/server';
import { SecurityPluginConfigType } from '..';

export interface SecuritySessionCookie {
  // security_authentication
  username?: string;
  credentials?: any;
  authType?: string;
  assignAuthHeader?: boolean;
  isAnonymousAuth?: boolean;
  expiryTime?: number;
  additionalAuthHeaders?: any;

  // security_storage
  tenant?: any;

  // for oidc auth workflow
  oidc?: {
    state?: string;
    nextUrl?: string;
    redirectHash?: boolean;
  };

  // for Saml auth workflow
  saml?: {
    requestId?: string;
    nextUrl?: string;
    redirectHash?: boolean;
  };
}

// Wazuh: resolved once during plugin setup from the actual listener protocol.
// See the `secure` setting in server/index.ts for why the default is derived.
let derivedCookieSecure = false;

// Wazuh: called from the plugin setup, before any request is served.
export function setDerivedCookieSecure(isTlsListener: boolean): void {
  derivedCookieSecure = isTlsListener;
}

// Wazuh: single source of truth for the cookie Secure flag. An explicit
// `opensearch_security.cookie.secure` wins; otherwise the listener decides.
export function isCookieSecure(config: SecurityPluginConfigType): boolean {
  return config.cookie.secure ?? derivedCookieSecure;
}

export function getSecurityCookieOptions(
  config: SecurityPluginConfigType
): SessionStorageCookieOptions<SecuritySessionCookie> {
  return {
    name: config.cookie.name,
    encryptionKey: config.cookie.password,
    validate: (sessionStorage: SecuritySessionCookie | SecuritySessionCookie[]) => {
      sessionStorage = sessionStorage as SecuritySessionCookie;
      if (sessionStorage === undefined) {
        return { isValid: false, path: '/' };
      }

      // TODO: with setting redirect attributes to support OIDC and SAML,
      //       we need to do additional cookie validation in AuthenticationHandlers.
      // if SAML fields present
      if (sessionStorage.saml && sessionStorage.saml.requestId) {
        return { isValid: true, path: '/' };
      }

      // if OIDC fields present
      if (sessionStorage.oidc) {
        return { isValid: true, path: '/' };
      }

      if (sessionStorage.expiryTime === undefined || sessionStorage.expiryTime < Date.now()) {
        return { isValid: false, path: '/' };
      }
      return { isValid: true, path: '/' };
    },
    isSecure: isCookieSecure(config), // Wazuh
    sameSite: config.cookie.isSameSite || undefined,
  };
}

export function clearOldVersionCookieValue(config: SecurityPluginConfigType): string {
  // Wazuh: isCookieSecure() instead of config.cookie.secure
  if (isCookieSecure(config)) {
    return 'security_authentication=; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Secure; HttpOnly; Path=/';
  } else {
    return 'security_authentication=; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Path=/';
  }
}
