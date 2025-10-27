/**
 * The core server that runs on a Cloudflare worker.
 */

import { AutoRouter } from 'itty-router';
import {
  InteractionResponseType,
  InteractionType,
} from 'discord-interactions';

import { commands } from './commands.js';
import { JsonResponse } from './jsonresponse.js';
import { verifyDiscordRequest } from './discord-utils.js';

const router = AutoRouter();

/**
 * A dynamic GET route for testing any command.
 * e.g. /dev/ping
 *      /dev/yoto-store?url=...
 */
router.get('/dev/:command', (request, env) => {
  const commandName = request.params.command;
  const command = commands[commandName];

  if (!command) {
    return new JsonResponse({ error: 'Command not found' }, { status: 404 });
  }

  // Construct a mock interaction from query parameters
  const options = command.definition.options?.map(opt => ({
    name: opt.name,
    value: request.query[opt.name],
  })) || [];

  const interaction = {
    id: 'webget',
    token: 'webget',
    type: InteractionType.APPLICATION_COMMAND,
    member: { user: { username: 'webget', id: 'webget' }, nick: 'webget' },
    guild: { name: 'webget-server', memberCount: 0, createdAt: new Date().toISOString(), verificationLevel: 'none' },
    data: { name: commandName, options },
  };

  // Simulate a Cloudflare `ctx` for GET/dev mode so background tasks can be scheduled.
  const fakeCtx = {
    waitUntil(promise) {
      Promise.resolve(promise)
        .then(() => {
          console.log(`Background task for ${commandName} completed (dev fakeCtx)`);
        })
        .catch((err) => {
          console.error(`Background task for ${commandName} error (dev fakeCtx):`, err && err.stack ? err.stack : err);
        });
    },
  };

  return command.handler(request, env, interaction, fakeCtx);
});

/**
 * A simple :wave: hello page to verify the worker is working.
 */
router.get('/', (request, env) => {
  return new Response(`👋 ${env.DISCORD_APPLICATION_ID}`);
});

/**
 * Main route for all requests sent from Discord.  All incoming messages will
 * include a JSON payload described here:
 * https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-object
 */
router.post('/', async (request, env, ctx) => {
  // Debugging sentinel: log that a POST arrived (helps detect whether Discord is reaching the worker at all)
  try {
    console.log('PRE-JSON: Received POST request');
    const body = await request.clone().json();
    console.log('POST-JSON: Successfully parsed request body');
    console.log('FULL BODY:', JSON.stringify(body, null, 2));
    console.log('LOG- Incoming POST / at', new Date().toISOString(), {
      'user-agent': request.headers.get('user-agent'),
      'x-signature-ed25519': request.headers.get('x-signature-ed25519') ? 'present' : 'missing',
      'x-signature-timestamp': request.headers.get('x-signature-timestamp') ? 'present' : 'missing',
      'interaction-type': body.type,  // 1=Ping, 2=Application Command
      'command': body.type === 2 ? body.data?.name : 'n/a', // Show command name if it's an application command
      'guild': body.guild_id ? `guild:${body.guild_id}` : 'dm',
      'user': body.member?.user?.id || body.user?.id || 'unknown'
    });
  } catch (e) {
    console.log('Error logging incoming request:', e && e.stack ? e.stack : e);
  }
  const { isValid, interaction } = await verifyDiscordRequest(
    request,
    env,
  );
  if (!isValid || !interaction) {
    console.error('Invalid request:', {
      hasValidSignature: isValid,
      hasInteraction: !!interaction,
      publicKeyPresent: !!env.DISCORD_PUBLIC_KEY,
    });
    return new JsonResponse({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: 'Bad request signature.'
      }
    });
  }

  if (interaction.type === InteractionType.PING) {
    // The `PING` message is used during the initial webhook handshake, and is
    // required to configure the webhook in the developer portal.
    return new JsonResponse({
      type: InteractionResponseType.PONG,
    });
  }

  if (interaction.type === InteractionType.APPLICATION_COMMAND) {
    console.log('Received command:', {
      name: interaction.data.name,
      lowercaseName: interaction.data.name.toLowerCase(),
      type: interaction.data.type,
      options: interaction.data.options
    });
    
    const commandName = interaction.data.name.toLowerCase();
    const command = commands[commandName];

    if (command) {
      console.log(`Executing command: ${commandName}`);
      return command.handler(request, env, interaction, ctx);
    } else {
      console.error(`Unknown Command: ${commandName}`);
      return new JsonResponse({ error: 'Unknown command' }, { status: 400 });
    }
  }

  if (interaction.type === InteractionType.MESSAGE_COMPONENT) {
    // The `MESSAGE_COMPONENT` message is used for all button and select interactions.
    console.log('Message Component Interaction:', interaction);
    switch (interaction.data.custom_id.toLowerCase()) {
      default:
        console.error('Unknown Message Component\n\n');
        console.log('Interaction:', interaction);
        console.log('Interaction Data:', interaction.data);
        console.log('Request', request);
        return new JsonResponse({ error: 'Unknown Type' }, { status: 400 });
    }
    
  }

  console.error('Unknown Type');
  return new JsonResponse({ error: 'Unknown Type' }, { status: 400 });
});
router.all('*', () => new Response('Not Found.', { status: 404 }));

const server = {
  fetch: router.fetch,
};

export default server;
