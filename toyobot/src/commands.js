import { AWWWW_COMMAND, AWWWW_EXEC } from './commands/awwww.js';
import { INVITE_COMMAND, INVITE_EXEC } from './commands/invite.js';
import { PING_COMMAND, PING_EXEC } from './commands/ping.js';
import { SERVER_COMMAND, SERVER_EXEC } from './commands/server.js';
import { USER_COMMAND, USER_EXEC } from './commands/user.js';
import { YOTO_PLAYLIST_COMMAND, YOTO_PLAYLIST_EXEC } from './commands/yoto-playlist.js';
import { YOTO_STORE_COMMAND, YOTO_STORE_EXEC } from './commands/yoto-store.js';
import { EXTRACT_AUDIO_COMMAND, EXTRACT_AUDIO_EXEC } from './commands/extract-audio.js';
import { EXTRACT_ICONS_COMMAND, EXTRACT_ICONS_EXEC } from './commands/extract-icons.js';
import { ARCHIVE_LOOKUP_COMMAND, ARCHIVE_LOOKUP_EXEC } from './commands/archive-lookup.js';
import { MYO_SEARCH_COMMAND, MYO_SEARCH_EXEC } from './commands/myo-search.js';
import { MYO_SUBMIT_COMMAND, MYO_SUBMIT_EXEC } from './commands/myo-submit.js';
import { HELP_COMMAND, HELP_EXEC } from './commands/help.js';
import { DEV_COMMAND, DEV_EXEC } from './commands/yoto-dev.js';

const commandMap = {
  [AWWWW_COMMAND.name]: { definition: AWWWW_COMMAND, handler: AWWWW_EXEC },
  [INVITE_COMMAND.name]: { definition: INVITE_COMMAND, handler: INVITE_EXEC },
  [PING_COMMAND.name]: { definition: PING_COMMAND, handler: PING_EXEC },
  [SERVER_COMMAND.name]: { definition: SERVER_COMMAND, handler: SERVER_EXEC },
  [USER_COMMAND.name]: { definition: USER_COMMAND, handler: USER_EXEC },
  [YOTO_PLAYLIST_COMMAND.name]: { definition: YOTO_PLAYLIST_COMMAND, handler: YOTO_PLAYLIST_EXEC },
  [YOTO_STORE_COMMAND.name]: { definition: YOTO_STORE_COMMAND, handler: YOTO_STORE_EXEC },
  [EXTRACT_AUDIO_COMMAND.name]: { definition: EXTRACT_AUDIO_COMMAND, handler: EXTRACT_AUDIO_EXEC },
  [EXTRACT_ICONS_COMMAND.name]: { definition: EXTRACT_ICONS_COMMAND, handler: EXTRACT_ICONS_EXEC },
  [ARCHIVE_LOOKUP_COMMAND.name]: { definition: ARCHIVE_LOOKUP_COMMAND, handler: ARCHIVE_LOOKUP_EXEC },
  [MYO_SEARCH_COMMAND.name]: { definition: MYO_SEARCH_COMMAND, handler: MYO_SEARCH_EXEC },
  [MYO_SUBMIT_COMMAND.name]: { definition: MYO_SUBMIT_COMMAND, handler: MYO_SUBMIT_EXEC },
  [HELP_COMMAND.name]: { definition: HELP_COMMAND, handler: HELP_EXEC },
  [DEV_COMMAND.name]: { definition: DEV_COMMAND, handler: DEV_EXEC },
};

export const commands = commandMap;

export const allCommandDefs = Object.values(commandMap).map(c => c.definition);