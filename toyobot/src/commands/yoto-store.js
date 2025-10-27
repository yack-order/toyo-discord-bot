/**
 * /yoto-store <url>
 * /yoto-store url: https://us.yotoplay.com/products/paw-patrol-pup-pack
 */
import { InteractionResponseType } from 'discord-interactions';
import { JsonResponse } from '../jsonresponse.js';
import { formatDataAsMarkdown, splitMarkdown } from '../utilities.js';
import { ReadStoreData } from '../yotostore.js';

export const YOTO_STORE_COMMAND = {
  name: 'yoto-store',
  description: 'Get info from the store page. Note: May have geo limits.',
  options: [
    {
      name: 'url',
      description: 'URL of the store page. e.g.: https://us.yotoplay.com/products/frog-and-toad-audio-collection',
      required: true,
      type: 3,
    }
  ],
};

export async function YOTO_STORE_EXEC(request, env, interaction) {
  const url = interaction.data.options[0].value;
  const data = await ReadStoreData(url);
  const markdown = formatDataAsMarkdown(data);
  let {firstPart, secondPart} = splitMarkdown(markdown); //just discard the second part
  
  if (secondPart) {
    firstPart += "\n***ERR: Truncated message***";
  }
  return new JsonResponse({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
          content: firstPart,
      }
  });
}