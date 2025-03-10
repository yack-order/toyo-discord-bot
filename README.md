# toyo-discord-bot
 Bot for the TOYO Discord with customized commands.

# Prerequisites
To create a Discord bot command to query a Google Spreadsheet, you'll need to use the Discord API along with the Google Sheets API. Below is an example of how you can implement the command using Node.js, with the discord.js library and the googleapis library:
1. Google Cloud Setup:
    * Go to the Google Cloud Console.
    * Create a new project and enable the Google Sheets API.
    * Create a Service Account, download the JSON key file, and share the spreadsheet with the service account's email.
2. Discord Bot Setup:
    * Create a bot in the Discord Developer Portal.
    * Invite the bot to your server with the appropriate permissions.
3. Install Required Libraries:
    * Use npm to install the libraries:
    ```bash
    npm install discord.js googleapis
    ```

# Installation
To configure Discord to pull the latest code for a bot from GitHub, you can set up a deployment pipeline or use GitHub Actions to automate the process. Here's a step-by-step guide.
1. Set Up a GitHub Repository
    * Ensure your bot's code is hosted in a GitHub repository.
    * Commit and push all your bot's files to the repository.
2. Host Your Bot
    * Choose a hosting platform for your bot, such as:
        * VPS/Server: Use a service like AWS, DigitalOcean, or Linode.
        * Cloud Platforms: Use Heroku, Render, or Replit.
        * Local Machine: If you're running the bot locally, ensure it's always online using tools like PM2 or a task scheduler.
3. Set Up GitHub Webhooks
    * Webhooks allow GitHub to notify your hosting environment whenever new code is pushed.
        1. Go to your GitHub repository.
        2. Navigate to Settings > Webhooks > Add Webhook.
        3. Enter the Payload URL of your hosting environment (e.g., a script or endpoint that pulls the latest code).
        4. Set the Content Type to application/json.
        5. Choose the events you want to trigger the webhook (e.g., push events).
        6. Save the webhook.
4. Write a Pull Script
    * Create a script on your hosting environment to pull the latest code from GitHub. For example:
    ```bash
    #!/bin/bash
    cd /path/to/your/bot
    git pull origin main
    npm install # Install dependencies if needed
    pm2 restart bot # Restart the bot (if using PM2)
    ```
    * Ensure this script is triggered by the webhook.
5. Use GitHub Actions (Optional)
* GitHub Actions can automate deployment when code is pushed to the repository.
    1.  Create a .github/workflows/deploy.yml file in your repository.
    2. Add the following example workflow:
    ```yaml
    name: Deploy Bot

    on:
    push:
        branches:
        - main

    jobs:
    deploy:
        runs-on: ubuntu-latest

        steps:
        - name: Checkout code
        uses: actions/checkout@v2

        - name: Deploy to server
        run: |
            ssh user@your-server "cd /path/to/your/bot && git pull origin main && npm install && pm2 restart bot"
    ```
* Replace user@your-server and /path/to/your/bot with your server's details.

6. Test the Setup
* Push a change to your GitHub repository.
* Verify that the bot pulls the latest code and restarts automatically.

7. Configuration Notes:
* Security: Use SSH keys for secure access to your server.
* Error Handling: Add logging to your scripts to debug any issues.
* Always Online: Use a process manager like PM2 to keep your bot running.

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