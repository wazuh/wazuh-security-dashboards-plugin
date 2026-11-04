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
import { shallow } from 'enzyme';
import React from 'react';
import { CustomErrorPage } from '../custom-error';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EuiSmallButton } from '../custom-error';
import { logout } from '../../account/utils';
// Wazuh: imports for the single sign-on error page test.
import { createMemoryHistory } from 'history';
import { fireEvent, within } from '@testing-library/react';
import { renderPage } from '../custom-error';
import { ERROR_SSO_SIGN_IN_PATH } from '../../../../common';

afterEach(() => {
  cleanup();
});

describe('Custom error page test', () => {
  let component;

  beforeEach(() => {
    component = shallow(
      <EuiSmallButton fill onClick={logout} data-test-subj="error-logout-button" fullWidth>
        Logout
      </EuiSmallButton>
    );
  });

  it('renders and clicks the button on the error page', () => {
    const wrapper = shallow(
      <CustomErrorPage
        title="Title"
        subtitle="Sub Title"
        http={undefined}
        chrome={undefined}
        config={{
          title: '',
          subtitle: '',
          showbrandimage: false,
          brandimage: '',
          buttonstyle: '',
        }}
      />
    );

    expect(wrapper).toMatchSnapshot();

    component.find('[data-test-subj="error-logout-button"]').simulate('onClick', {
      preventDefault: () => {},
    });
  });
});

// Wazuh: covers the page shown when single sign-on fails.
describe('Sign-in error page test', () => {
  it('renders the single sign-on error and goes back to login', async () => {
    const originalLocation = window.location;
    delete window.location;
    window.location = { href: '' };
    const element = document.body.appendChild(document.createElement('div'));
    const unmount = await renderPage(
      { http: { basePath: { serverBasePath: '/basepath' } }, chrome: {} },
      { history: createMemoryHistory({ initialEntries: [ERROR_SSO_SIGN_IN_PATH] }), element },
      { ui: { basicauth: { login: { showbrandimage: false } } } }
    );
    const page = within(element);

    expect(page.getByText('Single sign-on failed')).toBeInTheDocument();
    expect(
      page.getByText(
        'The identity provider configuration was rejected by the indexer. Contact your administrator.'
      )
    ).toBeInTheDocument();
    fireEvent.click(page.getByText('Back to login'));
    expect(window.location.href).toBe('/basepath/');

    unmount();
    element.remove();
    window.location = originalLocation;
  });
});
