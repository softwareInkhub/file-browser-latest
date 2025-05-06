const { drizzle } = require('drizzle-orm/node-postgres');
const { migrate } = require('drizzle-orm/node-postgres/migrator');
const { Pool } = require('pg');
const schema = require('./schema');

// Main push function
async function pushSchema() {
  console.log('Pushing schema to database...');

  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    const db = drizzle(pool, { schema });

    // Create tables based on our schema
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS email_idx ON users (email);
      CREATE INDEX IF NOT EXISTS user_id_idx ON users (user_id);
      
      CREATE TABLE IF NOT EXISTS files (
        id SERIAL PRIMARY KEY,
        file_id VARCHAR(255) NOT NULL UNIQUE,
        file_name VARCHAR(255) NOT NULL,
        s3_key VARCHAR(255) NOT NULL,
        size INTEGER NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS file_id_idx ON files (file_id);
      CREATE INDEX IF NOT EXISTS files_user_id_idx ON files (user_id);
      
      CREATE TABLE IF NOT EXISTS file_shares (
        id SERIAL PRIMARY KEY,
        file_id VARCHAR(255) NOT NULL,
        owner_id VARCHAR(255) NOT NULL,
        shared_with_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS file_share_file_id_idx ON file_shares (file_id);
      CREATE INDEX IF NOT EXISTS owner_id_idx ON file_shares (owner_id);
      CREATE INDEX IF NOT EXISTS shared_with_id_idx ON file_shares (shared_with_id);
      CREATE UNIQUE INDEX IF NOT EXISTS unique_share_idx ON file_shares (file_id, shared_with_id);
    `);

    console.log('Schema pushed successfully!');
    
    // Close the pool
    await pool.end();
  } catch (error) {
    console.error('Schema push failed:', error);
    process.exit(1);
  }
}

// Run the schema push
pushSchema();
