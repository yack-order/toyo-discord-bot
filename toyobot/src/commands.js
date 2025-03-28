/**
 * Share command metadata from a common spot to be used for both runtime
 * and registration.
 */

import { InteractionResponseFlags, InteractionResponseType, InteractionType } from 'discord-interactions';
import { JsonResponse } from './jsonresponse.js';
import { formatDataAsMarkdown } from './utilities.js';

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
export async function YOTO_STORE_EXEC(request, env, interaction) {
  const url = interaction.data.options[0].value;
  const data = await ReadStoreData(url);
  const markdown = formatDataAsMarkdown(data);
  return new JsonResponse({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
          content: markdown,
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
      //flags: InteractionResponseFlags.EPHEMERAL, //only show the message to the user who invoked the command
      data: {
          content: markdown,
      }
  });
};
