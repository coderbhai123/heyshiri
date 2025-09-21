require('dotenv').config();
const neon = require('./neon_client');

async function seed() {
  if (!process.env.NEON_DATABASE_URL) {
    console.error('NEON_DATABASE_URL not set');
    process.exit(2);
  }
  neon.init();
  const items = [
    { side: 'groom', name: 'Seed Guest 1', phone: '7000000001', guests: 2, arrivalDate: '2025-11-12', coming: 1 },
    { side: 'bride', name: 'Seed Guest 2', phone: '7000000002', guests: 1, arrivalDate: '2025-11-12', coming: 1 },
    { side: 'groom', name: 'Seed Guest 3', phone: '7000000003', guests: 4, arrivalDate: '2025-11-12', coming: 1 },
    { side: 'bride', name: 'Seed Guest 4', phone: '7000000004', guests: 0, arrivalDate: '2025-11-12', coming: 0 },
    { side: 'groom', name: 'Seed Guest 5', phone: '7000000005', guests: 3, arrivalDate: '2025-11-12', coming: 1 }
  ];
  for (const it of items) {
    try {
      const row = await neon.insertRsvp(it);
      console.log('Inserted', row.id, row.name);
    } catch (err) {
      console.error('Insert failed for', it.name, err && err.message ? err.message : err);
    }
  }
  process.exit(0);
}

seed();
