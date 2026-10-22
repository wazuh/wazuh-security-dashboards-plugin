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

// Wazuh: Added coverage for the Wazuh Get started page.

import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { getWazuhDocLinks, WazuhGetStarted } from '../wazuh-get-started';

jest.mock('../../app-router', () => {
  const { createContext } = jest.requireActual('react');
  return {
    DataSourceContext: createContext({ dataSource: { id: '' }, setDataSource: jest.fn() }),
  };
});
jest.mock('../../top-nav-menu', () => ({ SecurityPluginTopNavMenu: () => null }));
jest.mock('../../header/header-components', () => ({ PageHeader: () => null }));

const wazuhRolesMappingUrl = '/app/security#/security?tab=roleMapping';
const WazuhDocLinks = getWazuhDocLinks('5.0');

const renderPage = (backendConfigurable: boolean) => {
  const coreStart = {
    http: {},
    docLinks: { WAZUH_DOC_VERSION: '5.0' },
    application: {
      getUrlForApp: jest.fn(() => wazuhRolesMappingUrl),
      navigateToUrl: jest.fn(),
    },
  };
  render(
    <WazuhGetStarted
      coreStart={coreStart as any}
      params={{} as any}
      config={
        {
          ui: { backend_configurable: backendConfigurable },
          multitenancy: { enabled: false },
        } as any
      }
      depsStart={{}}
    />
  );
  return coreStart;
};

describe('Wazuh Get started page', () => {
  it('explains how access works and links to both halves', () => {
    const coreStart = renderPage(true);

    expect(document.querySelector('[data-test-subj="wazuh-how-access-works"]')).toHaveTextContent(
      'People sign in to the dashboard through the indexer'
    );
    fireEvent.click(screen.getByText('Wazuh roles mapping'));
    expect(coreStart.application.getUrlForApp).toHaveBeenCalledWith('security', {
      path: '#/security?tab=roleMapping',
    });
    expect(coreStart.application.navigateToUrl).toHaveBeenCalledWith(wazuhRolesMappingUrl);
  });

  it('marks adding backends as optional and names the Wazuh indexer config.yml path', () => {
    renderPage(true);

    expect(screen.getByText('Optional: Add backends (LDAP, SSO)')).toBeInTheDocument();
    expect(
      screen.getByText('/etc/wazuh-indexer/opensearch-security/config.yml')
    ).toBeInTheDocument();
    expect(screen.queryByText('The OpenSearch security plugin', { exact: false })).toBeNull();
  });

  it('links Learn more to the Wazuh documentation, and audit logs to OpenSearch', () => {
    renderPage(true);

    const hrefs = screen.getAllByRole('link').map((link) => link.getAttribute('href'));
    expect(hrefs).toEqual(
      expect.arrayContaining([
        WazuhDocLinks.UserAdministration,
        WazuhDocLinks.IndexerSecurity,
        WazuhDocLinks.IndexerRoles,
        WazuhDocLinks.IndexerRoleMappings,
      ])
    );
    expect(hrefs.filter((href) => href?.includes('opensearch.org'))).toHaveLength(1);
  });

  it('builds the Wazuh documentation links for the docs version of the dashboard core', () => {
    expect(getWazuhDocLinks('5.1').UserAdministration).toBe(
      'https://documentation.wazuh.com/5.1/user-manual/user-administration/index.html'
    );
  });

  it('leaves out the backends step when the backend is not configurable', () => {
    renderPage(false);

    expect(screen.queryByText('Optional: Add backends (LDAP, SSO)')).not.toBeInTheDocument();
    expect(screen.getByText('Create roles')).toBeInTheDocument();
  });
});
