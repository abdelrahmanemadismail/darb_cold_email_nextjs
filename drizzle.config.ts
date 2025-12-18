import { config } from 'dotenv';

// Load .env.local file
config({ path: '.env.local' });

const drizzleConfig = {
  schema: './db/schema/*.ts',
  out: './db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
};

export default drizzleConfig;
