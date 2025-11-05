import { straicoAuth } from '../../index';
import { createAction } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';

import { baseUrlv1 } from '../common/common';

export const getElevenLabsVoices = createAction({
  auth: straicoAuth,
  name: 'tts_get_elevenlabs_voices',
  displayName: 'Get Eleven Labs Voices',
  description: 'Returns the list of available voices in Eleven Labs for text-to-speech.',
  props: {},
  async run({ auth }) {
    const response = await httpClient.sendRequest<{
      data: {
        voices: Array<{
          voice_id: string;
          name: string;
          category: string;
          labels: {
            accent?: string;
            descriptive?: string;
            age?: string;
            gender?: string;
            language?: string;
            use_case?: string;
          };
          description: string;
          preview_url: string;
          high_quality_base_model_ids: string[];
        }>;
      };
      success: boolean;
    }>({
      url: `${baseUrlv1}/tts/elevenlabslist`,
      method: HttpMethod.GET,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth as string,
      },
    });

    return {
      voices: response.body.data.voices,
      success: response.body.success,
    };
  },
});
