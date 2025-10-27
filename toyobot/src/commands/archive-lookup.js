/**
 * /archive-lookup <id>
 * /archive-lookup id: 12345
 * /archive-lookup id: aWYV9
 * Query the TOYO Archive DB for a specific ID and return known metadata about it.
 */
import { InteractionResponseFlags, InteractionResponseType } from 'discord-interactions';
import { JsonResponse } from '../jsonresponse.js';
import { formatDataAsMarkdown } from '../utilities.js';
import { ReadArchiveMetadata } from '../toyoarchive.js';

export const ARCHIVE_LOOKUP_COMMAND = {
  name: 'archive-lookup',
  description: 'Query the TOYO Card DB and Store DB for a specific ID and return known metadata about it.',
  options: [
    {
      name: 'id',
      description: 'ID of the card or store item. e.g.: 12345 or aWYV9',
      required: true,
      type: 3,
    }
  ],
};

export async function ARCHIVE_LOOKUP_EXEC(request, env, interaction) {
  const id = interaction.data.options[0].value;
  const data = await ReadArchiveMetadata(id, env.ARCHIVE_SHEETS_DB_URL, env.ARCHIVE_SHEETS_API_KEY);
  const markdown = formatDataAsMarkdown(data);
  return new JsonResponse({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
          flags: InteractionResponseFlags.EPHEMERAL, 
          content: markdown,
      }
  });
}