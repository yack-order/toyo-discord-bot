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

async function respondToInteraction(env, interaction) {
  const rest = new REST({ version: '10' }).setToken(env.DISCORD_TOKEN); // Ensure your bot token is set in the environment
  const url = Routes.interactionCallback(interaction.id, interaction.token);

  try {
    // Send the acknowledgment request
    const response = await rest.post(url, {
      body: {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: 'working on it...',
          //flags: InteractionResponseFlags.EPHEMERAL, // This makes the response ephemeral (only visible to the user who invoked the command)
        },
      },
    });
    console.log('Interaction responded successfully!', response);
  } catch (error) {
    console.error('Failed to respond to interaction:', error.message);
  }
}

async function sendFollowUp(env, interaction, markdown) {
  const rest = new REST({ version: '10' }).setToken(env.DISCORD_TOKEN); // Ensure your bot token is set in the environment
  const webhookUrl = Routes.webhook(interaction.application_id, interaction.token);

  try {
    // Send the follow-up message
    const response = await rest.post(webhookUrl, {
      body: {
        content: markdown,
      },
    });
    console.log('Follow-up message sent successfully!', response);
  } catch (error) {
    console.error('Failed to send follow-up message:', error.message);
  }
}
//==================================
//==================================



/*******************************************
 * /awwww 
 *******************************************/
export const AWWWW_COMMAND = {
  name: 'awwww',
  description: 'Drop some cuteness on this channel.',
};
import { getCuteUrl } from './reddit.js';
export async function AWWWW_EXEC(request, env, interaction) {  
    const cuteUrl = await getCuteUrl();
    return new JsonResponse({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
        content: cuteUrl,
        },
    });
};


/*******************************************
 * /invite 
 *******************************************/
export const INVITE_COMMAND = {
  name: 'invite',
  description: 'Get an invite link to add the bot to your server',
};
export function INVITE_EXEC(request, env, interaction) {  
  const applicationId = env.DISCORD_APPLICATION_ID;
  const INVITE_URL = `https://discord.com/oauth2/authorize?client_id=${applicationId}&scope=applications.commands`;
  return new JsonResponse({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
      content: INVITE_URL,
      flags: InteractionResponseFlags.EPHEMERAL,
      },
  });
};


/*******************************************
 * /ping 
 *******************************************/
export const PING_COMMAND = {
  name: 'ping',
  description: 'Replies with Pong!',
};
export function PING_EXEC(request, env, interaction) {  
  return new JsonResponse({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
          content: "Pong!",
      }
  })
};


/*******************************************
 * /server 
 *******************************************/
export const SERVER_COMMAND = {
  name: 'server',
  description: 'Replies with server info.',
};
export function SERVER_EXEC(request, env, interaction) {  
  return new JsonResponse({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
          content: `This command is not useful yet.
Server name: ${interaction.guild.name}
Total members: ${interaction.guild.memberCount}
Created at: ${interaction.guild.createdAt}
Verification level: ${interaction.guild.verificationLevel}`,
      }
  })
};


/*******************************************
 * /user 
 *******************************************/
export const USER_COMMAND = {
  name: 'user',
  description: 'Replies with user info.',
};
export function USER_EXEC(request, env, interaction) {  
  return new JsonResponse({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
          content: 
          `username: ${interaction.member.user.username}
id: ${interaction.member.user.id}
nickname: ${interaction.member.nick}`,
      }
  })
};


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
/*export async function YOTO_STORE_EXEC(request, env, interaction) {
  const url = interaction.data.options[0].value;
  const data = await ReadStoreData(url);
  const markdown = formatDataAsMarkdown(data);
  return new JsonResponse({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
          content: markdown,
      }
  });
}*/
export async function YOTO_STORE_EXEC(request, env, interaction, ctx) {
  const url = interaction.data.options[0].value;

  console.log('YOTO_STORE_EXEC', url);

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
      console.error("Error processing YOTO_STORE_EXEC:", error.message);
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
    },
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

