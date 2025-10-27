/**
 * Share command metadata from a common spot to be used for both runtime
 * and registration.
 */

import { InteractionResponseFlags, InteractionResponseType, InteractionType } from 'discord-interactions';
import { JsonResponse } from './jsonresponse.js';
import { formatDataAsMarkdown } from './utilities.js';

//==================================
//==================================
// helper functions
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';

const MAX_LENGTH = 1950; // Discord's maximum message length is 2000 characters, but we leave some space for formatting

async function respondToInteraction(env, interaction) {
  console.log('Starting respondToInteraction function...');
  
  const rest = new REST({ version: '10' }).setToken(env.DISCORD_TOKEN);
  console.log('REST client initialized with token.');

  const url = Routes.interactionCallback(interaction.id, interaction.token);
  console.log(`Generated interaction callback URL: ${url}`);

  if (!interaction) {
    console.error('Interaction object is null or undefined.');
    return;
  }

  if (!interaction.token) {
    console.error('Interaction token is null or undefined.');
    return;
  }

  console.log('Interaction and token are valid. Proceeding to send acknowledgment...');

  try {
    const response = await rest.post(url, {
      body: {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: 'working on it...',
          flags: InteractionResponseFlags.EPHEMERAL, // This makes the response ephemeral (only visible to the user who invoked the command)
        },
      },
    });
    console.log('Interaction responded successfully!', response);
  } catch (error) {
    console.error('Failed to respond to interaction:', error.message);
    console.error('Error stack trace:', error.stack);
  }

  console.log('Exiting respondToInteraction function.');
}

function isMessageTooLong(markdown) {
  return markdown.length > MAX_LENGTH;
}

function splitMarkdown(markdown) {
  if (isMessageTooLong(markdown)) {
    // Find the last newline character before max_length
    const splitIndex = markdown.lastIndexOf('\n', MAX_LENGTH);

    // If a newline character is found, split at that point
    if (splitIndex !== -1) {
      const firstPart = markdown.slice(0, splitIndex); // First part up to the newline
      const secondPart = markdown.slice(splitIndex + 1); // Remaining part after the newline
      console.log(`Splitting message into two parts at newline: ${firstPart.length} and ${secondPart.length}`);
      return { firstPart, secondPart };
    }

    // If no newline is found, fall back to splitting at max_length
    const firstPart = markdown.slice(0, MAX_LENGTH);
    const secondPart = markdown.slice(MAX_LENGTH);
    console.log(`Splitting message into two parts at max_length: ${firstPart.length} and ${secondPart.length}`);
    return { firstPart, secondPart };
  } else {
    return { firstPart: markdown, secondPart: null }; // No need to split
  }
}

///yoto-dev url: https://us.yotoplay.com/products/paw-patrol-pup-pack
async function sendFollowUp(env, interaction, markdown) {
  const rest = new REST({ version: '10' }).setToken(env.DISCORD_TOKEN); // Ensure your bot token is set in the environment
  //const webhookUrl = Routes.channelMessages(interaction.channel_id);
  //const webhookUrl = Routes.webhook(env.DISCORD_APPLICATION_ID, interaction.token);
  const istoolong = isMessageTooLong(markdown);

  if(!istoolong) {
    //message is short enough, so it can be sent in one go
    console.log('Sending follow-up message:', markdown);
    try {
      // Send the first part of the follow-up message
      const webhookUrl = `https://discord.com/api/v10/webhooks/${env.DISCORD_APPLICATION_ID}/${interaction.token}/callback`;
      const response = await rest.post(webhookUrl, {
        body: {
          content: markdown,
        },
      });
      console.log('Follow-up message sent successfully!', response);
    }
    catch (error) {
      console.error('Failed to send follow-up message:', error.message);
    }
  }
  else if(istoolong){
    console.log('Message is too long, splitting it.');
    const msgcount = await sendSplitFollowUp(env, interaction.token, markdown);
    console.log(`All messages completed in '${msgcount}' messages.`);
  }else{
    console.log('Message is somehow invalid.');
  }
}

async function sendSplitFollowUp(env, token, markdown, isFirst=true) {
  const rest = new REST({ version: '10' }).setToken(env.DISCORD_TOKEN); // Ensure your bot token is set in the environment
  let webhookUrl;
  if(isFirst){
    webhookUrl = `https://discord.com/api/v10/webhooks/${env.DISCORD_APPLICATION_ID}/${token}/callback`;
  }else if (!isFirst){
    webhookUrl = `https://discord.com/api/v10/webhooks/${env.DISCORD_APPLICATION_ID}/${token}`;
  }
  // Split the message into two parts
  const { firstPart, secondPart } = splitMarkdown(markdown);
  console.log(`First part:(${firstPart.length})`, firstPart);
  console.log(`Second part:(${secondPart.length})`, secondPart);
  let msgcount = 0;
  // Send the first part of the message
  try {
    await rest.post(webhookUrl, {
      body: {
        content: firstPart,
      },
    });
    console.log('First part sent successfully!');
    msgcount++;
  }
  catch (error) {
    console.error('Failed to send first part:', error.message);
  }
  // If there is a second part, send it
  if (secondPart) {
    console.log('Sending second part:', secondPart);
    msgcount += await sendSplitFollowUp(env, token, secondPart, false);
    console.log('Second part sent successfully!');
  }
  return msgcount;
}
//==================================
//==================================


/*******************************************
 * /yoto-store <url>
 * /yoto-store url: https://us.yotoplay.com/products/paw-patrol-pup-pack
 *******************************************/
import { ReadStoreData } from './yotostore.js';
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
  console.log(`First part:(${firstPart.length})`, firstPart);
  console.log(`Second part:(${secondPart.length})`, secondPart);
  return new JsonResponse({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
          content: firstPart,
      }
  });
}

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
/*******************************************
 * /archive-lookup <id>
 * /archive-lookup id: 12345
 * /archive-lookup id: aWYV9
 * Query the TOYO Archive DB for a specific ID and return known metadata about it.
 *******************************************/
import { ReadArchiveMetadata } from './toyoarchive.js';
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
  console.log(`Archive Lookup for ID: ${id}`);
  console.log(`Data: ${JSON.stringify(data)}`);
  //only show the message to the user who invoked the command
  return new JsonResponse({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
          flags: InteractionResponseFlags.EPHEMERAL, 
          content: markdown,
      }
  });
}



//==============================================================================================
//==============================================================================================
//stuff below here is not working yet
/*******************************************
 * /yoto-store <url>
 * /yoto-store url: https://us.yotoplay.com/products/paw-patrol-pup-pack
 *******************************************/
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

  console.log('DEV_EXEC', url);

  // Create a promise for the async operations
  const processPromise = (async () => {
    try {
      console.log(`Inside waitUntil, Sending initial acknowledgment...`);
  
      // Send the initial acknowledgment using the helper function
      await respondToInteraction(env, interaction);

      console.log('Fetching data from Yoto Store...');
      // Fetch the data and format it as markdown
      const data = await ReadStoreData(url);
      console.log('Data fetched successfully:', data);
      const markdown = formatDataAsMarkdown(data);
      console.log('Formatted data:', markdown);

      // Send the follow-up message using the helper function
      await sendFollowUp(env, interaction, markdown);
      console.log('Follow-up message sent successfully!');
    } catch (error) {
      console.error("Error processing DEV_EXEC:\n\n", error.message, "\n\n", error.stack);
      // Send an error follow-up message if something goes wrong
      await sendFollowUp(env, interaction, "An error occurred while processing your request.");
    }
  })();

  // Register the promise with waitUntil
  ctx.waitUntil(processPromise);

  return new JsonResponse({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content: 'Processing request...',
      flags: InteractionResponseFlags.EPHEMERAL, // This makes the response ephemeral (only visible to the user who invoked the command)
    },
  });
}

/*******************************************
 * /extract-audio <url>
 * TODO -- this is incomplete
 *******************************************/
import { GetTrackURLs } from './yotoplaylist.js';
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
      flags: InteractionResponseFlags.EPHEMERAL, //only show the message to the user who invoked the command
      data: {
          content: markdown,
      }
  });
};


/*******************************************
 * /extract-icons <url>
 * TODO -- this is incomplete
 *******************************************/
import { GetIconURLs } from './yotoplaylist.js';
export const EXTRACT_ICONS_COMMAND = {
  name: 'extract-icons',
  description: 'Get icon files from a playlist URL.\n this is incomplete.',
  options: [
    {
      name: 'url',
      description: 'URL of the playlist page. e.g.: https://yoto.io/hMkni?84brH2BNuhyl=e79sopPfwKnBL',
      required: true,
      type: 3,
    }
  ],
};
export async function EXTRACT_ICONS_EXEC(request, env, interaction) {  
  const url = interaction.data.options[0].value;
  const data = await GetIconURLs(url);
  const markdown = formatDataAsMarkdown(data);
  return new JsonResponse({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      flags: InteractionResponseFlags.EPHEMERAL, //only show the message to the user who invoked the command
      data: {
          content: markdown,
      }
  });
};


//***********************************
// ********************************
// ********************************
// these functions will leverage the cloudflare database */
/*******************************************
 * /myo-submit <url>
 * /myo-submit url: https://yoto.io/hMkni?84brH2BNuhyl=e79sopPfwKnBL
 * TODO -- this is incomplete
 *******************************************/
import { AddUrlToD1 as MYOSubmit } from './toyoarchive.js';
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
      flags: InteractionResponseFlags.EPHEMERAL, //only show the message to the user who invoked the command
      data: {
          content: markdown,
      }
  });
};

/*******************************************
 * /myo-search query
 * /myo-search query: "roger zelazny"
 * TODO -- this is incomplete
 *******************************************/
import { SearchArchiveDetailed, formatSearchResultsMarkdown } from './toyoarchive.js';
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
  console.log('Creating MYO_SEARCH response');
  const query = interaction.data.options[0].value;
  console.log('Search query:', query);
  
  try {
    const data = await SearchArchiveDetailed(query, env.MYO_ARCHIVE);
    const markdown = formatSearchResultsMarkdown(data);
    console.log('Search result markdown:', markdown);
    
    return new JsonResponse({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: markdown
      }
    });
  } catch (error) {
    console.error('MYO_SEARCH error:', error);
    return new JsonResponse({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: 'An error occurred while searching.'
      }
    });
  }
};