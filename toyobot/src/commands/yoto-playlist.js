import { InteractionResponseType, InteractionResponseFlags } from 'discord-interactions';
import { JsonResponse } from '../jsonresponse.js';
import { ReadPlaylistMetadata } from '../yotoplaylist.js';
import { formatDataAsMarkdown } from '../utilities.js';

/*******************************************
 * /yoto-playlist <url> <show>
 * /yoto-playlist url: https://yoto.io/hMkni?84brH2BNuhyl=e79sopPfwKnBL
 * /yoto-playlist url: https://yoto.io/hMkni?84brH2BNuhyl=e79sopPfwKnBL show: true
 *******************************************/
import { ReadPlaylistMetadata } from './yotoplaylist.js';
export const YOTO_PLAYLIST_COMMAND = {
  name: 'yoto-playlist',
  description: 'Get info from a playlist URL.',
  options: [
    {
      name: 'url',
      description: 'URL of the playlist page. e.g.: https://yoto.io/hMkni?84brH2BNuhyl=e79sopPfwKnBL',
      required: true,
      type: 3,
    },
    {
      name: 'show',
      description: 'Share response with the channel? Note: This means the URL is public.',
      required: false,
      type: 5,
      choices: [
        {
          name: 'yes',
          value: true,
        },
        {
          name: 'no',
          value: false,
        }
      ]
    }
  ],
};
export async function YOTO_PLAYLIST_EXEC(request, env, interaction) {  
  const url = interaction.data.options[0].value;
  const data = await ReadPlaylistMetadata(url);
  const markdown = formatDataAsMarkdown(data);
  const show = interaction.data.options[1]?.value;
  console.log(interaction.data.options);
  
  if (show) { //user has decided to allow the message to be public
    return new JsonResponse({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            content: markdown,
        }
    });
  }
  //only show the message to the user who invoked the command
  return new JsonResponse({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
          flags: InteractionResponseFlags.EPHEMERAL, 
          content: markdown,
      }
  });
};
