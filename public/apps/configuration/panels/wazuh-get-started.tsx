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

// Wazuh: Get started page in Wazuh terms, rendered instead of the upstream `get-started.tsx`. It
// keeps the upstream page and adds the How access works card, Wazuh documentation links, and an
// optional first step with the Wazuh indexer path.

import {
  EuiSmallButton,
  EuiCode,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPageHeader,
  EuiPanel,
  EuiSpacer,
  EuiSteps,
  EuiText,
  EuiTitle,
  EuiGlobalToastList,
} from '@elastic/eui';
import React, { useContext } from 'react';
import { FormattedMessage } from '@osd/i18n/react';
import { AppDependencies } from '../../types';
import { buildHashUrl } from '../utils/url-builder';
import { Action } from '../types';
import { ResourceType } from '../../../../common';
import { API_ENDPOINT_CACHE, DocLinks } from '../constants';
import { ExternalLink, ExternalLinkButton } from '../utils/display-utils';
import { createRequestContextWithDataSourceId } from '../utils/request-utils';
import { createSuccessToast, createUnknownErrorToast, useToastState } from '../utils/toast-utils';
import { SecurityPluginTopNavMenu } from '../top-nav-menu';
import { DataSourceContext } from '../app-router';
import { getClusterInfo } from '../../../utils/datasource-utils';
import { PageHeader } from '../header/header-components';

// Wazuh documentation pages, for the docs version the dashboard core resolves from the Wazuh build.
export const getWazuhDocLinks = (wazuhDocVersion: string) => {
  const docs = `https://documentation.wazuh.com/${wazuhDocVersion}/user-manual`;
  return {
    UserAdministration: `${docs}/user-administration/index.html`,
    IndexerSecurity: `${docs}/wazuh-indexer/security.html`,
    IndexerRoles: `${docs}/wazuh-indexer/security.html#roles`,
    IndexerRoleMappings: `${docs}/wazuh-indexer/security.html#role-mappings`,
  };
};

type WazuhDocLinks = ReturnType<typeof getWazuhDocLinks>;

// App id and route of Server management > Wazuh API access, in the Wazuh main plugin.
const WAZUH_API_ACCESS_APP_ID = 'security';
const WAZUH_ROLES_MAPPING_PATH = '#/security?tab=roleMapping';

const getAddBackendStep = (docLinks: WazuhDocLinks) => ({
  title: 'Optional: Add backends (LDAP, SSO)',
  children: (
    <>
      <EuiText size="s" color="subdued">
        Add authentication<EuiCode>(authc)</EuiCode>and authorization<EuiCode>(authz)</EuiCode>
        information to<EuiCode>/etc/wazuh-indexer/opensearch-security/config.yml</EuiCode>. The
        <EuiCode>authc</EuiCode> section contains the backends to check user credentials against.
        The <EuiCode>authz</EuiCode>
        section contains any backends to fetch backend roles from. The most common example of a
        backend role is an LDAP group. <ExternalLink href={docLinks.UserAdministration} />
      </EuiText>

      <EuiSpacer size="m" />

      <EuiFlexGroup gutterSize="s" wrap>
        <EuiFlexItem grow={false}>
          <ExternalLinkButton
            fill
            href={docLinks.IndexerSecurity}
            text="Config.yml documentation"
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiSmallButton
            data-test-subj="review-authentication-and-authorization"
            onClick={() => {
              window.location.href = buildHashUrl(ResourceType.auth);
            }}
          >
            Review authentication and authorization
          </EuiSmallButton>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiSpacer size="l" />
    </>
  ),
});

const getSetOfSteps = (docLinks: WazuhDocLinks) => [
  {
    title: 'Create roles',
    children: (
      <>
        <EuiText size="s" color="subdued">
          Roles are reusable collections of permissions. The default roles are a great starting
          point, but you might need to create custom roles that meet your exact needs.{' '}
          <ExternalLink href={docLinks.IndexerRoles} />
        </EuiText>

        <EuiSpacer size="m" />

        <EuiFlexGroup gutterSize="s">
          <EuiFlexItem grow={false}>
            <EuiSmallButton
              data-test-subj="explore-existing-roles"
              onClick={() => {
                window.location.href = buildHashUrl(ResourceType.roles);
              }}
            >
              Explore existing roles
            </EuiSmallButton>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiSmallButton
              data-test-subj="create-new-role"
              onClick={() => {
                window.location.href = buildHashUrl(ResourceType.roles, Action.create);
              }}
            >
              Create new role
            </EuiSmallButton>
          </EuiFlexItem>
        </EuiFlexGroup>

        <EuiSpacer size="l" />
      </>
    ),
  },
  {
    title: 'Map users',
    children: (
      <>
        <EuiText size="s" color="subdued">
          After a user successfully authenticates, the security plugin retrieves that user’s roles.
          You can map roles directly to users, but you can also map them to backend roles.{' '}
          <ExternalLink href={docLinks.IndexerRoleMappings} />
        </EuiText>

        <EuiSpacer size="m" />

        <EuiFlexGroup gutterSize="s">
          <EuiFlexItem grow={false}>
            <EuiSmallButton
              data-test-subj="map-users-to-role"
              onClick={() => {
                window.location.href = buildHashUrl(ResourceType.users);
              }}
            >
              Map users to a role
            </EuiSmallButton>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiSmallButton
              data-test-subj="create-internal-user"
              onClick={() => {
                window.location.href = buildHashUrl(ResourceType.users, Action.create);
              }}
            >
              Create internal user
            </EuiSmallButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </>
    ),
  },
];

export function WazuhGetStarted(props: AppDependencies) {
  const dataSourceEnabled = !!props.depsStart.dataSource?.dataSourceEnabled;
  const { dataSource, setDataSource } = useContext(DataSourceContext)!;

  const wazuhDocLinks = getWazuhDocLinks(props.coreStart.docLinks.WAZUH_DOC_VERSION);
  const openWazuhRolesMapping = () =>
    props.coreStart.application.navigateToUrl(
      props.coreStart.application.getUrlForApp(WAZUH_API_ACCESS_APP_ID, {
        path: WAZUH_ROLES_MAPPING_PATH,
      })
    );

  let steps;
  if (props.config.ui.backend_configurable) {
    steps = [getAddBackendStep(wazuhDocLinks), ...getSetOfSteps(wazuhDocLinks)];
  } else {
    steps = getSetOfSteps(wazuhDocLinks);
  }
  const [toasts, addToast, removeToast] = useToastState();

  const buttonData = [
    {
      label: 'Open in new window',
      isLoading: false,
      href: buildHashUrl(),
      iconType: 'popout',
      iconSide: 'right',
      type: 'button',
      target: '_blank',
    },
  ];
  return (
    <>
      <div className="panel-restrict-width">
        <SecurityPluginTopNavMenu
          {...props}
          dataSourcePickerReadOnly={false}
          setDataSource={setDataSource}
          selectedDataSource={dataSource}
        />
        <PageHeader
          navigation={props.depsStart.navigation}
          coreStart={props.coreStart}
          appRightControls={buttonData}
          fallBackComponent={
            <EuiPageHeader>
              <EuiText size="s">
                <h1>Get started</h1>
              </EuiText>
              <ExternalLinkButton text="Open in new window" href={buildHashUrl()} />
            </EuiPageHeader>
          }
          resourceType={'getStarted'}
        />
        <EuiSpacer size="l" />
        <EuiPanel paddingSize="l" data-test-subj="wazuh-how-access-works">
          <EuiTitle size="s">
            <h2>How access works</h2>
          </EuiTitle>
          <EuiSpacer size="s" />
          <EuiText size="s">
            <p>
              People sign in to the dashboard through the indexer, with an internal user or an LDAP
              or SSO account. Indexer roles decide which indexed data they can access. What they can
              do in Wazuh (agents, groups, server management) comes from a Wazuh role, assigned in
              Server management &gt; Wazuh API access &gt; Roles mapping. Its rules match the user
              name, backend roles (group names) or indexer roles.{' '}
              <ExternalLink href={wazuhDocLinks.UserAdministration} />
            </p>
          </EuiText>
          <EuiSpacer size="m" />
          <EuiFlexGroup gutterSize="s" wrap>
            <EuiFlexItem grow={false}>
              <EuiSmallButton
                data-test-subj="how-access-works-internal-users"
                onClick={() => {
                  window.location.href = buildHashUrl(ResourceType.users);
                }}
              >
                Internal users
              </EuiSmallButton>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiSmallButton
                data-test-subj="how-access-works-wazuh-roles-mapping"
                onClick={openWazuhRolesMapping}
              >
                Wazuh roles mapping
              </EuiSmallButton>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiPanel>

        <EuiSpacer size="l" />

        <EuiPanel paddingSize="l">
          {props.config.ui.backend_configurable && <div className={'security-steps-diagram'} />}

          <EuiSpacer size="l" />

          <EuiSteps steps={steps} />
        </EuiPanel>

        <EuiSpacer size="l" />

        <EuiPanel paddingSize="l">
          <EuiTitle size="s">
            <h3>Optional: Configure audit logs</h3>
          </EuiTitle>
          <EuiText size="s" color="subdued">
            <p>
              <FormattedMessage
                id="audit.logs.introduction"
                defaultMessage="Audit logs let you track user access to your OpenSearch cluster and are useful for compliance purposes."
              />{' '}
              <ExternalLink href={DocLinks.AuditLogsDoc} />
            </p>
            <EuiSmallButton
              data-test-subj="review-audit-log-configuration"
              onClick={() => {
                window.location.href = buildHashUrl(ResourceType.auditLogging);
              }}
            >
              Review Audit Log Configuration
            </EuiSmallButton>
          </EuiText>
        </EuiPanel>

        <EuiSpacer size="l" />

        <EuiPanel paddingSize="l">
          <EuiTitle size="s">
            <h3>Optional: Purge cache</h3>
          </EuiTitle>
          <EuiText size="s" color="subdued">
            <p>
              By default, the security plugin caches authenticated users, along with their roles and
              permissions. This option will purge cached users, roles and permissions.
            </p>
            <EuiSmallButton
              iconType="refresh"
              data-test-subj="purge-cache"
              onClick={async () => {
                try {
                  await createRequestContextWithDataSourceId(dataSource.id).httpDelete({
                    http: props.coreStart.http,
                    url: API_ENDPOINT_CACHE,
                  });
                  addToast(
                    createSuccessToast(
                      'cache-flush-success',
                      `Cache purge successful ${getClusterInfo(dataSourceEnabled, dataSource)}`,
                      `Cache purge successful ${getClusterInfo(dataSourceEnabled, dataSource)}`
                    )
                  );
                } catch (err) {
                  addToast(
                    createUnknownErrorToast(
                      'cache-flush-failed',
                      `purge cache ${getClusterInfo(dataSourceEnabled, dataSource)}`
                    )
                  );
                }
              }}
            >
              Purge cache
            </EuiSmallButton>
          </EuiText>
        </EuiPanel>

        <EuiSpacer size="l" />

        {props.config.multitenancy.enabled ? (
          <EuiPanel paddingSize="l">
            <EuiTitle size="s">
              <h3>Optional: Multi-tenancy</h3>
            </EuiTitle>
            <EuiText size="s" color="subdued">
              <p>
                By default tenancy is activated in Dashboards. Tenants in OpenSearch Dashboards are
                spaces for saving index patterns, visualizations, dashboards, and other OpenSearch
                Dashboards objects.
              </p>
              <EuiFlexGroup gutterSize="s">
                <EuiFlexItem grow={false}>
                  <EuiSmallButton
                    onClick={() => {
                      window.location.href = buildHashUrl(ResourceType.tenants);
                    }}
                  >
                    Manage Multi-tenancy
                  </EuiSmallButton>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiSmallButton
                    onClick={() => {
                      window.location.href = buildHashUrl(ResourceType.tenantsConfigureTab);
                    }}
                  >
                    Configure Multi-tenancy
                  </EuiSmallButton>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiText>
          </EuiPanel>
        ) : null}
      </div>
      <EuiGlobalToastList toasts={toasts} toastLifeTimeMs={10000} dismissToast={removeToast} />
    </>
  );
}
