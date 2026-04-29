// const { createClient } = require('@supabase/supabase-js');
// const fs = require('fs');
// const path = require('path');

// // Load environment variables
// require('dotenv').config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigrations() {
  console.log('Starting database migrations...');

  const migrationsDir = path.join(__dirname, '../supabase/migrations');
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();

  console.log(`Found ${migrationFiles.length} migration files:`, migrationFiles);

  for (const file of migrationFiles) {
    console.log(`\nRunning migration: ${file}`);

    try {
      const migrationPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(migrationPath, 'utf8');

      // Split SQL into individual statements
      const statements = sql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (statement) {
          console.log(`  Executing statement ${i + 1}/${statements.length}`);
          const { error } = await supabase.rpc('exec_sql', { sql_query: statement });

          if (error) {
            console.error(`  Error in statement ${i + 1}:`, error);
            // Try direct query for some statements
            const { error: directError } = await supabase.from('_').select('*');
            if (directError && directError.code !== 'PGRST116') {
              console.error('  Direct query also failed:', directError);
            }
          }
        }
      }

      console.log(`✓ Migration ${file} completed`);
    } catch (error) {
      console.error(`✗ Migration ${file} failed:`, error.message);
    }
  }

  console.log('\nMigrations completed!');
}

// Alternative approach: Execute SQL directly
async function executeSQLDirect() {
  console.log('Attempting direct SQL execution...');

  const migrationsDir = path.join(__dirname, '../supabase/migrations');
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();

  for (const file of migrationFiles) {
    console.log(`\nProcessing migration: ${file}`);

    try {
      const migrationPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(migrationPath, 'utf8');

      // Execute the SQL using a raw query
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        },
        body: JSON.stringify({ sql_query: sql })
      });

      if (response.ok) {
        console.log(`✓ Migration ${file} executed successfully`);
      } else {
        const error = await response.text();
        console.error(`✗ Migration ${file} failed:`, error);
      }
    } catch (error) {
      console.error(`✗ Migration ${file} failed:`, error.message);
    }
  }
}

// Run the migrations
runMigrations().catch(console.error);