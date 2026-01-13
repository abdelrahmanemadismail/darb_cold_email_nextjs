/**
 * Test Apollo Enrichment Service
 *
 * This script tests the enrichment service with sample data
 * Run: npx tsx scripts/test-apollo-enrichment.ts
 */

import { ApolloEnrichmentService } from './enrich-apollo-results';

async function testEnrichment() {
  const apiKey = process.env.APOLLO_API_KEY;

  if (!apiKey) {
    console.error('❌ APOLLO_API_KEY not set in environment');
    process.exit(1);
  }

  console.log('🧪 Testing Apollo Enrichment Service\n');

  const service = new ApolloEnrichmentService(apiKey);

  // Test data - using Apollo's own employees as examples
  const testDetails = [
    {
      first_name: 'Tim',
      last_name: 'Zheng',
      name: 'Tim Zheng',
      email: 'tim@apollo.io',
      organization_name: 'Apollo',
      domain: 'apollo.io',
    },
  ];

  try {
    console.log('📡 Calling Apollo Bulk People Enrichment API...\n');

    const result = await service.enrichPeople(testDetails, true, false);

    console.log('✅ API call successful!\n');
    console.log('📊 Results:');
    console.log(`   - Matches found: ${result.matches.length}`);

    if (result.matches.length > 0) {
      const person = result.matches[0];
      console.log(`\n👤 Sample enriched data:`);
      console.log(`   - Name: ${person.first_name} ${person.last_name}`);
      console.log(`   - Email: ${person.email || 'Not available'}`);
      console.log(`   - Title: ${person.title || 'Not available'}`);
      console.log(`   - Email Status: ${person.email_status || 'Not available'}`);
      console.log(`   - LinkedIn: ${person.linkedin_url || 'Not available'}`);

      if (person.organization) {
        console.log(`\n🏢 Company Information:`);
        console.log(`   - Name: ${person.organization.name}`);
        console.log(`   - Domain: ${person.organization.primary_domain}`);
        console.log(`   - Location: ${person.organization.city}, ${person.organization.country}`);
        console.log(`   - Employees: ${person.organization.estimated_num_employees || 'Not available'}`);
      }

      if (person.phone_numbers && person.phone_numbers.length > 0) {
        console.log(`\n📞 Phone Numbers:`);
        person.phone_numbers.forEach((phone, i) => {
          console.log(`   ${i + 1}. ${phone.sanitized_number} (${phone.type})`);
        });
      }
    } else {
      console.log('⚠️  No matches found in the enrichment');
    }

    console.log('\n✨ Test completed successfully!');

  } catch (error) {
    console.error('\n❌ Test failed:');
    console.error(error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

// Run test
testEnrichment();
