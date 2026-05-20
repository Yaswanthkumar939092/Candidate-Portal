#!/usr/bin/env node

/**
 * Supabase Database Setup Script
 * Project ID: luniiecxbsyajdfjtsox
 *
 * This script sets up the Supabase database by running migrations and seeding data.
 * It can be run locally or in CI/CD environments.
 */

// const { createClient } = require('@supabase/supabase-js');
// const fs = require('fs').promises;
// const path = require('path');
// const { execSync } = require('child_process');

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PROJECT_ID = 'luniiecxbsyajdfjtsox';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Logging utilities
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`),
};

class SupabaseSetup {
  constructor() {
    this.supabase = null;
    this.migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
    this.seedFile = path.join(__dirname, '..', 'supabase', 'seed.sql');
  }

  /**
   * Initialize Supabase client
   */
  async initialize() {
    log.title('🚀 Initializing Supabase Database Setup');

    // Validate environment variables
    if (!SUPABASE_URL) {
      log.error('SUPABASE_URL environment variable is required');
      process.exit(1);
    }

    if (!SUPABASE_SERVICE_KEY) {
      log.error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
      process.exit(1);
    }

    // Validate project ID
    if (!SUPABASE_URL.includes(PROJECT_ID)) {
      log.warning(`Project ID mismatch. Expected: ${PROJECT_ID}, URL: ${SUPABASE_URL}`);
    }

    // Create Supabase client
    this.supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Test connection
    const { data, error } = await this.supabase.from('information_schema.tables').select('*').limit(1);
    if (error) {
      log.error(`Failed to connect to Supabase: ${error.message}`);
      process.exit(1);
    }

    log.success(`Connected to Supabase project: ${PROJECT_ID}`);
  }

  /**
   * Check if Supabase CLI is available
   */
  checkSupabaseCLI() {
    try {
      execSync('supabase --version', { stdio: 'pipe' });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Run a SQL file against the database
   */
  async runSQLFile(filePath, description) {
    try {
      log.info(`Running ${description}...`);

      const sql = await fs.readFile(filePath, 'utf-8');

      // Split SQL into statements (basic splitting, may need refinement for complex cases)
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      let successCount = 0;
      let errorCount = 0;

      for (const statement of statements) {
        if (statement.length === 0) continue;

        try {
          const { error } = await this.supabase.rpc('exec_sql', { sql: statement });
          if (error) {
            // Some errors are expected (like "already exists")
            if (error.message.includes('already exists') ||
                error.message.includes('does not exist') ||
                error.message.includes('duplicate key')) {
              log.warning(`Skipping: ${error.message.substring(0, 100)}...`);
            } else {
              log.error(`SQL Error: ${error.message}`);
              errorCount++;
            }
          } else {
            successCount++;
          }
        } catch (err) {
          log.error(`Exception running statement: ${err.message}`);
          errorCount++;
        }
      }

      if (errorCount === 0) {
        log.success(`${description} completed successfully (${successCount} statements)`);
      } else {
        log.warning(`${description} completed with ${errorCount} errors and ${successCount} successes`);
      }

      return errorCount === 0;
    } catch (error) {
      log.error(`Failed to run ${description}: ${error.message}`);
      return false;
    }
  }

  /**
   * Run a single SQL statement
   */
  async runSQL(sql, description) {
    try {
      log.info(description);

      // For complex statements, we'll use the RPC approach
      const { data, error } = await this.supabase.rpc('exec_sql', { sql });

      if (error) {
        if (error.message.includes('already exists') ||
            error.message.includes('does not exist') ||
            error.message.includes('duplicate key')) {
          log.warning(`${description} - Already exists, skipping`);
          return true;
        } else {
          log.error(`${description} failed: ${error.message}`);
          return false;
        }
      }

      log.success(`${description} completed`);
      return true;
    } catch (error) {
      log.error(`${description} failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Create the exec_sql function if it doesn't exist
   */
  async createExecSQLFunction() {
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION exec_sql(sql text)
      RETURNS text
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        EXECUTE sql;
        RETURN 'OK';
      EXCEPTION
        WHEN OTHERS THEN
          RETURN SQLERRM;
      END;
      $$;
    `;

    try {
      // Use direct SQL execution for this critical function
      const { error } = await this.supabase.rpc('query', {
        query: createFunctionSQL
      });

      if (!error) {
        log.success('Created exec_sql helper function');
        return true;
      }
    } catch (err) {
      // Function might not exist yet, let's try a different approach
    }

    // Alternative approach: try to create it directly
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/query`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ query: createFunctionSQL }),
      });

      if (response.ok) {
        log.success('Created exec_sql helper function');
        return true;
      }
    } catch (err) {
      log.warning('Could not create exec_sql function, will use direct SQL execution');
    }

    return false;
  }

  /**
   * Run database migrations
   */
  async runMigrations() {
    log.title('📁 Running Database Migrations');

    try {
      const files = await fs.readdir(this.migrationsDir);
      const migrationFiles = files
        .filter(f => f.endsWith('.sql'))
        .sort(); // Ensure proper order

      if (migrationFiles.length === 0) {
        log.warning('No migration files found');
        return true;
      }

      log.info(`Found ${migrationFiles.length} migration files`);

      let allSuccessful = true;
      for (const file of migrationFiles) {
        const filePath = path.join(this.migrationsDir, file);
        const success = await this.runSQLFile(filePath, `Migration: ${file}`);
        if (!success) {
          allSuccessful = false;
        }
      }

      if (allSuccessful) {
        log.success('All migrations completed successfully');
      } else {
        log.warning('Some migrations had errors');
      }

      return allSuccessful;
    } catch (error) {
      log.error(`Failed to run migrations: ${error.message}`);
      return false;
    }
  }

  /**
   * Seed the database with sample data
   */
  async seedDatabase() {
    log.title('🌱 Seeding Database');

    try {
      const exists = await fs.access(this.seedFile).then(() => true).catch(() => false);
      if (!exists) {
        log.warning('Seed file not found, skipping seeding');
        return true;
      }

      const success = await this.runSQLFile(this.seedFile, 'Database seeding');
      if (success) {
        log.success('Database seeded successfully');
      }
      return success;
    } catch (error) {
      log.error(`Failed to seed database: ${error.message}`);
      return false;
    }
  }

  /**
   * Validate the database setup
   */
  async validateSetup() {
    log.title('✅ Validating Database Setup');

    const validations = [
      {
        name: 'Check users table',
        query: "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public'",
        expected: (result) => result[0]?.count === '1',
      },
      {
        name: 'Check jobs table',
        query: "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_name = 'jobs' AND table_schema = 'public'",
        expected: (result) => result[0]?.count === '1',
      },
      {
        name: 'Check RLS is enabled on users table',
        query: "SELECT relrowsecurity FROM pg_class WHERE relname = 'users' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')",
        expected: (result) => result[0]?.relrowsecurity === true,
      },
      {
        name: 'Check sample companies exist',
        query: 'SELECT COUNT(*) as count FROM public.companies',
        expected: (result) => parseInt(result[0]?.count || '0') > 0,
      },
      {
        name: 'Check sample jobs exist',
        query: 'SELECT COUNT(*) as count FROM public.jobs',
        expected: (result) => parseInt(result[0]?.count || '0') > 0,
      },
    ];

    let allValid = true;
    for (const validation of validations) {
      try {
        const { data, error } = await this.supabase.rpc('exec_sql', {
          sql: validation.query
        });

        if (error) {
          log.error(`${validation.name}: ${error.message}`);
          allValid = false;
          continue;
        }

        // Parse the result if it's a string
        let result = data;
        if (typeof data === 'string' && data.startsWith('[')) {
          try {
            result = JSON.parse(data);
          } catch (e) {
            result = [{ count: data }];
          }
        }

        const isValid = validation.expected(result);
        if (isValid) {
          log.success(validation.name);
        } else {
          log.error(`${validation.name}: Validation failed`);
          allValid = false;
        }
      } catch (error) {
        log.error(`${validation.name}: ${error.message}`);
        allValid = false;
      }
    }

    return allValid;
  }

  /**
   * Generate TypeScript types (if Supabase CLI is available)
   */
  async generateTypes() {
    log.title('🔧 Generating TypeScript Types');

    if (!this.checkSupabaseCLI()) {
      log.warning('Supabase CLI not found, skipping type generation');
      log.info('Install with: npm install -g supabase');
      return false;
    }

    try {
      const typesDir = path.join(__dirname, '..', 'types');
      await fs.mkdir(typesDir, { recursive: true });

      const command = `supabase gen types typescript --project-id ${PROJECT_ID} > ${path.join(typesDir, 'supabase.ts')}`;
      execSync(command, { stdio: 'pipe' });

      log.success('TypeScript types generated successfully');
      return true;
    } catch (error) {
      log.error(`Failed to generate types: ${error.message}`);
      log.info('You may need to login: supabase auth login');
      return false;
    }
  }

  /**
   * Main setup process
   */
  async setup(options = {}) {
    const {
      skipMigrations = false,
      skipSeeding = false,
      skipValidation = false,
      skipTypes = false,
    } = options;

    try {
      await this.initialize();

      // Create helper function
      await this.createExecSQLFunction();

      // Run migrations
      if (!skipMigrations) {
        const migrationSuccess = await this.runMigrations();
        if (!migrationSuccess && !options.continueOnError) {
          log.error('Migration failed, stopping setup');
          process.exit(1);
        }
      }

      // Seed database
      if (!skipSeeding) {
        const seedSuccess = await this.seedDatabase();
        if (!seedSuccess && !options.continueOnError) {
          log.error('Seeding failed, stopping setup');
          process.exit(1);
        }
      }

      // Validate setup
      if (!skipValidation) {
        const validationSuccess = await this.validateSetup();
        if (!validationSuccess) {
          log.warning('Some validations failed, but setup may still be functional');
        }
      }

      // Generate types
      if (!skipTypes) {
        await this.generateTypes();
      }

      log.title('🎉 Supabase Database Setup Complete!');
      log.info(`Project ID: ${PROJECT_ID}`);
      log.info(`URL: ${SUPABASE_URL}`);

    } catch (error) {
      log.error(`Setup failed: ${error.message}`);
      process.exit(1);
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const options = {};

  // Parse command line arguments
  args.forEach(arg => {
    switch (arg) {
      case '--skip-migrations':
        options.skipMigrations = true;
        break;
      case '--skip-seeding':
        options.skipSeeding = true;
        break;
      case '--skip-validation':
        options.skipValidation = true;
        break;
      case '--skip-types':
        options.skipTypes = true;
        break;
      case '--continue-on-error':
        options.continueOnError = true;
        break;
      case '--help':
      case '-h':
        console.log(`
Supabase Database Setup Script

Usage: node setup-supabase.js [options]

Options:
  --skip-migrations     Skip running database migrations
  --skip-seeding        Skip seeding the database with sample data
  --skip-validation     Skip database validation checks
  --skip-types          Skip TypeScript type generation
  --continue-on-error   Continue setup even if some steps fail
  --help, -h            Show this help message

Environment Variables:
  SUPABASE_URL                 Your Supabase project URL
  SUPABASE_SERVICE_ROLE_KEY    Your Supabase service role key

Example:
  node setup-supabase.js
  node setup-supabase.js --skip-seeding --skip-types
        `);
        process.exit(0);
        break;
    }
  });

  const setup = new SupabaseSetup();
  await setup.setup(options);
}

// Export for programmatic use
module.exports = SupabaseSetup;

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
}