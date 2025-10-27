/**
 * /myo-search query
 * /myo-search query: "roger zelazny"
 * TODO -- this is incomplete
 */
import { InteractionResponseType } from 'discord-interactions';
import { JsonResponse } from '../jsonresponse.js';
import { SearchArchiveDetailed, formatSearchResultsMarkdown } from '../toyoarchive.js';

export const MYO_SEARCH_COMMAND = {
  name: 'myo-search',
  description: 'Search the archive of MYO playlistss. Only use one type at a time.\n this is incomplete.',
  options: [
    {
      name: 'query',
    description: 'Enter a playlist URL, cardId, author, title, userId, or creatorEmail (e.g. "roger zelazny")',
      required: true,
      type: 3,
    }
  ],
};

export async function MYO_SEARCH_EXEC(request, env, interaction) {  
  const query = interaction.data.options[0].value;
  
  try {
    const data = await SearchArchiveDetailed(query, env.MYO_ARCHIVE);
    const markdown = formatSearchResultsMarkdown(data);
    
    return new JsonResponse({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: { content: markdown }
    });
  } catch (error) {
    console.error('MYO_SEARCH error:', error);
    return new JsonResponse({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: { content: 'An error occurred while searching.' }
    });
  }
};