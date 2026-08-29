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
import { i18n } from '@osd/i18n';
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

const addBackendStep = {
  title: i18n.translate('security.getStarted.addBackends.title', {
    defaultMessage: 'Add backends',
  }),
  children: (
    <>
      <EuiText size="s" color="subdued">
        <FormattedMessage
          id="security.getStarted.addBackends.body"
          defaultMessage="Add authentication {authc} and authorization {authz} information to {configFile}. The {authc} section contains the backends to check user credentials against. The {authz} section contains any backends to fetch backend roles from. The most common example of a backend role is an LDAP group."
          values={{
            authc: <EuiCode>(authc)</EuiCode>,
            authz: <EuiCode>(authz)</EuiCode>,
            configFile: <EuiCode>config/opensearch-security/config.yml</EuiCode>,
          }}
        />{' '}
        <ExternalLink href={DocLinks.AuthenticationFlowDoc} />
      </EuiText>

      <EuiSpacer size="m" />

      <EuiFlexGroup gutterSize="s" wrap>
        <EuiFlexItem grow={false}>
          <ExternalLinkButton
            fill
            href={DocLinks.BackendConfigurationDoc}
            text={i18n.translate('security.getStarted.addBackends.configDocs', {
              defaultMessage: 'Config.yml documentation',
            })}
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiSmallButton
            data-test-subj="review-authentication-and-authorization"
            onClick={() => {
              window.location.href = buildHashUrl(ResourceType.auth);
            }}
          >
            {i18n.translate('security.getStarted.addBackends.reviewAuth', {
              defaultMessage: 'Review authentication and authorization',
            })}
          </EuiSmallButton>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiSpacer size="l" />
    </>
  ),
};

const setOfSteps = [
  {
    title: i18n.translate('security.getStarted.createRoles.title', {
      defaultMessage: 'Create roles',
    }),
    children: (
      <>
        <EuiText size="s" color="subdued">
          {i18n.translate('security.getStarted.createRoles.body', {
            defaultMessage:
              'Roles are reusable collections of permissions. The default roles are a great starting point, but you might need to create custom roles that meet your exact needs.',
          })}{' '}
          <ExternalLink href={DocLinks.CreateRolesDoc} />
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
              {i18n.translate('security.getStarted.createRoles.explore', {
                defaultMessage: 'Explore existing roles',
              })}
            </EuiSmallButton>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiSmallButton
              data-test-subj="create-new-role"
              onClick={() => {
                window.location.href = buildHashUrl(ResourceType.roles, Action.create);
              }}
            >
              {i18n.translate('security.getStarted.createRoles.create', {
                defaultMessage: 'Create new role',
              })}
            </EuiSmallButton>
          </EuiFlexItem>
        </EuiFlexGroup>

        <EuiSpacer size="l" />
      </>
    ),
  },
  {
    title: i18n.translate('security.getStarted.mapUsers.title', {
      defaultMessage: 'Map users',
    }),
    children: (
      <>
        <EuiText size="s" color="subdued">
          {i18n.translate('security.getStarted.mapUsers.body', {
            defaultMessage:
              "After a user successfully authenticates, the security plugin retrieves that user's roles. You can map roles directly to users, but you can also map them to backend roles.",
          })}{' '}
          <ExternalLink href={DocLinks.MapUsersToRolesDoc} />
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
              {i18n.translate('security.getStarted.mapUsers.map', {
                defaultMessage: 'Map users to a role',
              })}
            </EuiSmallButton>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiSmallButton
              data-test-subj="create-internal-user"
              onClick={() => {
                window.location.href = buildHashUrl(ResourceType.users, Action.create);
              }}
            >
              {i18n.translate('security.getStarted.mapUsers.createUser', {
                defaultMessage: 'Create internal user',
              })}
            </EuiSmallButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </>
    ),
  },
];

export function GetStarted(props: AppDependencies) {
  const dataSourceEnabled = !!props.depsStart.dataSource?.dataSourceEnabled;
  const { dataSource, setDataSource } = useContext(DataSourceContext)!;

  let steps;
  if (props.config.ui.backend_configurable) {
    steps = [addBackendStep, ...setOfSteps];
  } else {
    steps = setOfSteps;
  }
  const [toasts, addToast, removeToast] = useToastState();

  const buttonData = [
    {
      label: i18n.translate('security.getStarted.openInNewWindow', {
        defaultMessage: 'Open in new window',
      }),
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
                <h1>
                  {i18n.translate('security.getStarted.pageTitle', {
                    defaultMessage: 'Get started',
                  })}
                </h1>
              </EuiText>
              <ExternalLinkButton
                text={i18n.translate('security.getStarted.openInNewWindow', {
                  defaultMessage: 'Open in new window',
                })}
                href={buildHashUrl()}
              />
            </EuiPageHeader>
          }
          resourceType={'getStarted'}
        />
        <EuiPanel paddingSize="l">
          <EuiText size="s" color="subdued">
              <p>
                {i18n.translate('security.getStarted.intro', {
                  defaultMessage:
                    'The OpenSearch security plugin lets you define the API calls that users can make and the data they can access. The most basic configuration consists of these steps.',
                })}
              </p>
          </EuiText>

          <EuiSpacer size="l" />
          {props.config.ui.backend_configurable && <div className={'security-steps-diagram'} />}

          <EuiSpacer size="l" />

          <EuiSteps steps={steps} />
        </EuiPanel>

        <EuiSpacer size="l" />

        <EuiPanel paddingSize="l">
          <EuiTitle size="s">
            <h3>
              {i18n.translate('security.getStarted.auditLogs.title', {
                defaultMessage: 'Optional: Configure audit logs',
              })}
            </h3>
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
              {i18n.translate('security.getStarted.auditLogs.review', {
                defaultMessage: 'Review Audit Log Configuration',
              })}
            </EuiSmallButton>
          </EuiText>
        </EuiPanel>

        <EuiSpacer size="l" />

        <EuiPanel paddingSize="l">
          <EuiTitle size="s">
            <h3>
              {i18n.translate('security.getStarted.purgeCache.title', {
                defaultMessage: 'Optional: Purge cache',
              })}
            </h3>
          </EuiTitle>
          <EuiText size="s" color="subdued">
              <p>
                {i18n.translate('security.getStarted.purgeCache.body', {
                  defaultMessage:
                    'By default, the security plugin caches authenticated users, along with their roles and permissions. This option will purge cached users, roles and permissions.',
                })}
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
                      i18n.translate('security.getStarted.purgeCache.success', {
                        defaultMessage: 'Cache purge successful {cluster}',
                        values: { cluster: getClusterInfo(dataSourceEnabled, dataSource) },
                      }),
                      i18n.translate('security.getStarted.purgeCache.success', {
                        defaultMessage: 'Cache purge successful {cluster}',
                        values: { cluster: getClusterInfo(dataSourceEnabled, dataSource) },
                      })
                    )
                  );
                } catch (err) {
                  addToast(
                    createUnknownErrorToast(
                      'cache-flush-failed',
                      i18n.translate('security.getStarted.purgeCache.failed', {
                        defaultMessage: 'purge cache {cluster}',
                        values: { cluster: getClusterInfo(dataSourceEnabled, dataSource) },
                      })
                    )
                  );
                }
              }}
            >
              {i18n.translate('security.getStarted.purgeCache.button', {
                defaultMessage: 'Purge cache',
              })}
            </EuiSmallButton>
          </EuiText>
        </EuiPanel>

        <EuiSpacer size="l" />

        {props.config.multitenancy.enabled ? (
          <EuiPanel paddingSize="l">
            <EuiTitle size="s">
              <h3>
                {i18n.translate('security.getStarted.multiTenancy.title', {
                  defaultMessage: 'Optional: Multi-tenancy',
                })}
              </h3>
            </EuiTitle>
            <EuiText size="s" color="subdued">
              <p>
                {i18n.translate('security.getStarted.multiTenancy.body', {
                  defaultMessage:
                    'By default tenancy is activated in Dashboards. Tenants in OpenSearch Dashboards are spaces for saving index patterns, visualizations, dashboards, and other OpenSearch Dashboards objects.',
                })}
              </p>
              <EuiFlexGroup gutterSize="s">
                <EuiFlexItem grow={false}>
                  <EuiSmallButton
                    onClick={() => {
                      window.location.href = buildHashUrl(ResourceType.tenants);
                    }}
                  >
                    {i18n.translate('security.getStarted.multiTenancy.manage', {
                      defaultMessage: 'Manage Multi-tenancy',
                    })}
                  </EuiSmallButton>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiSmallButton
                    onClick={() => {
                      window.location.href = buildHashUrl(ResourceType.tenantsConfigureTab);
                    }}
                  >
                    {i18n.translate('security.getStarted.multiTenancy.configure', {
                      defaultMessage: 'Configure Multi-tenancy',
                    })}
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
