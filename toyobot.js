/*

To create a Discord bot command to query a Google Spreadsheet, you'll need to use the Discord API along with the Google Sheets API. Below is an example of how you can implement the command using Node.js, with the discord.js library and the googleapis library:

# Prerequisites
1. Google Cloud Setup:
    * Go to the Google Cloud Console.
    * Create a new project and enable the Google Sheets API.
    * Create a Service Account, download the JSON key file, and share the spreadsheet with the service account's email.
2. Discord Bot Setup:
    * Create a bot in the Discord Developer Portal.
    * Invite the bot to your server with the appropriate permissions.
3. Install Required Libraries:
    *Use npm to install the libraries:
    ```bash
    npm install discord.js googleapis
    ```

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
5 Spreadsheet ID:
    * Replace the placeholder YOUR_DISCORD_USERS_SPREADSHEET_ID with the actual ID of your Google Sheet.
6. Customization:
    * You can extend the commands to include additional metadata, such as a description for the URL or a timestamp.
    * You can modify the headers array to match the actual column headers in your spreadsheet.

# How It Works
1. Command: `archive-application-status`
    * The spreadsheet query function uses the `message.author.id` (Discord user ID) to find matching data in the spreadsheet.
    * Assumes the spreadsheet has Discord user IDs in column `A` and application statuses in column `B`. Update the `range` and index logic if your structure is different.
    * Gracefully handles cases where the user ID does not exist in the spreadsheet or when the spreadsheet is empty.
    * Example Spreadsheet Structure:
        | Column A (Discord ID) | Column B (Application Status) |
        | --- | --- |
        | 123456789012 | Submitted |
        | 987654321098 | Approved |
    * The bot sends a read-only request to the specified range in the Google Spreadsheet.
    * The bot formats the retrieved data and sends it back to the Discord channel as a reply.
2. Command: `link-email`
    * When a user types `link-email user@example.com`, the bot stores the provided email and the user’s Discord ID in the `Discord_Users` spreadsheet.
    * Uses the `spreadsheets.values.append` method from the Google Sheets API to insert new rows into the sheet.
    * Ensures the provided email contains an "@" symbol to check for validity. You can add more complex validation logic if needed.
    * Stores the Discord user ID in column `A` and the email address in column `B` of the `Discord_Users` spreadsheet.
    * Replies to the Discord channel with success or error messages based on the outcome.
    * Example Spreadsheet Structure (Discord_Users):
        | Column A (Discord ID) | Column B (Email) |
        | --- | --- |
        | 123456789012 | user1@example.com |
        | 987654321098 | user2@example.com |
    * Handles errors such as invalid email input or issues connecting to the Google Sheets API.
3. Command: `submit-card`
    * Users can type `submit-card https://example.com` to submit a URL for storage in the `links_from_discord` spreadsheet.
    * Uses spreadsheets.values.append from the Google Sheets API to insert new rows into the sheet.
    * Stores the Discord user ID in column A and the submitted URL in column B of the `links_from_discord` spreadsheet.
    * Ensures the provided URL starts with "http" to confirm it's valid. You can extend this logic for more robust validation if needed.
    * Provides feedback to the user, confirming whether the URL was successfully submitted or if an error occurred.
    * Example Spreadsheet Structure (links_from_discord):
        | Column A (Discord ID) | Column B (URL) |
        | --- | --- |
        | 123456789012 | https://example.com |
        | 987654321098 | https://anotherlink.com |
    * Handles errors related to URL submission or connectivity issues with the Google Sheets API.
4. Command: `check-card`
    * Returns information about the card if the identifier is known.
    * Exact ID Match: Users can type `check-card hMkni ` to submit an identifier to search for.
        * If a 5-character identifier is provided, the bot performs an **exact, case-sensitive match** in column `A`.
        * Returns an error if multiple entries are found with the same ID. This is a data integrity problem that needs to be solved by an administrator.
    * Non-Case-Sensitive Title Search: Users can type `check-card Make Your Own Guide` to submit a title to search for.
        * If the search term is a string (not a 5-character ID), the bot performs a **non-case-sensitive match** in column `C`.
        * Provides a list of matching IDs if multiple results are found, prompting the user to search by ID for detailed information.
    * Example Spreadsheet Structure (Card_DB):
        | Column A (ID) | Column B (url) | Column C (Title) | Column D | ... | Column R |
        | --- | --- | --- | --- | --- |
        | ABC12 | https://link | MyCardTitle | Data1 | ... | Data2 |
        | DEF34 | https://link2 | AnotherTitle | Data3 | ...  | DataM |
    * Ensures only one match is returned for ID-based searches.
    * Handles cases where no matches are found.
    * Returns data in the format of header: data for columns A, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, and R.


*/
const { Client, GatewayIntentBits } = require('discord.js');
const { google } = require('googleapis');
const fs = require('fs');

// Load Discord bot token from environment or config
const DISCORD_TOKEN = 'YOUR_DISCORD_BOT_TOKEN'; // Replace with your bot token

// Load Google Sheets credentials
const GOOGLE_SHEETS_CREDENTIALS = './credentials.json'; // Path to the JSON key file
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID'; // Replace with your Google Spreadsheet ID

// Initialize the Discord client
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

// Authenticate with Google Sheets API
const auth = new google.auth.GoogleAuth({
    keyFile: GOOGLE_SHEETS_CREDENTIALS,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});
const sheets = google.sheets({ version: 'v4', auth });

// Function to query the spreadsheet using the Discord user ID
async function querySpreadsheetByUserId(userId) {
    try {
        const range = 'Sheet1!A2:B'; // Adjust the range based on your spreadsheet structure
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: range,
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            return `No data found for user ID: ${userId}`;
        }

        // Find the row corresponding to the Discord user ID
        const userData = rows.find(row => row[0] === userId); // Assuming user IDs are in column A
        if (!userData) {
            return `No application status found for user ID: ${userId}`;
        }

        // Return the relevant data for the user
        return `Application Status for User ID ${userId}: ${userData[1]}`; // Assuming status is in column B
    } catch (error) {
        console.error('Error querying spreadsheet:', error);
        return 'There was an error querying the spreadsheet.';
    }
}

// Function to store email and Discord user ID in the Google Sheet
async function storeEmailAndDiscordId(email, discordId) {
    try {
        const range = 'Sheet1!A:B'; // Assuming data is stored in columns A (Discord ID) and B (Email)
        const values = [[discordId, email]]; // Data to append

        const request = {
            spreadsheetId: SPREADSHEET_ID,
            range: range,
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            resource: {
                values: values,
            },
        };

        // Append the data to the Google Sheet
        await sheets.spreadsheets.values.append(request);
        return `Successfully linked email: ${email} with Discord ID: ${discordId}`;
    } catch (error) {
        console.error('Error storing email and Discord ID:', error);
        return 'There was an error storing the email and Discord ID.';
    }
}

// Function to store URL and Discord user ID in the Google Sheet
async function storeLink(url, discordId) {
    try {
        const range = 'Sheet1!A:B'; // Assuming data is stored in columns A (Discord ID) and B (URL)
        const values = [[discordId, url]]; // Data to append

        const request = {
            spreadsheetId: LINKS_SPREADSHEET_ID,
            range: range,
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            resource: {
                values: values,
            },
        };

        // Append the data to the Google Sheet
        await sheets.spreadsheets.values.append(request);
        return `Successfully submitted the URL: ${url}`;
    } catch (error) {
        console.error('Error storing URL and Discord ID:', error);
        return 'There was an error submitting the URL.';
    }
}

// Function to query the spreadsheet for a 5-character identifier or a string in the title
async function checkCard(searchTerm) {
    try {
        // Define the range of data in the spreadsheet (e.g., Sheet1!A:R for columns A to R)
        const range = 'Sheet1!A:R';
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: CARD_DB_SPREADSHEET_ID,
            range: range,
        });

        const rows = response.data.values;

        if (!rows || rows.length === 0) {
            return 'No data found in the Card_DB.';
        }

        // Check if the input is a 5-character identifier
        if (searchTerm.length === 5 && /^[A-Za-z0-9]+$/.test(searchTerm)) {
            // Perform an exact, case-sensitive match on column A
            const matchingRow = rows.find(row => row[0] === searchTerm); // Column A is index 0
            if (!matchingRow) {
                return `No card found with ID: ${searchTerm}`;
            }

            // Ensure there is only one match
            const matches = rows.filter(row => row[0] === searchTerm);
            if (matches.length > 1) {
                return `Error: Multiple entries found for ID: ${searchTerm}. Please check the database for duplicates.`;
            }

            // Format and return the data
            const headers = ['ID', 'Title', 'Field C', 'Field D', 'Field E', 'Field F', 'Field G', 'Field H', 'Field I', 'Field J',
                'Field K', 'Field L', 'Field M', 'Field N', 'Field O', 'Field P', 'Field Q', 'Field R'];
            const data = matchingRow.slice(0, 18); // Extract columns A to R
            return headers.map((header, index) => `${header}: ${data[index] || 'N/A'}`).join('\n');
        } else {
            // Perform a non-case-sensitive search in column C (index 2)
            const matchingRows = rows.filter(row => row[2] && row[2].toLowerCase().includes(searchTerm.toLowerCase())); // Column C is index 2

            if (matchingRows.length === 0) {
                return `No cards found with the title containing: "${searchTerm}"`;
            }

            // If there are multiple matches, provide a list of IDs and prompt for ID-based search
            if (matchingRows.length > 1) {
                const matchingIds = matchingRows.map(row => row[0]); // Collect matching IDs from column A
                return `Multiple cards found with the title containing "${searchTerm}". Matching IDs:\n${matchingIds.join(', ')}\nPlease search for one of these IDs to get detailed information.`;
            }

            // If there's exactly one match, return its data
            const matchingRow = matchingRows[0];
            const headers = ['ID', 'Title', 'Field C', 'Field D', 'Field E', 'Field F', 'Field G', 'Field H', 'Field I', 'Field J',
                'Field K', 'Field L', 'Field M', 'Field N', 'Field O', 'Field P', 'Field Q', 'Field R'];
            const data = matchingRow.slice(0, 18); // Extract columns A to R
            return headers.map((header, index) => `${header}: ${data[index] || 'N/A'}`).join('\n');
        }
    } catch (error) {
        console.error('Error checking card:', error);
        return 'There was an error checking the card.';
    }
}

// Handle messages
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // Command: archive-application-status
    if (message.content.startsWith('archive-application-status')) {
        const userId = message.author.id; // Use Discord user ID for the query
        const result = await querySpreadsheetByUserId(userId);
        message.reply(result);
    }

    // Command: link-email
    if (message.content.startsWith('link-email')) {
        const args = message.content.split(' ');
        const email = args[1]; // Get the email address from the command arguments

        if (!email || !email.includes('@')) {
            message.reply('Please provide a valid email address. Example: `link-email user@example.com`');
            return;
        }

        // Store the email and Discord ID in the Google Sheet
        const result = await storeEmailAndDiscordId(email, message.author.id);
        message.reply(result);
    }

    // Command: submit-card
    if (message.content.startsWith('submit-card')) {
        const args = message.content.split(' ');
        const url = args[1]; // Get the URL from the command arguments

        if (!url || !url.startsWith('http')) {
            message.reply('Please provide a valid URL. Example: `submit-card https://example.com`');
            return;
        }

        // Store the URL and Discord ID in the Google Sheet
        const result = await storeLink(url, message.author.id);
        message.reply(result);

    // Command: check-card
    if (message.content.startsWith('check-card')) {
        const args = message.content.split(' ');
        const searchTerm = args[1]; // Get the search term from the command arguments

        if (!searchTerm) {
            message.reply('Please provide a search term. Example: `check-card ABC12` or `check-card MyCardTitle`');
            return;
        }

        // Query the spreadsheet for the search term
        const result = await checkCard(searchTerm);
        message.reply(result);
    }
});

// Handle Discord bot ready event
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

// Log in to Discord
client.login(DISCORD_TOKEN);
