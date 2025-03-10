
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
