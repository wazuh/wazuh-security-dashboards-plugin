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

import React from 'react';
import {
  EuiCallOut,
  EuiCodeBlock,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiOverlayMask,
  EuiSmallButton,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import {
  getPasswordsToolCommand,
  RESERVED_USER_PASSWORD_INSTRUCTION,
  RESERVED_USER_SERVICES_WARNING,
} from '../apps-constants';

interface ReservedUserPasswordPanelProps {
  username: string;
  handleClose: () => void;
}

export function ReservedUserPasswordPanel(props: ReservedUserPasswordPanelProps) {
  const passwordsToolCommand = getPasswordsToolCommand(props.username);

  return (
    <EuiOverlayMask>
      <EuiModal data-test-subj="reserved-user-password-modal" onClose={props.handleClose}>
        <EuiSpacer />
        <EuiModalBody>
          <EuiText size="s">
            <h2>Reset password for &quot;{props.username}&quot;</h2>
            <p>{RESERVED_USER_PASSWORD_INSTRUCTION}</p>
          </EuiText>

          <EuiSpacer size="s" />

          <EuiCodeBlock
            data-test-subj="passwords-tool-command"
            language="bash"
            fontSize="s"
            paddingSize="s"
            isCopyable
          >
            {passwordsToolCommand}
          </EuiCodeBlock>

          <EuiSpacer size="s" />

          <EuiCallOut
            data-test-subj="reserved-user-services-warning"
            color="warning"
            iconType="alert"
            size="s"
          >
            {RESERVED_USER_SERVICES_WARNING}
          </EuiCallOut>
        </EuiModalBody>
        <EuiModalFooter>
          <EuiSmallButton data-test-subj="close" fill onClick={props.handleClose}>
            Close
          </EuiSmallButton>
        </EuiModalFooter>
      </EuiModal>
    </EuiOverlayMask>
  );
}
