import { straicoAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';

import { baseUrlv1 } from '../common/common';

export const createTextToSpeech = createAction({
  auth: straicoAuth,
  name: 'tts_create_text_to_speech',
  displayName: 'Create Text-to-Speech',
  description: 'Convert text to speech using Eleven Labs or OpenAI TTS models.',
  props: {
    model: Property.StaticDropdown({
      displayName: 'Model',
      required: true,
      description: 'Specifies the model to use for the TTS conversion.',
      defaultValue: 'eleven_multilingual_v2',
      options: {
        disabled: false,
        options: [
          { value: 'eleven_multilingual_v2', label: 'Eleven Labs Multilingual V2' },
          { value: 'eleven_v3', label: 'Eleven Labs V3' },
          { value: 'tts-1', label: 'OpenAI TTS-1' },
        ],
      },
    }),
    voice_id: Property.Dropdown({
      displayName: 'Voice',
      required: true,
      description: 'The voice to use for text-to-speech conversion.',
      refreshers: ['model', 'auth'],
      options: async ({ auth, model }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first',
          };
        }

        // For OpenAI TTS-1 model, return predefined voices
        if (model === 'tts-1') {
          return {
            disabled: false,
            options: [
              { value: 'alloy', label: 'Alloy' },
              { value: 'echo', label: 'Echo' },
              { value: 'fable', label: 'Fable' },
              { value: 'onyx', label: 'Onyx' },
              { value: 'nova', label: 'Nova' },
              { value: 'shimmer', label: 'Shimmer' },
            ],
          };
        }

        // For Eleven Labs models, fetch voices from API
        try {
          const response = await httpClient.sendRequest<{
            data: {
              voices: Array<{
                voice_id: string;
                name: string;
                category: string;
                labels: {
                  accent?: string;
                  gender?: string;
                  age?: string;
                };
                description: string;
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

          const voices = response.body?.data?.voices ?? [];
          return {
            disabled: false,
            options: voices.map((voice) => {
              const labels = [];
              if (voice.labels?.gender) labels.push(voice.labels.gender);
              if (voice.labels?.age) labels.push(voice.labels.age);
              if (voice.labels?.accent) labels.push(voice.labels.accent);
              const labelText = labels.length > 0 ? ` (${labels.join(', ')})` : '';

              return {
                label: `${voice.name}${labelText}`,
                value: voice.voice_id,
              };
            }),
          };
        } catch (e) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load voices. Check API key and try again.',
          };
        }
      },
    }),
    text: Property.LongText({
      displayName: 'Text',
      required: true,
      description: 'The text content to convert into speech (up to 4,000 characters).',
    }),
    language_code: Property.ShortText({
      displayName: 'Language Code',
      required: false,
      description: 'Optional language code with region (e.g., en-US for American English, es-ES for Spanish)',
    }),
  },
  async run({ auth, propsValue }) {
    const body: Record<string, string> = {
      model: propsValue.model,
      text: propsValue.text,
      voice_id: propsValue.voice_id,
    };

    if (propsValue.language_code) {
      body['language-code'] = propsValue.language_code;
    }

    const response = await httpClient.sendRequest<{
      data: {
        zip: string;
        audio: string;
        price: {
          total: number;
        };
      };
      success: boolean;
    }>({
      url: `${baseUrlv1}/tts/create`,
      method: HttpMethod.POST,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth as string,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    return {
      audio: response.body.data.audio,
      zip: response.body.data.zip,
      price: response.body.data.price.total,
      success: response.body.success,
    };
  },
});
