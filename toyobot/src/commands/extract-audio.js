/**
 * /extract-audio <url>
 * TODO -- this is incomplete
 */
import { InteractionResponseFlags, InteractionResponseType } from 'discord-interactions';
import { JsonResponse } from '../jsonresponse.js';
import { formatDataAsMarkdown } from '../utilities.js';
import { GetTrackURLs } from '../yotoplaylist.js';

export const EXTRACT_AUDIO_COMMAND = {
  name: 'extract-audio',
  description: 'Get track links from a playlist URL.\n this is incomplete.',
  options: [
    {
      name: 'url',
      description: 'URL of the playlist page. e.g.: https://yoto.io/hMkni?84brH2BNuhyl=e79sopPfwKnBL',
      required: true,
      type: 3,
    }
  ],
};

export async function EXTRACT_AUDIO_EXEC(request, env, interaction) {  
  const url = interaction.data.options[0].value;
  const data = await GetTrackURLs(url);
  const markdown = formatDataAsMarkdown(data);
  return new JsonResponse({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
          flags: InteractionResponseFlags.EPHEMERAL, //only show the message to the user who invoked the command
          content: markdown,
      }
  });
};