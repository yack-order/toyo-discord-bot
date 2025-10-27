import { AWWWW_COMMAND } from './commands/awwww.js';
import { PING_COMMAND } from './commands/ping.js';
import {
  INVITE_COMMAND,
  SERVER_COMMAND,
  USER_COMMAND,
  DEV_COMMAND,
  YOTO_STORE_COMMAND,
  EXTRACT_AUDIO_COMMAND,
  YOTO_PLAYLIST_COMMAND,
  EXTRACT_ICONS_COMMAND,
  ARCHIVE_LOOKUP_COMMAND,
  MYO_SEARCH_COMMAND,
  MYO_SUBMIT_COMMAND
 } from './commands.js';
import dotenv from 'dotenv';
import process from 'node:process';

/**
 * This file is meant to be run from the command line, and is not used by the
 * application server.  It's allowed to use node.js primitives, and only needs
 * to be run once.
 */

dotenv.config({ path: '.dev.vars' });

const token = process.env.DISCORD_TOKEN;
const applicationId = process.env.DISCORD_APPLICATION_ID;

if (!token) {
  throw new Error('The DISCORD_TOKEN environment variable is required.');
}
if (!applicationId) {
  throw new Error(
    'The DISCORD_APPLICATION_ID environment variable is required.',
  );
}

/**
 * Register all commands globally.  This can take o(minutes), so wait until
 * you're sure these are the commands you want.
 */
const url = `https://discord.com/api/applications/${applicationId}/commands`;

const allCommands = [
  AWWWW_COMMAND,
  PING_COMMAND,
  INVITE_COMMAND,
  SERVER_COMMAND,
  USER_COMMAND,
  DEV_COMMAND,
  YOTO_STORE_COMMAND,
  YOTO_PLAYLIST_COMMAND,
  EXTRACT_AUDIO_COMMAND,
  EXTRACT_ICONS_COMMAND,
  ARCHIVE_LOOKUP_COMMAND,
  MYO_SEARCH_COMMAND,
  MYO_SUBMIT_COMMAND
];

const reg_command = JSON.stringify(allCommands)

const del_command = JSON.stringify([]);

async function send(command, note){
  console.log(`${note} all existing commands...`);

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bot ${token}`,
    },
    method: 'PUT',
    body: command,
  });

  if (response.ok) {
    console.log(`${note} all commands`);
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } else {
    console.error(`Error with ${note} commands`);
    let errorText = `Error ${note} commands 
 ${response.url}: ${response.status} ${response.statusText}`;
    try {
      const error = await response.text();
      if (error) {
        errorText = `${errorText} 

 ${error}`;
      }
    } catch (err) {
      console.error('Error reading body from request:', err);
    }
    console.error(errorText);
  }
  console.log(`${note} task finished.`);
}

//await send(del_command, "Deleting");
await send(reg_command, "Registering");