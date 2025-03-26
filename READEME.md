# toyo-discord-bot
Bot for the TOYO Discord with customized commands.

# Development Notes
* Write the code in the `/src` folder. Helper functions can be included as their own `.js` files but will then need to be marked with `export` and then `import <name> from './file.js'` wherever they are going to be used. 
* `server.js` is the main bundle of code that is used by the server. This is what is hosted in cloudflare.
* **DEV** Use `npm ngrok` to host the code locally. If doing this, the [Discord Application](https://discord.com/developers/applications/1354448393304408195/information) will need to be updated for where it points. Get the ngrok url and paste it in the `Interactions Endpoint URL` field.
* **PROD** Use `npm run deploy` to push the updated code to Wrangler/cloudflare
* **SECRETS** Secrets/constants can be pushed into cloudflare 
    * push directly from the dev command line like this `npx wrangler secret put NAME_OF_VARIABLE`, or
    * use the webui at cloudflare to create Secrets
    * To Use: hen import them into the code using `const token = process.env.NAME_OF_VARIABLE;` within the javascript file.
* TODO: figure out how to do the wrangler deploy from github actions
* [cloudflare guide](https://developers.cloudflare.com/workers/get-started/quickstarts/) to create the worker, then follow [This Guide](https://github.com/discord/cloudflare-sample-app) to set up a sample app. For the most part I just copied content out of the sample app into the new worker i created. Its janky, but it worked. shut up.

---

---

# Notes
1. Rate Limits:
    * Ensure your bot handles API rate limits gracefully to avoid being throttled by either Discord or Google.
2. Security:
    * Do not hardcode sensitive tokens (Discord bot token or Google credentials) in your code. Use environment variables or a secure configuration file.
3. Error Handling:
    * The bot includes basic error handling but can be expanded to cover specific issues like invalid ranges or insufficient permissions.
4. Permissions:
    * Ensure the Service Account used for the Google Sheets API has "Editor" permissions for the spreadsheet.
    * Ensure the Service Account used for the Google Sheets API has "Editor" permissions for the `links_from_discord` spreadsheet.
    * Ensure the Service Account has "Reader" access to the `Card_DB` spreadsheet.
    * Ensure the Google Sheets API service account has "Editor" access to the `points_fetch_log` spreadsheet.
5. Spreadsheet ID:
    * Replace the placeholder YOUR_DISCORD_USERS_SPREADSHEET_ID with the actual ID of your Google Sheet.
6. Customization:
    * You can extend the commands to include additional metadata, such as a description for the URL or a timestamp.
    * You can modify the headers array to match the actual column headers in your spreadsheet.

# How It Works
1. Command: `archive-application-status`
    * The spreadsheet query function uses the `message.author.id` (Discord user ID) to find matching data in the spreadsheet.
    * Assumes the spreadsheet has Discord user IDs in column `A` and application statuses in column `B`. Update the `range` and index logic if your structure is different.
    * Gracefully handles cases where the user ID does not exist in the spreadsheet or when the spreadsheet is empty.
    * The bot sends a read-only request to the specified range in the Google Spreadsheet.
    * The bot formats the retrieved data and sends it back to the Discord channel as a reply.
2. Command: `link-email`
    * When a user types `link-email user@example.com`, the bot stores the provided email and the user’s Discord ID in the `Discord_Users` spreadsheet.
    * Uses the `spreadsheets.values.append` method from the Google Sheets API to insert new rows into the sheet.
    * Ensures the provided email contains an "@" symbol to check for validity. You can add more complex validation logic if needed.
    * Stores the Discord user ID in column `A` and the email address in column `B` of the `Discord_Users` spreadsheet.
    * Replies to the Discord channel with success or error messages based on the outcome.
    * Handles errors such as invalid email input or issues connecting to the Google Sheets API.
3. Command: `submit-card`
    * Users can type `submit-card https://example.com` to submit a URL for storage in the `links_from_discord` spreadsheet.
    * Uses spreadsheets.values.append from the Google Sheets API to insert new rows into the sheet.
    * Stores the Discord user ID in column A and the submitted URL in column B of the `links_from_discord` spreadsheet.
    * Ensures the provided URL starts with "http" to confirm it's valid. You can extend this logic for more robust validation if needed.
    * Provides feedback to the user, confirming whether the URL was successfully submitted or if an error occurred.
    * Handles errors related to URL submission or connectivity issues with the Google Sheets API.
4. Command: `check-card`
    * Returns information about the card if the identifier is known.
    * Exact ID Match: Users can type `check-card hMkni ` to submit an identifier to search for.
        * If a 5-character identifier is provided, the bot performs an **exact, case-sensitive match** in column `A`.
        * Returns an error if multiple entries are found with the same ID. This is a data integrity problem that needs to be solved by an administrator.
    * Non-Case-Sensitive Title Search: Users can type `check-card Make Your Own Guide` to submit a title to search for.
        * If the search term is a string (not a 5-character ID), the bot performs a **non-case-sensitive match** in column `C`.
        * Provides a list of matching IDs if multiple results are found, prompting the user to search by ID for detailed information.
    * Ensures only one match is returned for ID-based searches.
    * Handles cases where no matches are found.
    * Returns data in the format of `header: data` for columns A, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, and R.
5. Command: `fetch-points`
    * When the user types `fetch-points`, the bot retrieves the message author's Discord ID and username.
    * Uses the Google Sheets API to search the spreadsheet for the Discord ID in column `A`.
    * Retrieves the points from column `K` (10th index in the array).
    * Formats the Mee6 command `/give-item member:discordID item:Yak Point amount:X` using the retrieved points.
    * Logs the execution (add logic to send the command to the bot in Discord if necessary).
    * Appends a log entry to the points_fetch_log spreadsheet, recording the username, Discord ID, and points awarded.
    * Handles cases where the Discord ID doesn't exist or points are invalid (not a number).
    * Spreadsheet Structures: Points Spreadsheet, Points Fetch Log
    * The Mee6 command must be executed in a Discord channel where Mee6 is active. You can use the Discord API to send the command to the appropriate channel programmatically.
    * Includes error handling for invalid Discord IDs, invalid points values, and connectivity issues with the Google Sheets API.

# Example Spreadsheet Structure

## Application_Status

| Column A (Discord ID) | Column B (Application Status) |
| --- | --- |
| 123456789012 | Submitted |
| 987654321098 | Approved |

## Discord_Users
| Column A (Discord ID) | Column B (Email) |
| --- | --- |
| 123456789012 | user1@example.com |
| 987654321098 | user2@example.com |

## links_from_discord
| Column A (Discord ID) | Column B (URL) |
| --- | --- |
| 123456789012 | https://example.com |
| 987654321098 | https://anotherlink.com |

## Card_DB
| Column A (ID) | Column B (url) | Column C (Title) | Column D | ... | Column R |
| --- | --- | --- | --- | --- |
| ABC12 | https://link | MyCardTitle | Data1 | ... | Data2 |
| DEF34 | https://link2 | AnotherTitle | Data3 | ...  | DataM |

## points_db
| Column A (Discord ID) | Column B (Points Available) |
| --- | --- |
| 123456789012 | 10 |
| 987654321098 | 0 |

## points_log
| Column A (Discord ID) | Column B (Points Given) | Column C (Action Date) |
| --- | --- | --- | 
| 123456789012 | 5 | Mar 10 2025 | 
| 987654321098 | 23 | Jan 1 2025 |