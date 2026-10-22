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
import { ReservedUserPasswordPanel } from '../reserved-user-password-panel';

describe('Account menu - Reserved user password panel', () => {
  const handleClose = jest.fn();
  const component = shallow(
    <ReservedUserPasswordPanel username="admin" handleClose={handleClose} />
  );

  it('shows the passwords tool command as a copyable bash code block', () => {
    const codeBlock = component.find('[data-test-subj="passwords-tool-command"]');
    expect(codeBlock.prop('language')).toBe('bash');
    expect(codeBlock.prop('isCopyable')).toBe(true);
    expect(codeBlock.children().text()).toBe(
      'cd /usr/share/wazuh-indexer/tools && bash wazuh-passwords-tool.sh -u admin -p'
    );
    expect(component.find('h2').text()).toContain('admin');
  });

  it('warns about updating the password in other services using the user', () => {
    expect(component.find('[data-test-subj="reserved-user-services-warning"]').exists()).toBe(true);
  });

  it('does not render the reset form', () => {
    expect(component.find('[data-test-subj="current-password"]').exists()).toBe(false);
    expect(component.find('[data-test-subj="new-password"]').exists()).toBe(false);
    expect(component.find('[data-test-subj="reset"]').exists()).toBe(false);
  });

  it('closes from the modal and the Close button', () => {
    component.find('[data-test-subj="reserved-user-password-modal"]').simulate('close');
    component.find('[data-test-subj="close"]').simulate('click');
    expect(handleClose).toHaveBeenCalledTimes(2);
  });
});
