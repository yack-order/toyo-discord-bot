import { InteractionResponseType, InteractionResponseFlags } from 'discord-interactions';
import { JsonResponse } from '../jsonresponse.js';
import { commands } from '../commands.js';

export const HELP_COMMAND = {
  name: 'help',
  description: 'Displays information about all available commands.',
};

export function HELP_EXEC(request, env, interaction) {
  let helpContent = '## Available Commands:\n\n';

  // Iterate through all registered commands to build the help message
  for (const commandName in commands) {
    const command = commands[commandName];
    helpContent += `**/${command.definition.name}**\n`;
    helpContent += `  *Description*: ${command.definition.description}\n`;

    // If the command has options, list them
    if (command.definition.options && command.definition.options.length > 0) {
      helpContent += `  *Options*:\n`;
      for (const option of command.definition.options) {
        // Discord option types are numbers, so we might want to map them to readable strings if needed.
        // For now, displaying the number is acceptable.
        helpContent += `    - \`${option.name}\`: ${option.description} (Type: ${option.type}, Required: ${option.required ? 'Yes' : 'No'})\n`;
      }
    }
    helpContent += '\n';
  }

  helpContent += '## Notes:\n';
  helpContent += '- Commands are generally ephemeral by default, meaning only you see the response, unless specified otherwise (e.g., `show: true` option).\n';

  return new JsonResponse({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: { content: helpContent, flags: InteractionResponseFlags.EPHEMERAL }, // Keep help ephemeral
  });
}