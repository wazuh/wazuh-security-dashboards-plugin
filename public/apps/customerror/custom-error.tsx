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
  EuiButton,
  EuiEmptyPrompt,
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiSmallButton,
  EuiText,
} from '@elastic/eui';
import { AppMountParameters, CoreStart } from 'opensearch-dashboards/public';
import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route } from 'react-router-dom';
import { ERROR_MISSING_ROLE_PATH, ERROR_SIGN_IN_PATH } from '../../../common';
import { logout } from '../account/utils';

interface CustomErrorDeps {
  title: string;
  subtitle: string;
  http: CoreStart['http'];
  iconType?: string;
  iconColor?: string;
  buttonLabel?: string;
  onButtonClick?: () => void;
}

// Same layout as the platform's own error screens (for example, "Application Not Found").
export function CustomErrorPage(props: CustomErrorDeps) {
  return (
    <EuiPage style={{ minHeight: '100vh' }}>
      <EuiPageBody component="main">
        <EuiPageContent verticalPosition="center" horizontalPosition="center">
          <EuiEmptyPrompt
            iconType={props.iconType ?? 'alert'}
            iconColor={props.iconColor ?? 'danger'}
            title={<h2>{props.title}</h2>}
            body={
              <EuiText size="s" color="subdued">
                <p>{props.subtitle}</p>
              </EuiText>
            }
            actions={
              <EuiButton
                fill
                onClick={props.onButtonClick ?? (() => logout(props.http, ''))}
                data-test-subj="error-logout-button"
              >
                {props.buttonLabel ?? 'Logout'}
              </EuiButton>
            }
          />
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  );
}

export async function renderPage(coreStart: CoreStart, params: AppMountParameters) {
  ReactDOM.render(
    <Router history={params.history}>
      <Route path={ERROR_MISSING_ROLE_PATH}>
        <CustomErrorPage
          http={coreStart.http}
          iconType="lock"
          iconColor="subdued"
          title="Missing Role"
          subtitle="No roles available for this user, please contact your system administrator."
        />
      </Route>
      <Route path={ERROR_SIGN_IN_PATH}>
        <CustomErrorPage
          http={coreStart.http}
          title="Single sign-on failed"
          subtitle="The identity provider configuration was rejected by the indexer. Contact your administrator."
          buttonLabel="Back to login"
          onButtonClick={() => {
            window.location.href = `${coreStart.http.basePath.serverBasePath}/`;
          }}
        />
      </Route>
    </Router>,
    params.element
  );
  return () => ReactDOM.unmountComponentAtNode(params.element);
}
export { EuiSmallButton };
