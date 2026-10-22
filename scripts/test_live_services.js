const path = require('path');
const dotenv = require(path.join(__dirname, '../backend/node_modules/dotenv'));
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const dataService = require('../backend/src/services/dataService');
const dataGovService = require('../backend/src/services/dataGovService');
const chatService = require('../backend/src/services/chatService');

async function testServices() {
  console.log('='.repeat(70));
  console.log('TESTING LIVE COMMODITIES DATA.GOV.IN SYNC & OPENAI CHATBOT');
  console.log('='.repeat(70));

  // 1. Initialize dataService
  console.log('\n[1] Initializing in-memory datasets...');
  await dataService.initialize();
  console.log(`Initial records count: ${dataService.mandiRecords.length} mandi, ${dataService.historicalRecords.length} historical`);

  // 2. Test Data.gov.in Live Sync
  console.log('\n[2] Testing Data.gov.in Live Mandi Synchronization...');
  try {
    const syncRes = await dataGovService.syncLatestMandiData({ limit: 10 });
    console.log('[SUCCESS] Data.gov.in Sync Result:');
    console.log(`  - Status: ${syncRes.success}`);
    console.log(`  - Records fetched: ${syncRes.recordsFetched}`);
    console.log(`  - New records added: ${syncRes.recordsAdded}`);
    console.log(`  - Total mandi records now: ${syncRes.totalMandiRecords}`);
  } catch (err) {
    console.error('[ERROR] Data.gov.in Sync failed:', err.message);
  }

  // 3. Test OpenAI Chatbot with grounding
  console.log('\n[3] Testing OpenAI Chatbot Grounding...');
  try {
    const chatRes = await chatService.handleChat({
      message: 'What is the current modal price of Wheat in Uttar Pradesh, and should I sell now or wait?',
      conversationHistory: [],
      contextLocation: { state: 'Uttar Pradesh', district: 'Agra' },
      contextCrop: 'Wheat'
    });

    console.log('[SUCCESS] OpenAI Chatbot responded:');
    console.log('  - Model used:', chatRes.model);
    console.log('  - Verified sources used:', chatRes.verifiedSources.map(s => s.tool));
    console.log('\n--- ASSISTANT REPLY ---\n');
    console.log(chatRes.reply);
    console.log('\n' + '-'.repeat(50));
  } catch (err) {
    console.error('[ERROR] OpenAI Chatbot failed:', err.message);
  }

  console.log('\n[TEST COMPLETED]');
}

testServices().catch(console.error);
