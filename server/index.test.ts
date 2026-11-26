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

import { configSchema } from '.';

describe('security plugin config', () => {
  it('requires a session on every route by default', () => {
    expect(configSchema.validate({}).auth.unauthenticated_routes).toEqual([]);
  });

  it('keeps the routes set in the configuration', () => {
    const config = configSchema.validate({
      auth: { unauthenticated_routes: ['/api/reporting/stats'] },
    });
    expect(config.auth.unauthenticated_routes).toEqual(['/api/reporting/stats']);
  });
});
