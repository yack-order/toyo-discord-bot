import { InteractionResponseType } from 'discord-interactions';
import { JsonResponse } from '../jsonresponse.js';

export const USER_COMMAND = {
  name: 'user',
  description: 'Replies with user info.',
};

export function USER_EXEC(request, env, interaction) {  
  return new JsonResponse({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
          content: 
          `username: ${interaction.member.user.username}\nid: ${interaction.member.user.id}\nnickname: ${interaction.member.nick}`,
      }
  })
};
