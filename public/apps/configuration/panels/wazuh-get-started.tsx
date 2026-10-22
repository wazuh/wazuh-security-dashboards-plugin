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

// Wazuh: Get started page in Wazuh terms. Replaces the upstream `get-started.tsx` page, which
// explains the OpenSearch security plugin and links to opensearch.org.

import {
  EuiSmallButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLink,
  EuiPageHeader,
  EuiPanel,
  EuiSpacer,
  EuiSteps,
  EuiText,
  EuiTitle,
  EuiGlobalToastList,
} from '@elastic/eui';
import React, { useContext } from 'react';
import { AppDependencies } from '../../types';
import { buildHashUrl } from '../utils/url-builder';
import { Action } from '../types';
import { ResourceType } from '../../../../common';
import { API_ENDPOINT_CACHE, DocLinks } from '../constants';
import { ExternalLinkButton } from '../utils/display-utils';
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
    InternalUsers: `${docs}/wazuh-indexer/security.html#internal-users`,
    IndexerRoles: `${docs}/wazuh-indexer/security.html#roles`,
    WazuhRoleMapping: `${docs}/user-administration/rbac.html`,
    Ldap: `${docs}/user-administration/ldap.html`,
    SingleSignOn: `${docs}/user-administration/single-sign-on/index.html`,
  };
};

// App id and route of Server management > Wazuh API access, in the Wazuh main plugin.
const WAZUH_API_ACCESS_APP_ID = 'security';
const WAZUH_ROLES_MAPPING_PATH = '#/security?tab=roleMapping';

function DocLink(props: { href: string; text?: string }) {
  return (
    <EuiLink external href={props.href} target="_blank" className="external-link-inline-block">
      {props.text ?? 'Learn more'}
    </EuiLink>
  );
}

export function WazuhGetStarted(props: AppDependencies) {
  const dataSourceEnabled = !!props.depsStart.dataSource?.dataSourceEnabled;
  const { dataSource, setDataSource } = useContext(DataSourceContext)!;
  const [toasts, addToast, removeToast] = useToastState();
  const wazuhDocLinks = getWazuhDocLinks(props.coreStart.docLinks.WAZUH_DOC_VERSION);

  const wazuhRolesMappingUrl = props.coreStart.application.getUrlForApp(WAZUH_API_ACCESS_APP_ID, {
    path: WAZUH_ROLES_MAPPING_PATH,
  });
  const openWazuhRolesMapping = () =>
    props.coreStart.application.navigateToUrl(wazuhRolesMappingUrl);

  const steps = [
    {
      title: 'Create an internal user',
      children: (
        <>
          <EuiText size="s" color="subdued">
            Create the account the person signs in with. Skip this step for LDAP or SSO users: their
            accounts live in the provider. <DocLink href={wazuhDocLinks.InternalUsers} />
          </EuiText>
          <EuiSpacer size="m" />
          <EuiFlexGroup gutterSize="s">
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
            <EuiFlexItem grow={false}>
              <EuiSmallButton
                data-test-subj="explore-internal-users"
                onClick={() => {
                  window.location.href = buildHashUrl(ResourceType.users);
                }}
              >
                Explore internal users
              </EuiSmallButton>
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiSpacer size="l" />
        </>
      ),
    },
    {
      title: 'Map an indexer role',
      children: (
        <>
          <EuiText size="s" color="subdued">
            Indexer roles decide which indices and documents the user can access. Map a role to the
            user, or to a backend role (a group name such as admin) to cover everyone in that group.{' '}
            <DocLink href={wazuhDocLinks.IndexerRoles} />
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
      title: 'Map a Wazuh role',
      children: (
        <>
          <EuiText size="s" color="subdued">
            Wazuh roles decide what the user can do with agents, groups and server management. Map
            one, for example <strong>administrator</strong> or <strong>readonly</strong>, to the
            user name or a backend role in Server management &gt; Wazuh API access &gt; Roles
            mapping. Without it, the user signs in but sees no agents.{' '}
            <DocLink href={wazuhDocLinks.WazuhRoleMapping} />
          </EuiText>
          <EuiSpacer size="m" />
          <EuiSmallButton data-test-subj="open-wazuh-roles-mapping" onClick={openWazuhRolesMapping}>
            Open Wazuh roles mapping
          </EuiSmallButton>
        </>
      ),
    },
  ];

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
              <DocLink href={wazuhDocLinks.UserAdministration} />
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
          <EuiTitle size="s">
            <h2>Give someone access</h2>
          </EuiTitle>
          <EuiSpacer size="l" />
          <EuiSteps steps={steps} headingElement="h3" />
        </EuiPanel>

        {props.config.ui.backend_configurable && (
          <>
            <EuiSpacer size="l" />
            <EuiPanel paddingSize="l">
              <EuiTitle size="s">
                <h3>Optional: Connect LDAP or SSO</h3>
              </EuiTitle>
              <EuiText size="s" color="subdued">
                <p>
                  To let people sign in with LDAP, Active Directory or a single sign-on provider,
                  add it to the indexer security configuration. Their backend roles then come from
                  the provider, for example their LDAP groups.
                </p>
              </EuiText>
              <EuiSpacer size="m" />
              <EuiFlexGroup gutterSize="s" wrap>
                <EuiFlexItem grow={false}>
                  <ExternalLinkButton href={wazuhDocLinks.Ldap} text="LDAP documentation" />
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <ExternalLinkButton
                    href={wazuhDocLinks.SingleSignOn}
                    text="Single sign-on documentation"
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
            </EuiPanel>
          </>
        )}

        <EuiSpacer size="l" />

        <EuiPanel paddingSize="l">
          <EuiTitle size="s">
            <h3>Optional: Configure audit logs</h3>
          </EuiTitle>
          <EuiText size="s" color="subdued">
            <p>
              Audit logs track who accessed the indexer and are useful for compliance.{' '}
              <DocLink href={DocLinks.AuditLogsDoc} text="OpenSearch documentation" />
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
              The indexer caches signed-in users with their roles and permissions. Purge it when a
              change, for example in LDAP, does not apply right away.
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
                Tenants are spaces for saving index patterns, visualizations, dashboards and other
                saved objects.
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
