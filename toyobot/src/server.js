/**
 * The core server that runs on a Cloudflare worker.
 */

import { AutoRouter } from 'itty-router';
import {
  InteractionResponseType,
  InteractionType,
  verifyKey,
} from 'discord-interactions';

// Import the command and execution function individually
import { AWWWW_COMMAND, AWWWW_EXEC } from './commands/awwww.js';
import { INVITE_COMMAND, INVITE_EXEC } from './commands/invite.js';
import { PING_COMMAND, PING_EXEC } from './commands/ping.js';

import { SERVER_COMMAND, SERVER_EXEC } from './commands/server.js';
import { USER_COMMAND, USER_EXEC } from './commands/user.js';
import { YOTO_PLAYLIST_COMMAND, YOTO_PLAYLIST_EXEC } from './commands.js';
import { YOTO_STORE_COMMAND, YOTO_STORE_EXEC } from './commands.js';
import { EXTRACT_AUDIO_COMMAND, EXTRACT_AUDIO_EXEC } from './commands.js';
import { EXTRACT_ICONS_COMMAND, EXTRACT_ICONS_EXEC } from './commands.js';
import { ARCHIVE_LOOKUP_COMMAND, ARCHIVE_LOOKUP_EXEC } from './commands.js';
import { MYO_SEARCH_COMMAND, MYO_SUBMIT_COMMAND, MYO_SEARCH_EXEC, MYO_SUBMIT_EXEC } from './commands.js'; 


// Import other local requirements
import { JsonResponse } from './jsonresponse.js';

const router = AutoRouter();

// Respond on HTTP/GET with the basic functions for debugging purposes
// TODO: Use GET parameters the same way as POST parameters so the functions can operate the same way over GET and POST
router.get('/awwww', (request, env) => {
  const interaction = {
    id: 'webget',
    token: 'webget',
    type: InteractionType.APPLICATION_COMMAND,
    member: { user: { username: 'webget', id: 'webget' }, nick: null },
    data: { name: 'awwww', options: [] },
  };
  return AWWWW_EXEC(request, env, interaction);
});

router.get('/user', (request, env) => {
  const interaction = {
    id: 'webget',
    token: 'webget',
    type: InteractionType.APPLICATION_COMMAND,
    member: { user: { username: 'webget', id: 'webget' }, nick: 'webget' },
    data: { name: 'user', options: [] },
  };
  return USER_EXEC(request, env, interaction);
});

router.get('/server', (request, env) => {
  const interaction = {
    id: 'webget',
    token: 'webget',
    type: InteractionType.APPLICATION_COMMAND,
    guild: { name: 'webget-server', memberCount: 0, createdAt: new Date().toISOString(), verificationLevel: 'none' },
    data: { name: 'server', options: [] },
  };
  return SERVER_EXEC(request, env, interaction);
});

router.get('/ping', (request, env) => {
  const interaction = { id: 'webget', token: 'webget', type: InteractionType.APPLICATION_COMMAND, data: { name: 'ping', options: [] } };
  return PING_EXEC(request, env, interaction);
});

router.get('/invite', (request, env) => {
  const interaction = { id: 'webget', token: 'webget', type: InteractionType.APPLICATION_COMMAND, data: { name: 'invite', options: [] } };
  return INVITE_EXEC(request, env, interaction);
});

router.get('/yoto-store', (request, env) => {
  const url = request.query.url || request.query.u || '';
  const interaction = {
    id: 'webget',
    token: 'webget',
    type: InteractionType.APPLICATION_COMMAND,
    data: { name: 'yoto-store', options: [{ name: 'url', value: url }] },
    channel_id: request.query.channel_id || null,
    member: { user: { id: request.query.user_id || 'webget', username: request.query.user || 'webget' } },
  };
  return YOTO_STORE_EXEC(request, env, interaction);
});

router.get('/yoto-playlist', (request, env) => {
  const url = request.query.url || request.query.u || '';
  const show = request.query.show === 'true' || request.query.show === '1' ? true : false;
  const interaction = {
    id: 'webget',
    token: 'webget',
    type: InteractionType.APPLICATION_COMMAND,
    data: { name: 'yoto-playlist', options: [{ name: 'url', value: url }, { name: 'show', value: show }] },
    channel_id: request.query.channel_id || null,
    member: { user: { id: request.query.user_id || 'webget', username: request.query.user || 'webget' } },
  };
  return YOTO_PLAYLIST_EXEC(request, env, interaction);
});

router.get('/extract-audio', (request, env) => {
  const url = request.query.url || request.query.u || '';
  const interaction = { id: 'webget', token: 'webget', type: InteractionType.APPLICATION_COMMAND, data: { name: 'extract-audio', options: [{ name: 'url', value: url }] } };
  return EXTRACT_AUDIO_EXEC(request, env, interaction);
});

router.get('/extract-icons', (request, env) => {
  const url = request.query.url || request.query.u || '';
  const interaction = { id: 'webget', token: 'webget', type: InteractionType.APPLICATION_COMMAND, data: { name: 'extract-icons', options: [{ name: 'url', value: url }] } };
  return EXTRACT_ICONS_EXEC(request, env, interaction);
});

router.get('/archive-lookup', (request, env) => {
  const id = request.query.id || request.query.q || '';
  const interaction = { id: 'webget', token: 'webget', type: InteractionType.APPLICATION_COMMAND, data: { name: 'archive-lookup', options: [{ name: 'id', value: id }] } };
  return ARCHIVE_LOOKUP_EXEC(request, env, interaction);
});

router.get('/myo-search', (request, env) => {
  const q = request.query.q || request.query.query || '';
  const interaction = { id: 'webget', token: 'webget', type: InteractionType.APPLICATION_COMMAND, data: { name: 'myo-search', options: [{ name: 'query', value: q }] } };
    return MYO_SEARCH_EXEC(request, env, interaction);
});

router.get('/myo-submit', (request, env) => {
  const url = request.query.url || request.query.u || '';
  const interaction = { id: 'webget', token: 'webget', type: InteractionType.APPLICATION_COMMAND, data: { name: 'myo-submit', options: [{ name: 'url', value: url }] } };
  // Simulate a Cloudflare `ctx` for GET/dev mode so background tasks can be scheduled.
  const fakeCtx = {
    waitUntil(promise) {
      // Don't await here; schedule and log completion/errors.
      Promise.resolve(promise)
        .then(() => {
          console.log('myo-submit background task completed (dev fakeCtx)');
        })
        .catch((err) => {
          console.error('myo-submit background task error (dev fakeCtx):', err && err.stack ? err.stack : err);
        });
    },
  };

    return MYO_SUBMIT_EXEC(request, env, interaction, fakeCtx);
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
      { route: '/', method: 'GET', params: null, example: '/', description: 'Basic hello page with application id.' },
      { route: '/help', method: 'GET', params: null, example: '/help', description: 'This help page (JSON).' },
      { route: '/awwww', method: 'GET', params: null, example: '/awwww', description: 'Return a cute image URL. Emulates /awwww slash command.' },
      { route: '/user', method: 'GET', params: null, example: '/user', description: 'Return user info. Emulates /user slash command.' },
      { route: '/server', method: 'GET', params: null, example: '/server', description: 'Return server info. Emulates /server slash command.' },
      { route: '/ping', method: 'GET', params: null, example: '/ping', description: 'Return Pong. Emulates /ping slash command.' },
      { route: '/invite', method: 'GET', params: null, example: '/invite', description: 'Return bot invite link. Emulates /invite slash command.' },
      { route: '/yoto-store', method: 'GET', params: ['url'], example: '/yoto-store?url=https://us.yotoplay.com/products/frog', description: 'Fetch metadata from a Yoto store page. Param: url' },
      { route: '/yoto-playlist', method: 'GET', params: ['url','show'], example: '/yoto-playlist?url=https://yoto.io/hMkni?84brH2BNuhyl=e79sopPfwKnBL&show=true', description: 'Fetch playlist metadata. Param: url. Optional show=true to make response public.' },
      { route: '/extract-audio', method: 'GET', params: ['url'], example: '/extract-audio?url=<playlist-url>', description: 'Return track audio URLs from a playlist page.' },
      { route: '/extract-icons', method: 'GET', params: ['url'], example: '/extract-icons?url=<playlist-url>', description: 'Return icon image URLs from a playlist page.' },
      { route: '/archive-lookup', method: 'GET', params: ['id'], example: '/archive-lookup?id=12345', description: 'Lookup an archived card by id.' },
      { route: '/myo-search', method: 'GET', params: ['q|query'], example: '/myo-search?q=roger+zelazny', description: 'Search the MYO archive by url, cardId, title, author, userId or creatorEmail.' },
      { route: '/myo-submit', method: 'GET', params: ['url'], example: '/myo-submit?url=https://yoto.io/hMkni?84brH2BNuhyl=e79sopPfwKnBL', description: 'Submit a MYO playlist URL. GET dev route simulates a ctx so background work will be scheduled; in production use the slash command POST.' },
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
    
    // Log all available command names for comparison
    console.log('Available commands:', {
      ping: PING_COMMAND.name.toLowerCase(),
      myo_search: MYO_SEARCH_COMMAND.name.toLowerCase(),
      yoto_playlist: YOTO_PLAYLIST_COMMAND.name.toLowerCase()
    });
    
    // Most user commands will come as `APPLICATION_COMMAND`.
    switch (interaction.data.name.toLowerCase()) {
      case AWWWW_COMMAND.name.toLowerCase(): {
        console.log('Executing AWWWW command');
        return AWWWW_EXEC(request, env, interaction);
      }
      case INVITE_COMMAND.name.toLowerCase(): {
        console.log('Executing INVITE command');
        return INVITE_EXEC(request, env, interaction);
      }
      case PING_COMMAND.name.toLowerCase():{
        console.log('Executing PING command');
        const responseBody = {
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: 'Pong!'
          }
        };
        
        // Log response details after a slight delay to not interfere with sending
        setTimeout(() => {
          console.log('Sent response:', JSON.stringify(responseBody));
        }, 100);
        
        return new Response(JSON.stringify(responseBody), {
          status: 200,
          headers: {
            'Content-Type': 'application/json;charset=UTF-8'
          }
        });
      }
      case SERVER_COMMAND.name.toLowerCase():{
        return SERVER_EXEC(request, env, interaction);
      }
      case USER_COMMAND.name.toLowerCase():{
        return USER_EXEC(request, env, interaction);
      }
      case YOTO_STORE_COMMAND.name.toLowerCase():{
        return YOTO_STORE_EXEC(request, env, interaction, ctx);
      }
      case YOTO_PLAYLIST_COMMAND.name.toLowerCase():{
        return YOTO_PLAYLIST_EXEC(request, env, interaction);
      }
      case EXTRACT_AUDIO_COMMAND.name.toLowerCase():{
        return EXTRACT_AUDIO_EXEC(request, env, interaction);
      }
      case EXTRACT_ICONS_COMMAND.name.toLowerCase():{
        return EXTRACT_ICONS_EXEC(request, env, interaction);
      }
      case ARCHIVE_LOOKUP_COMMAND.name.toLowerCase():{
        return ARCHIVE_LOOKUP_EXEC(request, env, interaction);
      }
      case MYO_SEARCH_COMMAND.name.toLowerCase():{
        return MYO_SEARCH_EXEC(request, env, interaction);
      }
      case MYO_SUBMIT_COMMAND.name.toLowerCase():{
        return MYO_SUBMIT_EXEC(request, env, interaction, ctx);
      }
      default:
        console.error('Unknown Command\n\n');
        console.log('Interaction:', interaction);
        console.log('Interaction Data:', interaction.data);
        console.log('Request', request);
        return new JsonResponse({ error: 'Unknown Type' }, { status: 400 });
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
