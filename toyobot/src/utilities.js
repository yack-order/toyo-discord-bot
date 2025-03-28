import axios from 'axios';

/**
 * Given a URL, return the latest copy of that URL in the Wayback machine.
 * 
 * @param {string} url - The URL to find in the Wayback Machine.
 * @returns {string} - The constructed URL to the latest snapshot without the banner.
 * @throws {Error} - Throws an error if no URL is provided or no snapshot is available.
 */
export async function get_wayback_url(url) {
    if (!url) {
        throw new Error("No URL provided");
    }

    const response = await axios.get(`http://archive.org/wayback/available?url=${url}`);
    const metadata = response.data;

    const closest = metadata?.archived_snapshots?.closest;
    if (!closest) {
        return `No snapshot for ${url}`;
    }

    return closest.url;
}

/**
 * Converts the first letter of each word in the input string to uppercase.
 * 
 * @param {string} str - The input string to be transformed.
 * @returns {string} - The transformed string with each word's first letter in uppercase.
 */
export function toUpperCaseEachWord(str) {
    return str.split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
}

/**
 * Converts an array of strings into a single string with each element separated by "; ".
 * 
 * @param {Array} arr - The array of strings to be converted.
 * @returns {string} - The resulting concatenated string.
 */
export function arrayToString(arr) {
    return arr ? arr.map(item => item.trim()).join("; ") : "";
}

/**
 * Converts the data object into a Markdown-formatted string.
 * 
 * @param {Object} data - The data object to format.
 * @returns {string} - The Markdown-formatted string.
 */
export function formatDataAsMarkdown(data) {
    if (typeof data !== 'object' || data === null) {
        return "Invalid data or no data to display.";
    }

    let markdown = "";
    for (const [key, value] of Object.entries(data)) {
        // Replace underscores with spaces in the key name
        const formattedKey = key.replace(/_/g, ' ');
        markdown += `**${formattedKey}:** ${value ?? "N/A"}\n`;
    }

    // Truncate the message if it exceeds 1950 characters
    if (markdown.length > 1950) {
        markdown = markdown.substring(0, 1922) + "\n **ERROR**: Text too long."; // Add ellipsis to indicate truncation
    }

    return markdown;
}