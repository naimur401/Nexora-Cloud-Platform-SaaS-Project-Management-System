import { Pool } from 'pg';

const pool = new Pool({
  user: 'postgres',
  password: 'postgres',
  host: 'localhost',
  port: 5432,
  database: 'nexora_db',
});

pool.on('connect', () => {
  console.log('✅ PostgreSQL connected successfully');
});

export default pool;
