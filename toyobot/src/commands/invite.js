import { InteractionResponseType, InteractionResponseFlags } from 'discord-interactions';
import { JsonResponse } from '../jsonresponse.js';

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
