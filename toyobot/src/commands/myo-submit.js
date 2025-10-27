/**
 * /myo-submit <url>
 * /myo-submit url: https://yoto.io/hMkni?84brH2BNuhyl=e79sopPfwKnBL
 * TODO -- this is incomplete
 */
import { InteractionResponseFlags, InteractionResponseType } from 'discord-interactions';
import { JsonResponse } from '../jsonresponse.js';
import { formatDataAsMarkdown } from '../utilities.js';
import { AddUrlToD1 as MYOSubmit } from '../toyoarchive.js';

export const MYO_SUBMIT_COMMAND = {
  name: 'myo-submit',
  description: 'Submit a new MYO playlist.\n this is incomplete.',
  options: [
    {
      name: 'url',
      description: 'URL of the playlist page. e.g.: https://yoto.io/hMkni?84brH2BNuhyl=e79sopPfwKnBL',
      required: true,
      type: 3,
    }
  ],
};

export async function MYO_SUBMIT_EXEC(request, env, interaction) {  
  const url = interaction.data.options[0].value;
  const data = await MYOSubmit(url, env.MYO_ARCHIVE);
  const markdown = formatDataAsMarkdown(data);
  return new JsonResponse({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
          flags: InteractionResponseFlags.EPHEMERAL, //only show the message to the user who invoked the command
          content: markdown,
      }
  });
};