// db.js
import sqlite3 from 'sqlite3';
import { Database, open } from 'sqlite';



let dbInstance: Database | null = null;
// Open the SQLite database
export const openDb = async (): Promise<Database> => {
    if (!dbInstance) {
      dbInstance = await open({
        filename: './users.db',
        driver: sqlite3.Database,
      });
      console.log('Database connection established');
    }
    return dbInstance;
  };

// Initialize the database and create a users table if it doesn’t exist
export async function initializeDb() {
  const db = await openDb();
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      firstname TEXT,
      lastname TEXT,
      username TEXT UNIQUE,
      password TEXT
    )
  `);
}
