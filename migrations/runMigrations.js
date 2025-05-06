const { drizzle } = require('drizzle-orm/node-postgres');
const { migrate } = require('drizzle-orm/node-postgres/migrator');
const { Pool } = require('pg');
const schema = require('./schema');

// Main migration function
async function runMigrations() {
  console.log('Starting database migrations...');

  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    const db = drizzle(pool, { schema });

    // This will run all the migrations in the drizzle folder
    await migrate(db, { migrationsFolder: './drizzle' });

    console.log('Migrations completed successfully!');
    
    // Close the pool
    await pool.end();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migrations
runMigrations();
