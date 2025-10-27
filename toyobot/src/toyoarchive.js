import { google } from 'googleapis';

/**
 * Reads metadata for a given ID from a single merged Google Sheet, and returns
 * an object with keys as column headers and values as cell values.
 * @param {string} id - The ID to look up (searched in column A).
 * @param {string} sheetUrl - Google Sheet URL for the merged database.
 * @param {string} apiKey - Google Sheets API key.
 * @returns {Promise<Object>} - Metadata object with a markdown property.
 */
export async function ReadArchiveMetadata(id, sheetUrl, apiKey) {
  // Helper to extract spreadsheetId from a Google Sheets URL
  function extractSpreadsheetId(url) {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  }

  // Fetch the row by ID from the merged Google Sheet using API key
  const spreadsheetId = extractSpreadsheetId(sheetUrl);
  if (!spreadsheetId) return {};

  // Fetch the first sheet's name
  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?key=${apiKey}`
  );
  const meta = await metaRes.json();
  const sheetName = meta.sheets?.[0]?.properties?.title;
  if (!sheetName) return {};

  // Fetch all rows from the first sheet
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}?key=${apiKey}`
  );
  const data = await res.json();
  if (!data.values || data.values.length === 0) return {};

  const [headers, ...rows] = data.values;
  for (const row of rows) {
    if (row[0] && row[0].toString().trim() === id.toString().trim()) {
      // Map headers to row values
      const result = {};
      headers.forEach((header, idx) => {
        if (row[idx] !== undefined && row[idx] !== '') {
          result[header] = row[idx];
        }
      });

      // Format as markdown
      let markdown = '';
      for (const [key, value] of Object.entries(result)) {
        markdown += `**${key}**: ${value}\n`;
      }
      if (!markdown) {
        markdown = `No data found for ID: \`${id}\``;
      }

      return {
        ...result,
        markdown,
      };
    }
  }
  // If not found
  return {
    markdown: `No data found for ID: \`${id}\``,
  };
}


/**
 * Detailed search of the MYO Archive that returns matching entries.
 * Searches across multiple fields for the given query.
 * @param {string} query - Text to search for
 * @param {object} db - D1 binding (e.g., env.MYO_ARCHIVE)
 * @returns {Promise<Array<{cardId: string, title: string, userId: string}>>} List of matching entries
 */
export async function SearchArchiveDetailed(query, db) {
  if (!query || !db) return [];

  try {
    const results = await db.prepare(`
      SELECT cardId, title, userId 
      FROM myo_archive 
      WHERE url = ? 
         OR cardId = ?
         OR title LIKE ?
         OR author LIKE ?
         OR creatorEmail = ?
         OR userId = ?
      ORDER BY createdAt DESC
      LIMIT 100
    `)
    .bind(
      query,                    // Exact match for URL
      query,                    // Exact match for cardId
      `%${query}%`,            // Partial match for title
      `%${query}%`,            // Partial match for author
      query,                    // Exact match for email
      query                     // Exact match for userId
    )
    .all();

    return results?.results || [];
  } catch (err) {
    console.error('Search error:', err);
    return [];
  }
}

/**
 * Format an array of search result rows into a markdown string suitable for Discord.
 * Each row is expected to have at least { cardId, title, userId } and may include other fields.
 * @param {Array<Object>} results
 * @returns {string} markdown
 */
export function formatSearchResultsMarkdown(results) {
  if (!results || results.length === 0) return 'No results found.';
  if (results.length === 1) {
    const r = results[0];
    return `Found 1 entry:\n**${r.cardId}** — ${r.title || '(no title)'}\nuserId: ${r.userId || '(unknown)'}${r.shareLinkUrl ? `\nshare: ${r.shareLinkUrl}` : ''}`;
  }
  // multiple results
  const lines = results.map(r => `- **${r.cardId}** — ${r.title || '(no title)'} (user: ${r.userId || '(unknown)'})`);
  return `Found ${results.length} entries:\n` + lines.join('\n');
}

/**
 * Detailed search that returns a markdown-formatted string ready for Discord.
 * @param {string} query
 * @param {object} db
 * @returns {Promise<string>} markdown
 */
export async function SearchArchiveDetailedMarkdown(query, db) {
  const results = await SearchArchiveDetailed(query, db);
  return formatSearchResultsMarkdown(results);
}

/**
 * Simple search that returns a status string based on number of matches.
 * @param {string} query - Text to search for
 * @param {object} db - D1 binding (e.g., env.MYO_ARCHIVE)
 * @returns {Promise<string>} - 'Found in Archive', 'Found more than one', or 'Not Found'
 */
export async function SearchArchiveSimple(query, db) {
  if (!query || !db) return 'Not Found';

  try {
    const results = await SearchArchiveDetailed(query, db);
    if (results.length === 0) return 'Not Found';
    if (results.length === 1) return 'Found in Archive';
    return 'Found more than one';
  } catch (err) {
    console.error('Simple search error:', err);
    return 'Not Found';
  }
}


/**
 * Add a URL to the archive if it isn't already present.
 * Returns an object suitable for formatting as markdown via formatDataAsMarkdown.
 * @param {string} url - URL to add.
 * @param {string} sheetUrl - Google Sheet URL for the archive.
 * @param {string} apiKey - Google Sheets API key.
 * @returns {Promise<Object>} - status object describing the result.
 */
export async function AddUrlToArchive(url, sheetUrl, apiKey) {
  if (!url) return { Status: 'Error', Message: 'No URL provided' };

  // If sheetUrl or apiKey are not provided, try reading from process.env (best-effort)
  const dbUrl = sheetUrl || process.env.ARCHIVE_SHEETS_DB_URL;
  const key = apiKey || process.env.ARCHIVE_SHEETS_API_KEY;

  const found = await SearchUrlInArchive(url, dbUrl, key);
  if (found === 'Found in Archive') {
    return { Status: 'Duplicate', Message: 'Found in Archive', URL: url };
  }

  function extractSpreadsheetId(surl) {
    const match = surl?.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  }

  const spreadsheetId = extractSpreadsheetId(dbUrl);
  if (!spreadsheetId) return { Status: 'Error', Message: 'Invalid sheet URL' };

  // Fetch sheet name
  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?key=${key}`
  );
  const meta = await metaRes.json();
  const sheetName = meta.sheets?.[0]?.properties?.title;
  if (!sheetName) return { Status: 'Error', Message: 'Unable to determine sheet name' };

  // Append the URL as a new row in column A (and timestamp in column B)
  const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A:B:append?valueInputOption=RAW&key=${key}`;
  const body = { values: [[url, new Date().toISOString()]] };

  try {
    const appendRes = await fetch(appendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const appendData = await appendRes.json();
    if (appendRes.ok) {
      return { Status: 'Added', Message: 'Added to Archive', URL: url, meta: appendData };
    }
    return { Status: 'Error', Message: 'Append failed', details: appendData };
  } catch (err) {
    return { Status: 'Error', Message: err.message };
  }
}


/**
 * Backwards-compatible wrapper used by commands: attempts to use environment vars
 * if sheetUrl/apiKey aren't supplied.
 */


/**
 * Cloudflare D1-backed search for a URL.
 * Assumptions: there is a table named `archive` with at least columns `id` and `url`.
 * If your table name or schema differs, update the SQL accordingly.
 * @param {string} url - URL to search for
 * @param {object} db - D1 binding (e.g., env.MYO_ARCHIVE)
 * @returns {Promise<string>} - 'Found in Archive' or 'Not Found'
 */
export async function SearchUrlInD1(url, db) {
  if (!url) return 'Not Found';
  if (!db) return 'Not Found';

  try {
    const row = await db.prepare('SELECT cardId FROM myo_archive WHERE url = ? OR cardId = ? LIMIT 1')
      .bind(url, url)
      .first();
    if (row) return 'Found in Archive';
    return 'Not Found';
  } catch (err) {
    // If table doesn't exist or other DB error, surface Not Found to keep caller simple
    return 'Not Found';
  }
}


/**
 * Extract metadata fields from a Yoto card's NEXT_DATA JSON
 * @param {object} jsonData - Parsed __NEXT_DATA__ content
 * @returns {object|null} Extracted fields or null if required fields missing
 */
function extractYotoMetadata(jsonData) {
  const card = jsonData.props?.pageProps?.card;
  if (!card?.cardId) return null;

  const metadata = card.metadata || {};
  const media = metadata.media || {};
  const sharing = card.sharing || {};
  
  return {
    cardId: card.cardId,
    title: card.title || '',
    userId: card.userId || '',
    coverUrl: card.content?.cover?.imageL || metadata.cover?.imageL || '',
    author: metadata.author || '',
    category: metadata.category || '',
    description: metadata.description || '',
    duration: media.duration || 0,
    readableDuration: media.readableDuration || '',
    filesize: media.fileSize || 0,
    createdAt: card.createdAt || new Date().toISOString(),
    updatedAt: card.updatedAt || new Date().toISOString(),
    creatorEmail: card.creatorEmail || '',
    slug: card.slug || '',
    shareLinkUrl: sharing.linkUrl || card.shareLinkUrl || '',
    shareCount: sharing.shareCount || 0,
    shareLimit: sharing.shareLimit || 0
  };
}

/**
 * Extract __NEXT_DATA__ JSON from HTML content
 * @param {string} html - Raw HTML content
 * @returns {object|null} Parsed JSON or null if not found
 */
function extractNextData(html) {
  const scriptMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s);
  if (!scriptMatch) return null;
  try {
    return JSON.parse(scriptMatch[1]);
  } catch {
    return null;
  }
}

/**
 * Cloudflare D1-backed add-if-not-duplicate.
 * First fetches the JSON from the URL's __NEXT_DATA__ script tag, then either:
 * - For new entries: Inserts all metadata into myo_archive table
 * - For duplicates: Increments the submitCount
 * Returns a status object similar to the Sheets-based AddUrlToArchive.
 * @param {string} url - URL to add
 * @param {object} db - D1 binding (e.g., env.MYO_ARCHIVE)
 * @returns {Promise<Object>} - { Status, Message, URL, meta? }
 */
export async function AddUrlToD1(url, db) {
  if (!url) return { Status: 'Error', Message: 'No URL provided' };
  if (!db) return { Status: 'Error', Message: 'No D1 binding provided' };

  // First fetch and parse the page content to extract __NEXT_DATA__
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return { Status: 'Error', Message: `Failed to fetch URL: ${response.statusText}` };
    }
    const html = await response.text();
    
    // Extract the JSON from __NEXT_DATA__ script tag
    const jsonData = extractNextData(html);
    if (!jsonData) {
      return { Status: 'Error', Message: 'Could not find or parse __NEXT_DATA__ in page' };
    }
    
    const meta = extractYotoMetadata(jsonData);
    if (!meta) {
      return { Status: 'Error', Message: 'Could not extract required metadata from page' };
    }

    // Check if this is a duplicate by URL or cardId
    const searchResults = await SearchArchiveDetailed(url, db);
    const existingEntry = searchResults.find(entry => 
      entry.cardId === meta.cardId
    );

    if (existingEntry) {
      // Update submitCount for duplicate
      const newCount = (existingEntry.submitCount || 0) + 1;
      await db.prepare(
        'UPDATE myo_archive SET submitCount = ?, updatedAt = ? WHERE cardId = ?'
      )
      .bind(newCount, new Date().toISOString(), existingEntry.cardId)
      .run();

      // Return markdown suitable for Discord
      return `Duplicate: entry already exists.\n**cardId**: ${existingEntry.cardId}\nsubmitCount: ${newCount}`;
    }

    // Insert new entry with all fields
    const now = new Date().toISOString();
    await db.prepare(`
      INSERT INTO myo_archive (
        url, cardId, title, userId, coverUrl, author, category, description,
        duration, readableDuration, filesize, createdAt, updatedAt,
        creatorEmail, slug, shareLinkUrl, shareCount, shareLimit,
        firstSubmit, submitCount
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?
      )
    `).bind(
      url,
      meta.cardId,
      meta.title,
      meta.userId,
      meta.coverUrl,
      meta.author,
      meta.category,
      meta.description,
      meta.duration,
      meta.readableDuration,
      meta.filesize,
      meta.createdAt,
      meta.updatedAt,
      meta.creatorEmail,
      meta.slug,
      meta.shareLinkUrl,
      meta.shareCount,
      meta.shareLimit,
      now, // firstSubmit
      1    // submitCount starts at 1
    ).run();

    // Return markdown summary for the newly added entry
    return `Added to Archive:\n**cardId**: ${meta.cardId}\n**title**: ${meta.title || '(no title)'}\n**userId**: ${meta.userId || '(unknown)'}\nsubmitCount: 1`;

  }
  catch (err) {
    return {
      Status: 'Error',
      Message: err.message || String(err)
    };
  }
}


/**
 * Convenience wrapper for Workers code that receives `env`.
 * Call as: MYOSubmitD1(url, env)
 */
export async function MYOSubmitD1(url, env) {
  const db = env?.MYO_ARCHIVE;
  return await AddUrlToD1(url, db);
}

