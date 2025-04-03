import axios from 'axios';
import { get_wayback_url } from './utilities.js';

/**
 * Fetches and parses playlist data from the provided URL.
 * 
 * @param {string} url - The URL to fetch the playlist data from.
 * @returns {Object} - An object containing all the extracted playlist data.
 */
export async function ReadPlaylistMetadata(url) {
    try {
        // Fetch the content from the provided URL
        const response = await axios.get(url);
        const contentType = response.headers['content-type'];

        let card = response.data?.card;
        //let card = jsonData.card;
        //console.log(card);

        // Extract data
        const data = {
            Title: "[" + card.title + "](" + card.metadata.cover.imageL + ") ",
            Author: card.metadata.author || "-",
            Category: card.metadata?.category || "-",
            Officiality: getOfficiality(url, card),
            Is_MYO_Card: getIsMYOCard(card),
            Created_At: card.createdAt || "-",
            Updated_At: card.updatedAt || "-",
            //Tracks: extractTracks(card),
            File_Size: formatFileSize(card.metadata?.media?.fileSize),
            Duration: formatDuration(card.metadata?.media?.duration),
            Share_Link_Created_At: card.sharing?.shareLinkCreatedAt || "-",
            Share_Count: card.sharing?.shareCount || "-",
            Share_Limit: card.sharing?.shareLimit || "-",
            Description: card?.metadata?.description || "-",
        };

        return data;
    } catch (e) {
        return { error: e.message || "Error fetching data" };
    }
}

export async function GetTrackURLs(url){
    try {
        // Fetch the content from the provided URL
        const response = await axios.get(url);
        const contentType = response.headers['content-type'];

        let card = response.data?.card;
        return extractTracksWithIndex(card);
    } catch (e) {
        return { error: e.message || "Error fetching data" };
    }
}

export async function GetIconURLs(url){
    try{
        // Fetch the content from the provided URL
        const response = await axios.get(url);
        const contentType = response.headers['content-type'];

        let card = response.data?.card;
        return extractIcons(card);
    } catch (e) {
        return { error: e.message || "Error fetching data" };
    }
}

function extractIcons(card) {
    const data = []; // Declare the data array
    //"props.pageProps.card.content.chapters[0].display.icon16x16"
    const chapters = card.content?.chapters || [];
    chapters.forEach((chapter, chapterIndex) => {
        const chapterDisplayInfo = chapter.display; // Get the icon for the chapter
        if (chapterDisplayInfo) {
            chapter.tracks?.forEach((track, trackIndex) => {
                const trackDisplayInfo = track.display; // Look for an icon for the track
                const iconUrl = trackDisplayInfo?.icon16x16 || chapterDisplayInfo.icon16x16; // Fallback to chapter icon
                // Push the formatted entry into the data collection
                data.push(`${chapterIndex}-${trackIndex}: <${track.trackUrl}>`);
            }); // Close forEach
        }
    });
    return data; // Return the data array
}

/**
 * Extracts track URLs from the card data and formats them as index: url.
 * 
 * @param {Object} card - The card object containing track data.
 * @returns {Array} - An array of formatted track entries (index: url).
 */
function extractTracksWithIndex(card) {
    const data = [];
    const chapters = card.content?.chapters || [];

    chapters.forEach((chapter, chapterIndex) => {
        chapter.tracks?.forEach((track, trackIndex) => {
            if (track.trackUrl) {
                // Push the formatted entry into the data collection
                data.push(`${chapterIndex}-${trackIndex}: [get](${track.trackUrl})`);
            }
        });
    });

    return data.length > 0 ? data : ["No track URLs found"];
}

/**
 * Extracts track URLs from the card data.
 */
function extractTracks(card) {
    const trackUrls = [];
    const chapters = card.content?.chapters || [];
    chapters.forEach(chapter => {
        chapter.tracks?.forEach(track => {
            if (track.trackUrl) {
                trackUrls.push(track.trackUrl);
            }
        });
    });
    return trackUrls.length > 0 ? trackUrls : "No track URLs found";
}

/**
 * Gets the song extension from the first track.
 */
async function getSongExtension(card) {
    try {
        const trackUrl = card.content?.chapters[0]?.tracks[0]?.trackUrl;
        if (!trackUrl) {
            return "No track URL found";
        }

        const response = await axios.head(trackUrl);
        const contentType = response.headers['content-type'];

        return getExtensionFromContentType(contentType) || "No extension found";
    } catch {
        return "Error fetching song extension";
    }
}

/**
 * Maps content type to file extension.
 */
function getExtensionFromContentType(contentType) {
    const mapping = {
        'audio/mpeg': 'mp3',
        'audio/aac': 'aac',
        'audio/wav': 'wav',
        'audio/ogg': 'ogg',
        'audio/mp4': 'm4a',
        'audio/flac': 'flac',
        'audio/x-m4a': 'm4a',
    };
    return mapping[contentType] || null;
}

/**
 * Formats file size in bytes to MB.
 */
function formatFileSize(fileSizeInBytes) {
    if (!fileSizeInBytes) return "0 MB";
    return (fileSizeInBytes / (1024 * 1024)).toFixed(2) + " MB";
}

/**
 * Formats duration in seconds to HH:MM:SS or MM:SS.
 */
function formatDuration(durationInSeconds) {
    if (!durationInSeconds) return "Not found";
    const hours = Math.floor(durationInSeconds / 3600);
    const minutes = Math.floor((durationInSeconds % 3600) / 60);
    const seconds = durationInSeconds % 60;
    return hours > 0
        ? `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
        : `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Extracts club availability from the card data.
 */
function extractClubAvailability(card) {
    const clubAvailability = card.clubAvailability || [];
    return clubAvailability.length > 0
        ? clubAvailability.map(store => store.store.toUpperCase()).join(', ')
        : "Unknown";
}

/**
 * Extracts card type from the card data.
 */
function extractCardType(card) {
    const tracks = card.content?.chapters[0]?.tracks;
    return tracks && tracks.length > 0 ? tracks[0].type : "No tracks found";
}

/**
 * Extracts ambient data from the card.
 */
function extractAmbient(card) {
    const ambient = card.content?.chapters[0]?.tracks[0]?.ambient || {};
    return Object.keys(ambient).length > 0
        ? Object.keys(ambient).map(key => key.toUpperCase()).join(', ')
        : "No";
}


/**
 * Determines if a card is an MYO (Make Your Own) card based on the JSON data.
 * 
 * @param {Object} jsonData - The parsed JSON data of the card.
 * @returns {boolean|string} - Returns `true` if the card is an MYO card, `false` otherwise, or an error message.
 */
function getIsMYOCard(card) {
    try {
        // Safely access the creator email and user ID using optional chaining
        const email = card?.creatorEmail || "Not found";
        const user = card?.userId || null;

        // Determine if the card is an MYO card
        if (email !== "Not found" && user !== "yoto") {
            return true;
        } else {
            return false;
        }
    } catch (e) {
        console.error("Error determining if card is MYO:", e);
        return "Waiting for URL...";
    }
}

/**
 * Determines the officiality of a card based on the URL and JSON data.
 * 
 * @param {string} url - The URL of the card.
 * @param {Object} jsonData - The parsed JSON data of the card.
 * @returns {string} - The officiality of the card (e.g., "Yoto", "MYO", "Demo", "Free", or "unknown card type").
 */
function getOfficiality(url, card) {
    try {
        // Check if the URL contains "?84", indicating a physical card
        if (url.includes("?84")) {
            return "Yoto";
        }

        // Check if the card has a creator email, indicating an MYO card
        const email = card?.creatorEmail || null;
        if (email) {
            return "MYO"; // Could also be a Yoto Space
        }

        // Check if the description indicates a demo card
        const description = card?.metadata?.description || null;
        const discoverRegex = /(Discover(?!: The full card| ten| fascinating| the science)|(: A preview)|(: The first)|(: Prologue)|(Chapter 1)|(Chapter one)|[0-9]+ track[s]? Full Card: [0-9]+ tracks. Available: Until)/g;
        if (description && discoverRegex.test(description)) {
            return "Demo";
        }

        // Check if the card availability is "free"
        const cardAvailability = card?.availability || null;
        if (cardAvailability === "free") {
            return "Free";
        }

        // Check if the user ID indicates an official or MYO card
        const userId = card?.userId || null;
        if (userId === "yoto") {
            return "Yoto";
        }
        if (userId && userId.startsWith("auth0")) {
            return "MYO"; // Could also be a Yoto Space
        }

        // Check if the card has a category, indicating an official or Yoto Space card
        const category = card?.category || null;
        if (category) {
            return "Yoto";
        }

        // Check if the card has club availability, indicating a Yoto digital or club card
        const clubAvailability = card?.clubAvailability || null;
        if (clubAvailability) {
            return "Yoto";
        }

        // Check if the card has streams, indicating a free card
        const hasStreams = card?.metadata?.media?.hasStreams || false;
        if (hasStreams) {
            return "Free";
        }

        // Default to "unknown card type" if no conditions are met
        return "unknown card type";
    } catch (e) {
        console.error("Error determining officiality:", e);
        return "Waiting for URL...";
    }
}