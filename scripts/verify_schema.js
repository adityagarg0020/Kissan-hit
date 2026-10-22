const path = require('path');
const fs = require('fs');

// Simple .env reader to avoid any dependency lookup issues
const envPath = path.resolve(__dirname, '../backend/.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx > -1) {
        const k = trimmed.substring(0, idx).trim();
        const v = trimmed.substring(idx + 1).trim();
        if (!process.env[k]) process.env[k] = v;
      }
    }
  });
}

const createClient = require(path.resolve(__dirname, '../backend/node_modules/@supabase/supabase-js')).createClient;

const url = process.env.SUPABASE_URL || 'https://yjrkblcezerpbyoiizcq.supabase.co';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend/.env');
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const TABLES = [
  'profiles',
  'farms',
  'farm_crops',
  'farm_expenses',
  'farm_production',
  'user_preferences',
  'price_alerts'
];

async function verify() {
  console.log('======================================================================');
  console.log('KISSANSAATHI SUPABASE SCHEMA VERIFICATION');
  console.log('Target Project:', url);
  console.log('======================================================================');

  let allExist = true;

  for (const table of TABLES) {
    try {
      const { data, error } = await supabase.from(table).select('id').limit(1);
      if (error) {
        if (error.code === 'PGRST205' || (error.message && error.message.includes('Could not find'))) {
          console.log(`[MISSING] Table '${table}' does not exist yet.`);
        } else {
          console.log(`[ERROR] Table '${table}':`, error.message);
        }
        allExist = false;
      } else {
        console.log(`[PASS] Table '${table}' is active & reachable.`);
      }
    } catch (e) {
      console.log(`[FAIL] Table '${table}':`, e.message);
      allExist = false;
    }
  }

  console.log('======================================================================');
  if (allExist) {
    console.log('SUCCESS: All 7 farmer data tables are live and verified in Supabase!');
  } else {
    console.log('NOTICE: One or more tables are not yet created.');
    console.log('Please execute the migration script in Supabase SQL Editor:');
    console.log('-> file:///d:/Not%20Deployed/Test%202/supabase/migrations/20260910_initial_farmer_schema.sql');
  }
  console.log('======================================================================');
  return allExist;
}

verify().then(success => {
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
