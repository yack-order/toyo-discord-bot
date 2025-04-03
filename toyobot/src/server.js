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
import { AWWWW_COMMAND, AWWWW_EXEC } from './commands.js';
import { INVITE_COMMAND, INVITE_EXEC } from './commands.js';
import { PING_COMMAND, PING_EXEC } from './commands.js';
import { SERVER_COMMAND, SERVER_EXEC } from './commands.js';
import { USER_COMMAND, USER_EXEC } from './commands.js';
import { YOTO_PLAYLIST_COMMAND, YOTO_PLAYLIST_EXEC } from './commands.js';
import { YOTO_STORE_COMMAND, YOTO_STORE_EXEC } from './commands.js';
import { EXTRACT_AUDIO_COMMAND, EXTRACT_AUDIO_EXEC } from './commands.js';
import { EXTRACT_ICONS_COMMAND, EXTRACT_ICONS_EXEC } from './commands.js';

// Import other local requirements
import { JsonResponse } from './jsonresponse.js';

const router = AutoRouter();

// Respond on HTTP/GET with the basic functions for debugging purposes
// TODO: Use GET parameters the same way as POST parameters so the functions can operate the same way over GET and POST
router.get('/awwww', (request, env) => {
  return AWWWW_EXEC(request, env, "webget");
});

router.get('/user', (request, env) => {
  return USER_EXEC(request, env, "webget");
});

router.get('/server', (request, env) => {
  return SERVER_EXEC(request, env, "webget");
});

router.get('/ping', (request, env) => {
  return PING_EXEC(request, env, "webget");
});

router.get('/invite', (request, env) => {
  return INVITE_EXEC(request, env, "webget");
});

router.get('/yoto-store', (request, env) => {
  return YOTO_STORE_EXEC(request, env, "webget");
});

router.get('/yoto-playlist', (request, env) => {
  return YOTO_PLAYLIST_EXEC(request, env, "webget");
});

router.get('/extract-audio', (request, env) => {
  return EXTRACT_AUDIO_EXEC(request, env, "webget");
});

router.get('/extract-icons', (request, env) => {
  return EXTRACT_ICONS_EXEC(request, env, "webget");
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
router.post('/', async (request, env) => {
  const { isValid, interaction } = await server.verifyDiscordRequest(
    request,
    env,
  );
  if (!isValid || !interaction) {
    return new Response('Bad request signature.', { status: 401 });
  }

  if (interaction.type === InteractionType.PING) {
    // The `PING` message is used during the initial webhook handshake, and is
    // required to configure the webhook in the developer portal.
    return new JsonResponse({
      type: InteractionResponseType.PONG,
    });
  }

  if (interaction.type === InteractionType.APPLICATION_COMMAND) {
    // Most user commands will come as `APPLICATION_COMMAND`.
    switch (interaction.data.name.toLowerCase()) {
      case AWWWW_COMMAND.name.toLowerCase(): {
        return AWWWW_EXEC(request, env, interaction);
      }
      case INVITE_COMMAND.name.toLowerCase(): {
        return INVITE_EXEC(request, env, interaction);
      }
      case PING_COMMAND.name.toLowerCase():{
        return PING_EXEC(request, env, interaction);
      }
      case SERVER_COMMAND.name.toLowerCase():{
        return SERVER_EXEC(request, env, interaction);
      }
      case USER_COMMAND.name.toLowerCase():{
        return USER_EXEC(request, env, interaction);
      }
      case YOTO_STORE_COMMAND.name.toLowerCase():{
        return YOTO_STORE_EXEC(request, env, interaction);
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
  const signature = request.headers.get('x-signature-ed25519');
  const timestamp = request.headers.get('x-signature-timestamp');
  const body = await request.text();
  const isValidRequest =
    signature &&
    timestamp &&
    (await verifyKey(body, signature, timestamp, env.DISCORD_PUBLIC_KEY));
  if (!isValidRequest) {
    return { isValid: false };
  }
  //console.log(JSON.parse(body));

  return { interaction: JSON.parse(body), isValid: true };
}

const server = {
  verifyDiscordRequest,
  fetch: router.fetch,
};

export default server;
