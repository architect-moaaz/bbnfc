/**
 * Bulk-update DHL staff profiles per the reviewer's comments:
 *   1. personalInfo.company  -> "DHL Air (Bahrain) B.S.C (c)"
 *   2. contactInfo.phone     -> prefixed with +973 (Bahrain) when not already
 *                               an international (+...) number
 *
 * SAFE BY DEFAULT: this is a DRY RUN unless you pass --apply.
 * Idempotent: re-running makes no further changes.
 *
 * Flags:
 *   --apply       actually write the changes (otherwise just preview)
 *   --dhl-only    only touch profiles whose email ends @dhl.com OR whose
 *                 company already contains "DHL" (recommended if the DB has
 *                 non-DHL profiles too)
 *
 * Usage (run from the backend/ directory):
 *   node scripts/bulkUpdateDhlProfiles.js                 # preview ALL profiles
 *   node scripts/bulkUpdateDhlProfiles.js --dhl-only      # preview DHL profiles
 *   node scripts/bulkUpdateDhlProfiles.js --apply --dhl-only   # apply to DHL profiles
 *   node scripts/bulkUpdateDhlProfiles.js --apply         # apply to ALL profiles
 */
require('dotenv').config();
const { MongoClient } = require('mongodb');

const COMPANY = 'DHL Air (Bahrain) B.S.C (c)';
const COUNTRY_CODE = '+973';
const DB_NAME = 'test'; // matches backend/utils/mongodb.js

const APPLY = process.argv.includes('--apply');
const DHL_ONLY = process.argv.includes('--dhl-only');

// Return { changed, value } for a phone. Leaves already-international numbers
// (starting with "+") untouched; turns "97336065109" into "+97336065109" and
// any other local number "36065109" into "+973 36065109".
function normalizePhone(raw) {
  if (!raw) return { changed: false };
  const phone = String(raw).trim();
  if (!phone || phone.startsWith('+')) return { changed: false, value: phone };
  const digits = phone.replace(/[^\d]/g, '');
  const next = digits.startsWith('973') ? `+${digits}` : `${COUNTRY_CODE} ${phone}`;
  return { changed: next !== phone, value: next };
}

(async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set. Run from the backend/ dir so it reads backend/.env,');
    console.error('or export MONGODB_URI first.');
    process.exit(1);
  }

  const client = new MongoClient(uri);
  await client.connect();
  const col = client.db(DB_NAME).collection('profiles');

  const filter = DHL_ONLY
    ? { $or: [
        { 'contactInfo.email': { $regex: /@dhl\.com$/i } },
        { 'personalInfo.company': { $regex: /DHL/i } },
      ] }
    : {};

  const profiles = await col.find(filter).toArray();
  console.log(`Mode:  ${APPLY ? 'APPLY (writing changes)' : 'DRY RUN (no writes)'}`);
  console.log(`Scope: ${DHL_ONLY ? 'DHL profiles only' : 'ALL profiles'}`);
  console.log(`Matched ${profiles.length} profile(s)\n`);

  let companyChanges = 0, phoneChanges = 0, writes = 0;

  for (const p of profiles) {
    const set = {};
    const name =
      `${p.personalInfo?.firstName || ''} ${p.personalInfo?.lastName || ''}`.trim() || p.slug || String(p._id);

    if ((p.personalInfo?.company || '') !== COMPANY) {
      set['personalInfo.company'] = COMPANY;
      companyChanges++;
    }

    const ph = normalizePhone(p.contactInfo?.phone);
    if (ph.changed) {
      set['contactInfo.phone'] = ph.value;
      phoneChanges++;
    }

    if (Object.keys(set).length === 0) continue;

    const parts = [];
    if (set['personalInfo.company']) parts.push(`company "${p.personalInfo?.company || ''}" -> "${COMPANY}"`);
    if (set['contactInfo.phone']) parts.push(`phone "${p.contactInfo?.phone}" -> "${ph.value}"`);
    console.log(`  ${name}: ${parts.join('  |  ')}`);

    if (APPLY) {
      await col.updateOne({ _id: p._id }, { $set: { ...set, updatedAt: new Date() } });
      writes++;
    }
  }

  console.log(
    `\nSummary: company=${companyChanges}, phone=${phoneChanges}` +
    (APPLY ? `, documents written=${writes}` : `  (DRY RUN — nothing written; add --apply to write)`)
  );

  await client.close();
  process.exit(0);
})().catch((e) => { console.error('Error:', e.message); process.exit(1); });
