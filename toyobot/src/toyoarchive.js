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