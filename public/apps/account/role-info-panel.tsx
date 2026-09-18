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
  EuiModal,
  EuiModalBody,
  EuiOverlayMask,
  EuiText,
  EuiHorizontalRule,
  EuiSpacer,
} from '@elastic/eui';
import React, { useCallback } from 'react';
import { i18n } from '@osd/i18n';
import { CoreStart } from 'opensearch-dashboards/public';
import { fetchAccountInfo } from './utils';

export function RoleInfoPanel(props: { coreStart: CoreStart; handleClose: () => void }) {
  const [roles, setRoles] = React.useState<string[]>([]);
  const [backendRoles, setBackendRoles] = React.useState<string[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const accountInfo = await fetchAccountInfo(props.coreStart.http);
      setRoles(accountInfo?.data.roles || []);
      setBackendRoles(accountInfo?.data.backend_roles || []);
    } catch (e) {
      console.log(e);
    }
  }, [props.coreStart.http]);

  React.useEffect(() => {
    fetchData();
  }, [props.coreStart.http, fetchData]);

  return (
    <EuiOverlayMask>
      <EuiModal data-test-subj="role-info-modal" onClose={props.handleClose}>
        <EuiSpacer />
        <EuiModalBody>
          <EuiText size="s">
            <h2>
              {i18n.translate('security.account.roles.title', {
                defaultMessage: 'Roles ({count})',
                values: { count: roles.length },
              })}
            </h2>
          </EuiText>
          <EuiText color="subdued" size="s">
            {i18n.translate('security.account.roles.description', {
              defaultMessage: 'Roles you are currently mapped to by your administrator.',
            })}
          </EuiText>
          <EuiSpacer />
          {roles.map((item) => (
            <EuiText key={item} size="s">
              {item}
              <br />
            </EuiText>
          ))}
          <EuiHorizontalRule />
          <EuiText size="s">
            <h2>
              {i18n.translate('security.account.backendRoles.title', {
                defaultMessage: 'Backend roles ({count})',
                values: { count: backendRoles.length },
              })}
            </h2>
          </EuiText>
          <EuiText color="subdued" size="s">
            {i18n.translate('security.account.backendRoles.description', {
              defaultMessage:
                'Backend roles you are currently mapped to by your administrator.',
            })}
          </EuiText>
          <EuiSpacer />
          {backendRoles.map((item) => (
            <EuiText key={item} size="s">
              {item}
              <br />
            </EuiText>
          ))}
        </EuiModalBody>
      </EuiModal>
    </EuiOverlayMask>
  );
}
