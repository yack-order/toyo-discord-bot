/**
 * /yoto-dev <url>
 * /yoto-dev url: https://us.yotoplay.com/products/paw-patrol-pup-pack
 */
import { InteractionResponseFlags, InteractionResponseType } from 'discord-interactions';
import { JsonResponse } from '../jsonresponse.js';
import { formatDataAsMarkdown, respondToInteraction, sendFollowUp } from '../utilities.js';
import { ReadStoreData } from '../yotostore.js';

export const DEV_COMMAND = {
  name: 'yoto-dev',
  description: 'Dev/testing command functionality.',
  options: [
    {
      name: 'url',
      description: 'URL of the store page. e.g.: https://us.yotoplay.com/products/frog-and-toad-audio-collection',
      required: true,
      type: 3,
    }
  ],
};

export async function DEV_EXEC(request, env, interaction, ctx) {
  const url = interaction.data.options[0].value;

  // Create a promise for the async operations
  const processPromise = (async () => {
    try {
      // Send the initial acknowledgment using the helper function
      await respondToInteraction(env, interaction);

      // Fetch the data and format it as markdown
      const data = await ReadStoreData(url);
      const markdown = formatDataAsMarkdown(data);

      // Send the follow-up message using the helper function
      await sendFollowUp(env, interaction, markdown);
    } catch (error) {
      console.error("Error processing DEV_EXEC:\n\n", error.message, "\n\n", error.stack);
      // Send an error follow-up message if something goes wrong
      await sendFollowUp(env, interaction, "An error occurred while processing your request.");
    }
  })();

  // Register the promise with waitUntil
  ctx.waitUntil(processPromise);

  // Immediately respond to the interaction
  return new JsonResponse({
    type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
    data: { flags: InteractionResponseFlags.EPHEMERAL }
  });
}