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
  EuiSmallButton,
  EuiSmallButtonEmpty,
  EuiCallOut,
  EuiCompressedFieldPassword,
  EuiFlexGroup,
  EuiFlexItem,
  EuiCompressedFormRow,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiOverlayMask,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import { CoreStart } from 'opensearch-dashboards/public';
import { FormRow } from '../configuration/utils/form-row';
import { logout, updateNewPassword } from './utils';
import { PASSWORD_INSTRUCTION } from '../apps-constants';
import { constructErrorMessageAndLog } from '../error-utils';
import {
  isResetButtonDisabled,
  validateCurrentPassword,
} from '../../utils/password-reset-panel-utils';
import { getDashboardsInfo } from '../../utils/dashboards-info-utils';
import { PasswordStrengthBar } from '../configuration/utils/password-strength-bar';

interface PasswordResetPanelProps {
  coreStart: CoreStart;
  username: string;
  handleClose: () => void;
  logoutUrl?: string;
}

export function PasswordResetPanel(props: PasswordResetPanelProps) {
  const [currentPassword, setCurrentPassword] = React.useState<string>('');
  // reply on backend response of login call to verify
  const [isCurrentPasswordInvalid, setIsCurrentPasswordInvalid] = React.useState<boolean>(false);
  const [currentPasswordError, setCurrentPasswordError] = React.useState<string[]>([]);

  const [newPassword, setNewPassword] = React.useState<string>('');
  // reply on backend response of user update call to verify
  const [isNewPasswordInvalid, setIsNewPasswordInvalid] = React.useState<boolean>(false);

  const [repeatNewPassword, setRepeatNewPassword] = React.useState<string>('');
  const [isRepeatNewPasswordInvalid, setIsRepeatNewPasswordInvalid] = React.useState<boolean>(
    false
  );

  const [errorCallOut, setErrorCallOut] = React.useState<string>('');

  const [passwordHelpText, setPasswordHelpText] = React.useState<string>(PASSWORD_INSTRUCTION);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setPasswordHelpText(
          (await getDashboardsInfo(props.coreStart.http)).password_validation_error_message
        );
      } catch (e) {
        console.error(e);
      }
    };

    fetchData();
  }, [props.coreStart.http]);

  const handleReset = async () => {
    const http = props.coreStart.http;
    // validate the current password
    try {
      await validateCurrentPassword(http, props.username, currentPassword);
    } catch (e) {
      setIsCurrentPasswordInvalid(true);
      setCurrentPasswordError([
        i18n.translate('security.account.reset.invalidCurrentPassword', {
          defaultMessage: 'Invalid current password. {detail}',
          values: { detail: e.message },
        }),
      ]);
      return;
    }

    // update new password
    try {
      await updateNewPassword(http, newPassword, currentPassword);

      await logout(http, props.logoutUrl);
    } catch (e) {
      setErrorCallOut(
        constructErrorMessageAndLog(
          e,
          i18n.translate('security.account.reset.failed', {
            defaultMessage: 'Failed to reset password.',
          })
        )
      );
    }
  };

  // TODO: replace the instruction message for new password once UX provides it.
  return (
    <EuiOverlayMask>
      <EuiModal data-test-subj="reset-password-modal" onClose={props.handleClose}>
        <EuiSpacer />
        <EuiModalBody>
          <EuiText size="s">
            <h2>
              <FormattedMessage
                id="security.account.reset.title"
                defaultMessage='Reset password for "{username}"'
                values={{ username: props.username }}
              />
            </h2>
          </EuiText>

          <EuiSpacer />

          <FormRow
            headerText={i18n.translate('security.account.reset.currentPassword', {
              defaultMessage: 'Current password',
            })}
            helpText={i18n.translate('security.account.reset.currentPasswordHelp', {
              defaultMessage: 'Verify your account by entering your current password.',
            })}
            isInvalid={isCurrentPasswordInvalid}
            error={currentPasswordError}
          >
            <EuiCompressedFieldPassword
              data-test-subj="current-password"
              onChange={function (e: React.ChangeEvent<HTMLInputElement>) {
                setCurrentPassword(e.target.value);
                setIsCurrentPasswordInvalid(false);
              }}
              isInvalid={isCurrentPasswordInvalid}
              type="dual"
            />
          </FormRow>
          <EuiSpacer />

          <EuiFlexGroup direction="row">
            <EuiFlexItem grow={false}>
              <FormRow
                headerText={i18n.translate('security.account.reset.newPassword', {
                  defaultMessage: 'New password',
                })}
                helpText={passwordHelpText}
                isInvalid={isNewPasswordInvalid}
              >
                <EuiCompressedFieldPassword
                  data-test-subj="new-password"
                  onChange={function (e: React.ChangeEvent<HTMLInputElement>) {
                    setNewPassword(e.target.value);
                    setIsNewPasswordInvalid(false);
                    setIsRepeatNewPasswordInvalid(repeatNewPassword !== newPassword);
                  }}
                  type="dual"
                  isInvalid={isNewPasswordInvalid}
                />
              </FormRow>
              <EuiCompressedFormRow>
                <PasswordStrengthBar password={newPassword} />
              </EuiCompressedFormRow>
            </EuiFlexItem>
          </EuiFlexGroup>

          <FormRow
            headerText={i18n.translate('security.account.reset.reenterPassword', {
              defaultMessage: 'Re-enter new password',
            })}
            helpText={i18n.translate('security.account.reset.reenterPasswordHelp', {
              defaultMessage: 'The password must be identical to what you entered above.',
            })}
          >
            <EuiCompressedFieldPassword
              data-test-subj="reenter-new-password"
              isInvalid={isRepeatNewPasswordInvalid}
              onChange={function (e: React.ChangeEvent<HTMLInputElement>) {
                const value = e.target.value;
                setRepeatNewPassword(value);
                setIsRepeatNewPasswordInvalid(value !== newPassword);
              }}
              type="dual"
            />
          </FormRow>

          <EuiSpacer />

          {errorCallOut && (
            <EuiCallOut color="danger" iconType="alert">
              {errorCallOut}
            </EuiCallOut>
          )}
        </EuiModalBody>
        <EuiModalFooter>
          <EuiSmallButtonEmpty data-test-subj="cancel" onClick={props.handleClose}>
            {i18n.translate('security.account.reset.cancel', {
              defaultMessage: 'Cancel',
            })}
          </EuiSmallButtonEmpty>

          <EuiSmallButton
            data-test-subj="reset"
            fill
            disabled={isResetButtonDisabled(
              currentPassword,
              newPassword,
              isRepeatNewPasswordInvalid
            )}
            onClick={handleReset}
          >
            {i18n.translate('security.account.reset.submit', {
              defaultMessage: 'Reset',
            })}
          </EuiSmallButton>
        </EuiModalFooter>
      </EuiModal>
    </EuiOverlayMask>
  );
}
