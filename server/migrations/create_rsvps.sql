-- Create RSVPS table
CREATE TABLE IF NOT EXISTS rsvps (
  id BIGSERIAL PRIMARY KEY,
  side VARCHAR(20),
  name TEXT NOT NULL,
  phone VARCHAR(50),
  guests INTEGER DEFAULT 0,
  arrival_date DATE,
  coming INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Optional index for faster reads
CREATE INDEX IF NOT EXISTS idx_rsvps_created_at ON rsvps(created_at DESC);
