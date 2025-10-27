import { InteractionResponseType } from 'discord-interactions';
import { JsonResponse } from '../jsonresponse.js';

export const SERVER_COMMAND = {
  name: 'server',
  description: 'Replies with server info.',
};

export function SERVER_EXEC(request, env, interaction) {  
  return new JsonResponse({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
          content: `This command is not useful yet.\nServer name: ${interaction.guild.name}\nTotal members: ${interaction.guild.memberCount}\nCreated at: ${interaction.guild.createdAt}\nVerification level: ${interaction.guild.verificationLevel}`,
      }
  })
};

