/**
 * The core server that runs on a Cloudflare worker.
 */

import { AutoRouter } from 'itty-router';
import {
  InteractionResponseType,
  InteractionType,
  verifyKey,
} from 'discord-interactions';

import { commands } from './commands.js';
import { JsonResponse } from './jsonresponse.js';

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

router.get('/help', (request, env) => {
  const help = {
    description: 'Toyobot HTTP route reference (GET) and usage notes. These GET routes emulate the Discord interaction POSTs for quick testing.',
    routes: [
      { route: '/', method: 'GET', description: 'Basic hello page with application id.' },
      { route: '/help', method: 'GET', description: 'This help page (JSON).' },
      { 
        route: '/dev/:command', 
        description: 'Dynamically execute any registered command for testing. Options are passed as query parameters. E.g., /dev/yoto-store?url=https://...' 
      },
      { route: 'POST /', method: 'POST', params: 'Discord interaction JSON', example: 'POST / with Discord interaction payload', description: 'Primary production entrypoint for slash commands from Discord. This route provides a real ctx and must be used for correct background execution.' },
    ],
    notes: [
      'GET routes are for development and testing — they emulate the slash command inputs by constructing a fake interaction object from query parameters.',
      'For background work that must survive the immediate response, use POST interactions where Cloudflare provides a real `ctx` and `ctx.waitUntil`.',
      'The /myo-submit GET route provides a fake ctx.waitUntil that schedules the background job and logs completion; it does not replicate Cloudflare lifecycle guarantees.',
      'If you need the server to return the constructed interaction for debugging, add ?debug=1 to the request (consider requesting this change if desired).'
    ]
  };
  return new JsonResponse(help);
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
  const { isValid, interaction } = await server.verifyDiscordRequest(
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

async function verifyDiscordRequest(request, env) {
  console.log('Starting request verification...');
  const signature = request.headers.get('x-signature-ed25519');
  const timestamp = request.headers.get('x-signature-timestamp');
  
  console.log('Request headers:', {
    'x-signature-ed25519': signature ? 'present' : 'missing',
    'x-signature-timestamp': timestamp ? 'present' : 'missing',
    'content-type': request.headers.get('content-type'),
    'user-agent': request.headers.get('user-agent')
  });
  
  const body = await request.text();
  console.log('Request body:', body.substring(0, 1000)); // Log first 1000 chars of body
  
  if (!signature || !timestamp || !env.DISCORD_PUBLIC_KEY) {
    console.error('Missing verification components:', {
      signature: !!signature,
      timestamp: !!timestamp,
      publicKey: !!env.DISCORD_PUBLIC_KEY,
      bodyLength: body.length
    });
    return { isValid: false };
  }

  try {
    console.log('Attempting to verify key with:', {
      bodyLength: body.length,
      signatureLength: signature?.length,
      timestampLength: timestamp?.length,
      publicKeyLength: env.DISCORD_PUBLIC_KEY?.length
    });
    
    const isValidRequest = await verifyKey(body, signature, timestamp, env.DISCORD_PUBLIC_KEY);
    console.log('Key verification result:', isValidRequest);
    
    if (!isValidRequest) {
      console.error('Invalid request signature');
      return { isValid: false };
    }

    const parsedBody = JSON.parse(body);
    console.log('Successfully parsed interaction:', {
      type: parsedBody.type,
      commandName: parsedBody.data?.name,
      options: parsedBody.data?.options
    });
    
    return { 
      interaction: parsedBody, 
      isValid: true,
      rawBody: body // Keep the raw body in case we need it
    };
  } catch (err) {
    console.error('Verification error:', err);
    console.error('Error stack:', err.stack);
    return { isValid: false };
  }
}

const server = {
  verifyDiscordRequest,
  fetch: router.fetch,
};

export default server;
