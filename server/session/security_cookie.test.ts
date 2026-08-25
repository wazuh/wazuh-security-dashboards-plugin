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

// Wazuh: covers the derived Secure flag added for
// https://github.com/wazuh/wazuh-dashboard/issues/1520

import {
  isCookieSecure,
  setDerivedCookieSecure,
  clearOldVersionCookieValue,
} from './security_cookie';
import { SecurityPluginConfigType } from '..';

const configWith = (secure?: boolean) =>
  (({ cookie: { secure } } as unknown) as SecurityPluginConfigType);

describe('isCookieSecure', () => {
  beforeEach(() => {
    setDerivedCookieSecure(false);
  });

  it('derives true from a TLS listener when the setting is unset', () => {
    setDerivedCookieSecure(true);
    expect(isCookieSecure(configWith(undefined))).toBe(true);
  });

  it('derives false from a plain HTTP listener when the setting is unset', () => {
    expect(isCookieSecure(configWith(undefined))).toBe(false);
  });

  it('honours an explicit true on a plain HTTP listener (TLS-terminating proxy)', () => {
    expect(isCookieSecure(configWith(true))).toBe(true);
  });

  it('honours an explicit false on a TLS listener', () => {
    setDerivedCookieSecure(true);
    expect(isCookieSecure(configWith(false))).toBe(false);
  });
});

describe('clearOldVersionCookieValue', () => {
  beforeEach(() => {
    setDerivedCookieSecure(false);
  });

  it('adds Secure when the listener uses TLS', () => {
    setDerivedCookieSecure(true);
    expect(clearOldVersionCookieValue(configWith(undefined))).toContain('Secure');
  });

  it('omits Secure when the listener is plain HTTP', () => {
    expect(clearOldVersionCookieValue(configWith(undefined))).not.toContain('Secure');
  });
});
