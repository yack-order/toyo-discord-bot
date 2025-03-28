import axios from 'axios';
import { toUpperCaseEachWord, arrayToString, get_wayback_url } from './utilities.js';

/**
 * This asynchronous function retrieves and processes product data from a provided store URL.
 * It attempts to extract metadata such as tags, content IDs, and product attributes embedded 
 * within the page's HTML or retrieves the data from the Wayback Machine as a fallback.
 * 
 * @param {string} url - The URL of the product page to fetch and analyze.
 * @param {boolean} [wayback=false] - A flag to determine if the Wayback Machine should be used as a fallback.
 * @returns {Array|string} An array containing various product details (e.g., title, content IDs, price, etc.) 
 *                         or error messages in case of issues.
 */
export async function ReadStoreData(url, wayback = false) {
    try {
        // Fetch the HTML content from the provided URL
        const response = await axios.get(url);
        const html = response.data;

        // Locate the JSON data embedded in a <script> tag within the HTML
        const jsonMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
        if (!jsonMatch) {
            // If JSON data isn't found and Wayback Machine hasn't been tried yet, attempt to fetch from there
            if (!wayback) {
                return await ReadStoreData(await get_wayback_url(url), true);
            }
            return "Error: No JSON found";
        }

        // Parse the embedded JSON data
        const jsonData = JSON.parse(jsonMatch[1]);
        const product = jsonData.props.pageProps.product;

        // Attempt to retrieve the product's tags; fallback to Wayback if absent
        const tags = product.tags;
        if (!tags) {
            if (!wayback) {
                return await ReadStoreData(await get_wayback_url(url), true);
            }
            return "Error: No tags found";
        }

        // Initialize variables to store product metadata
        let read_by, accent, language, author, age_min, age_max, club_credits, credit_cost, copyright, media_type;
        let is_digital = false;
        let ids = [], content_types = [];

        // Process each tag to extract relevant product information
        for (const tag of tags) {
            if (tag.startsWith("read-by:")) read_by = tag.substring(8).trim();
            if (tag.startsWith("accent:")) accent = toUpperCaseEachWord(tag.substring(7).trim());
            if (tag.startsWith("language:")) language = toUpperCaseEachWord(tag.substring(9).trim());
            if (tag.startsWith("content-id:")) ids.push(tag.substring(11).trim());
            if (tag.startsWith("author:")) author = toUpperCaseEachWord(tag.substring(7).trim());
            if (tag.startsWith("age-min:")) age_min = tag.substring(8).trim();
            if (tag.startsWith("age-max:")) age_max = tag.substring(8).trim();
            if (tag.startsWith("club-credits:")) club_credits = tag.substring(13).trim();
            if (tag.startsWith("credit-cost:")) credit_cost = tag.substring(12).trim();
            if (tag.startsWith("copyright:")) copyright = tag.substring(10).trim();
            if (tag.startsWith("media:digital")) is_digital = true;
            if (tag.startsWith("content-type:")) content_types.push(tag.substring(13).trim());
            if (tag.startsWith("media:")) media_type = tag.substring(6).trim();
        }

        // Calculate the count of content IDs and convert arrays to strings
        const card_count = ids.length;
        ids = arrayToString(ids);
        content_types = arrayToString(content_types);

        // Retrieve additional product details from the JSON structure
        const age_Range = product.ageRange ? `${product.ageRange[0]} - ${product.ageRange[1]}` : age_min + " - " + age_max;
        const title = product.title ? product.title.trim() : "No title found";
        const price = product.price ? product.price.trim() : "Discontinued";
        const handle = product.handle ? product.handle.trim() : "No handle found";
        const description = product.description ? product.description.trim() : "No description found";
        const description_markdown = product.descriptionMarkdown ? product.descriptionMarkdown.trim() : "No descriptionMarkdown found";
        const art_url = product.images[0] ? product.images[0]?.url : "No images found";
        const is_bundle = product.isBundle || false;
        const geo = url.substring(8, 10).toUpperCase();

        const data = {
            Title: title, // Product title
            IDs: ids + "(" + card_count + " cards)", // Content IDs as a string
            URL: "[[art](" + art_url + ")] [geo: " + geo + "] <" + url + ">", // The original URL
            Content_Types: content_types, // Content types as a string
            Age_Range: age_Range, // Age range as a string
            Author: author, // Author name
            Read_By: read_by, // Narrator or reader
            Language: language + " (" + accent  + ")", // Language of the product
            Price: price + "(Club: " + club_credits + " credits)", // Product price
            Description: description_markdown, // Markdown version of the description
        };
        // Return an array of extracted product details
        return data;

    } catch (e) {
        // Handle unexpected errors by returning an error message
        console.error(e);
        return "Error: Waiting for URL...";
    }
}

