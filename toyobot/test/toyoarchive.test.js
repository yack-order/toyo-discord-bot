import { expect } from 'chai';
import sinon from 'sinon';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import { SearchArchiveSimple, SearchArchiveDetailed, AddUrlToD1, extractYotoMetadata } from '../src/toyoarchive.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('MYO Archive Functions', () => {
  // Load example data once for all tests
  const exampleJson = JSON.parse(fs.readFileSync(
    path.join(__dirname, 'example.json'),
    'utf8'
  ));

  const mockHtml = `
    <!DOCTYPE html>
    <html>
      <body>
        <script id="__NEXT_DATA__" type="application/json">
          ${JSON.stringify(exampleJson)}
        </script>
      </body>
    </html>
  `;

  const testUrl = 'https://yoto.io/3VUr0?g4K9YqFNigES=9ZW5Heb3yOdx0';
  let db;
  let fetchStub;

  beforeEach(() => {
    // Mock D1 database
    db = {
      prepare: sinon.stub().returnsThis(),
      bind: sinon.stub().returnsThis(),
      first: sinon.stub(),
      run: sinon.stub(),
    };

    // Mock fetch for URL content
    fetchStub = sinon.stub(global, 'fetch').resolves({
      ok: true,
      text: () => Promise.resolve(mockHtml)
    });
  });

  afterEach(() => {
    fetchStub.restore();
  });

  describe('SearchArchiveSimple', () => {
    it('should return "Not Found" for missing query', async () => {
      const result = await SearchArchiveSimple('', db);
      expect(result).to.equal('Not Found');
    });

    it('should return "Not Found" for missing DB', async () => {
      const result = await SearchArchiveSimple(testUrl, null);
      expect(result).to.equal('Not Found');
    });

    it('should return "Found in Archive" when exactly one match exists', async () => {
      db.all.returns({ results: [{ cardId: '3VUr0', title: 'Test', userId: 'user1' }] });
      const result = await SearchArchiveSimple(testUrl, db);
      expect(result).to.equal('Found in Archive');
      
      // Verify correct SQL includes all searchable fields
      const sql = db.prepare.firstCall.args[0];
      expect(sql).to.include('url = ?');
      expect(sql).to.include('cardId = ?');
      expect(sql).to.include('title LIKE ?');
      expect(sql).to.include('author LIKE ?');
      expect(sql).to.include('creatorEmail = ?');
      expect(sql).to.include('userId = ?');
    });

    it('should return "Found more than one" for multiple matches', async () => {
      db.all.returns({ 
        results: [
          { cardId: '3VUr0', title: 'Test 1', userId: 'user1' },
          { cardId: '4VUr0', title: 'Test 2', userId: 'user2' }
        ]
      });
      const result = await SearchArchiveSimple(testUrl, db);
      expect(result).to.equal('Found more than one');
    });
  });

  describe('SearchArchiveDetailed', () => {
    it('should return empty array for missing query', async () => {
      const result = await SearchArchiveDetailed('', db);
      expect(result).to.deep.equal([]);
    });

    it('should return empty array for missing DB', async () => {
      const result = await SearchArchiveDetailed(testUrl, null);
      expect(result).to.deep.equal([]);
    });

    it('should return array of matching entries with required fields', async () => {
      const mockResults = [
        { cardId: '3VUr0', title: 'Test 1', userId: 'user1' },
        { cardId: '4VUr0', title: 'Test 2', userId: 'user2' }
      ];
      db.all.returns({ results: mockResults });
      
      const result = await SearchArchiveDetailed('Test');
      expect(result).to.deep.equal(mockResults);
      
      // Verify SQL includes ORDER BY and LIMIT
      const sql = db.prepare.firstCall.args[0];
      expect(sql).to.include('ORDER BY createdAt DESC');
      expect(sql).to.include('LIMIT 100');
    });

    it('should handle DB errors gracefully', async () => {
      db.all.throws(new Error('DB Error'));
      const result = await SearchArchiveDetailed(testUrl, db);
      expect(result).to.deep.equal([]);
    });
  });

  describe('AddUrlToD1', () => {
    it('should handle missing URL', async () => {
      const result = await AddUrlToD1('', db);
      expect(result.Status).to.equal('Error');
      expect(result.Message).to.equal('No URL provided');
    });

    it('should handle missing DB', async () => {
      const result = await AddUrlToD1(testUrl, null);
      expect(result.Status).to.equal('Error');
      expect(result.Message).to.equal('No D1 binding provided');
    });

    it('should handle network errors', async () => {
      fetchStub.restore();
      fetchStub = sinon.stub(global, 'fetch').rejects(new Error('Network error'));
      
      const result = await AddUrlToD1(testUrl, db);
      expect(result.Status).to.equal('Error');
      expect(result.Message).to.equal('Network error');
    });

    it('should handle duplicate entries by incrementing submitCount', async () => {
      // Simulate existing entry
      db.first.returns({ cardId: '3VUr0', submitCount: 1 });
      
      const result = await AddUrlToD1(testUrl, db);
      expect(result.Status).to.equal('Duplicate');
      expect(result.submitCount).to.equal(2);
      
      // Verify update was called with correct parameters
      const updateCall = db.prepare.getCalls().find(call => 
        call.args[0].includes('UPDATE myo_archive SET submitCount'));
      expect(updateCall).to.exist;
    });

    it('should add new entries with correct metadata', async () => {
      // Simulate no existing entry
      db.first.returns(null);
      
      const result = await AddUrlToD1(testUrl, db);
      expect(result.Status).to.equal('Added');
      expect(result.cardId).to.equal('3VUr0');
      expect(result.submitCount).to.equal(1);
      
      // Verify insert was called with correct fields
      const insertCall = db.prepare.getCalls().find(call => 
        call.args[0].includes('INSERT INTO myo_archive'));
      expect(insertCall).to.exist;
      
      // Verify the bind parameters using the example data
      const bindCall = db.bind.getCalls().find(call => call.args.length > 10);
      expect(bindCall).to.exist;
      const params = bindCall.args;
      
      // Check a few key fields from the example data
      expect(params).to.include('3VUr0'); // cardId
      expect(params).to.include("Roger Zelazny's Amber 01 - Nine Princes in Amber"); // title
      expect(params).to.include('auth0|6613444a01d2da29fa60312f'); // userId
    });
  });
});