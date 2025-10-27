
import { InteractionResponseType } from 'discord-interactions';
import { JsonResponse } from '../jsonresponse.js';

export const PING_COMMAND = {
  name: 'ping',
  description: 'Replies with Pong!',
};

export function PING_EXEC(request, env, interaction) {  
  console.log('Creating PING response');
  const responseBody = {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
          content: "Pong!",
      }
  };
  console.log('Response body:', JSON.stringify(responseBody));
  const response = new JsonResponse(responseBody, {
    status: 200,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  });
  console.log('Response headers:', Object.fromEntries(response.headers.entries()));
  console.log('Response status:', response.status);
  return response;
};
