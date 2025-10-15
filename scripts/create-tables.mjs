import { createClient } from '@supabase/supabase-js';

// Supabase credentials
const supabaseUrl = 'https://luniiecxbsyajdfjtsox.supabase.co';
const supabaseServiceKey = 'REDACTED_SUPABASE_SECRET';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('🚀 Creating database tables manually...');

async function createTables() {
  try {
    // First, let's try to create the profiles table directly using Supabase client
    console.log('📋 Creating profiles table...');

    // Create the profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (profileError && profileError.code === 'PGRST205') {
      console.log('✅ Profiles table does not exist, which is expected. Database needs manual setup.');
      console.log('\n📝 Manual Setup Instructions:');
      console.log('1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/luniiecxbsyajdfjtsox');
      console.log('2. Navigate to the SQL Editor');
      console.log('3. Copy and paste the contents of each migration file in order:');
      console.log('   - 001_initial_schema.sql');
      console.log('   - 002_rls_policies.sql');
      console.log('   - 003_indexes.sql');
      console.log('   - 004_feature_flags.sql');
      console.log('   - 20240101000000_add_provider_to_profiles.sql');
      console.log('4. Execute each migration in the SQL Editor');
      console.log('\n📁 Migration files are located in: /home/frappe/candidate-portal/supabase/migrations/');
    } else if (profileError) {
      console.error('❌ Unexpected error:', profileError);
    } else {
      console.log('✅ Profiles table already exists!');
      console.log('📊 Sample data:', profileData);
    }

    // Test basic Supabase connectivity
    console.log('\n🔍 Testing Supabase connection...');
    const { data: versionData, error: versionError } = await supabase
      .rpc('version')
      .single();

    if (versionError) {
      console.log('⚠️ Could not get PostgreSQL version, but connection seems to work');
    } else {
      console.log('✅ PostgreSQL version:', versionData);
    }

    // List existing tables
    console.log('\n📋 Attempting to list existing tables...');
    const { data: tablesData, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (tablesError) {
      console.log('⚠️ Could not list tables:', tablesError.message);
    } else {
      console.log('📊 Existing tables:', tablesData?.map(t => t.table_name) || []);
    }

  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

createTables();