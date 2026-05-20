import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase credentials from .env.local
const supabaseUrl = '';
const supabaseServiceKey = '';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('🚀 Starting database migrations...');

async function runMigrations() {
  try {
    const migrationsDir = join(__dirname, '../supabase/migrations');
    const migrationFiles = readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log(`📋 Found ${migrationFiles.length} migration files:`, migrationFiles);

    for (const file of migrationFiles) {
      console.log(`\n🔄 Running migration: ${file}`);

      try {
        const migrationPath = join(migrationsDir, file);
        let sql = readFileSync(migrationPath, 'utf8');

        // Clean up the SQL
        sql = sql
          .replace(/--.*$/gm, '') // Remove comments
          .replace(/\n\s*\n/g, '\n') // Remove empty lines
          .trim();

        if (!sql) {
          console.log(`⚠️ Skipping empty migration: ${file}`);
          continue;
        }

        // Execute the SQL using a simple fetch request to PostgREST
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey
          },
          body: JSON.stringify({ query: sql })
        });

        if (response.ok) {
          console.log(`✅ Migration ${file} completed successfully`);
        } else {
          const errorText = await response.text();
          console.error(`❌ Migration ${file} failed:`, response.status, errorText);

          // Try alternative approach - execute via direct SQL
          try {
            console.log(`🔄 Trying alternative approach for ${file}...`);
            const { data, error } = await supabase.rpc('sql', { query: sql });
            if (error) {
              console.error(`❌ Alternative approach also failed:`, error);
            } else {
              console.log(`✅ Migration ${file} completed via alternative method`);
            }
          } catch (altError) {
            console.error(`❌ Alternative approach error:`, altError);
          }
        }
      } catch (error) {
        console.error(`❌ Error processing migration ${file}:`, error.message);
      }
    }

    console.log('\n🎉 Migration process completed!');

    // Test if we can access the database
    console.log('\n🔍 Testing database connection...');
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    if (error) {
      console.error('❌ Database test failed:', error);
    } else {
      console.log('✅ Database connection successful!');
    }

  } catch (error) {
    console.error('❌ Migration process failed:', error);
  }
}

runMigrations();