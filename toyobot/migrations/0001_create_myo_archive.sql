-- Migration: Create MYO Archive table
-- Description: Initial schema for storing Make Your Own card submissions

CREATE TABLE myo_archive (
  url TEXT NOT NULL,
  cardId TEXT PRIMARY KEY,
  title TEXT,
  userId TEXT,
  coverUrl TEXT,
  author TEXT,
  category TEXT,
  description TEXT,
  duration INTEGER,
  readableDuration TEXT,
  filesize INTEGER,
  createdAt TEXT,
  updatedAt TEXT,
  creatorEmail TEXT,
  slug TEXT,
  shareLinkUrl TEXT,
  shareCount INTEGER DEFAULT 0,
  shareLimit INTEGER DEFAULT 0,
  firstSubmit TEXT NOT NULL,
  submitCount INTEGER DEFAULT 1,
  UNIQUE(url)
);

-- Create indexes for common queries
CREATE INDEX idx_myo_archive_url ON myo_archive(url);
CREATE INDEX idx_myo_archive_cardid ON myo_archive(cardId);
CREATE INDEX idx_myo_archive_created ON myo_archive(createdAt);