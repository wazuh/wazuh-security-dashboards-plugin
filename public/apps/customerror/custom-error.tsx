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

// Wazuh: commented out because the page now uses the platform error page layout (below).
// import { EuiSmallButton, EuiImage, EuiListGroup, EuiSpacer, EuiText } from '@elastic/eui';
// Wazuh: components of the platform error page layout.
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
import { ERROR_MISSING_ROLE_PATH } from '../../../common';
// Wazuh: page shown when single sign-on fails.
import { ERROR_SIGN_IN_PATH } from '../../../common';
import { ClientConfigType } from '../../types';
import { AuthType } from '../../../common';
import './_index.scss';
import { logout } from '../account/utils';

interface CustomErrorDeps {
  title: string;
  subtitle: string;
  http: CoreStart['http'];
  chrome: CoreStart['chrome'];
  config: ClientConfigType['ui'][AuthType.BASIC]['login'];
  // Wazuh: let each error page set its icon and its button.
  iconType?: string;
  iconColor?: string;
  buttonLabel?: string;
  onButtonClick?: () => void;
}

export function CustomErrorPage(props: CustomErrorDeps) {
  // Wazuh: commented out because the login page's legacy styles hide its subtitle (white on
  // gray). The page now uses the platform error page layout, as in "Application Not Found".
  // return (
  //   <EuiListGroup className="custom-error-wrapper">
  //     {props.config.showbrandimage && (
  //       <EuiImage alt="" url={props.config.brandimage || props.chrome.logos.OpenSearch.url} />
  //     )}
  //     <EuiSpacer size="s" />
  //     <EuiText size="m" textAlign="center">
  //       <h3>{props.title}</h3>
  //     </EuiText>
  //     <EuiSpacer size="s" />
  //     <EuiText size="s" textAlign="center">
  //       {props.subtitle}
  //     </EuiText>
  //     <EuiSpacer size="s" />
  //     <EuiSmallButton
  //       fill
  //       onClick={() => logout(props.http, '')}
  //       data-test-subj="error-logout-button"
  //       fullWidth
  //     >
  //       Logout
  //     </EuiSmallButton>
  //   </EuiListGroup>
  // );
  // Wazuh: platform error page layout. minHeight 100vh centers it in this chromeless app.
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

export async function renderPage(
  coreStart: CoreStart,
  params: AppMountParameters,
  config: ClientConfigType
) {
  ReactDOM.render(
    <Router history={params.history}>
      <Route path={ERROR_MISSING_ROLE_PATH}>
        <CustomErrorPage
          http={coreStart.http}
          chrome={coreStart.chrome}
          config={config.ui.basicauth.login}
          // Wazuh: a lock icon, as the error is about permissions.
          iconType="lock"
          iconColor="subdued"
          title="Missing Role"
          subtitle="No roles available for this user, please contact your system administrator."
        />
        {/* Wazuh: commented out a stray comma that rendered as text on the page. */}
        {/* , */}
      </Route>
      {/* Wazuh: page shown when single sign-on fails. */}
      <Route path={ERROR_SIGN_IN_PATH}>
        <CustomErrorPage
          http={coreStart.http}
          chrome={coreStart.chrome}
          config={config.ui.basicauth.login}
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
