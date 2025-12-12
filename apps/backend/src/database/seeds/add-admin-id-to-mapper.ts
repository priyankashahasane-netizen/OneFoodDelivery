import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

/**
 * Add admin_id column to mapper table if missing
 */
async function addAdminIdToMapper() {
  console.log('🚀 Initializing database connection...');

  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/stack_delivery',
    entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
    synchronize: false,
    logging: true,
  });

  let queryRunner = dataSource.createQueryRunner();

  try {
    await dataSource.initialize();
    console.log('✅ Database connection established');

    queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();

    // Ensure mapper table exists
    const mapperTable = await queryRunner.query(
      `SELECT to_regclass('mapper') AS exists;`
    );

    if (!mapperTable?.[0]?.exists) {
      console.log('⚠️  mapper table does not exist. Nothing to update.');
      await queryRunner.release();
      await dataSource.destroy();
      return;
    }

    // Check if admin_id column already exists
    const columnExists = await queryRunner.query(
      `SELECT 1 FROM information_schema.columns WHERE table_name = 'mapper' AND column_name = 'admin_id' LIMIT 1;`
    );

    if (columnExists.length > 0) {
      console.log('✅ admin_id column already exists on mapper table. Skipping.');
      await queryRunner.release();
      await dataSource.destroy();
      return;
    }

    console.log('📝 Adding admin_id column to mapper table...');
    await queryRunner.query(`
      ALTER TABLE mapper
      ADD COLUMN admin_id UUID NULL
    `);

    console.log('📝 Creating index on admin_id...');
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_mapper_admin_id ON mapper(admin_id)
    `);

    console.log('✅ admin_id column added successfully');
    await queryRunner.release();
    await dataSource.destroy();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error adding admin_id to mapper table:', error);
    if (queryRunner && !queryRunner.isReleased) {
      try {
        await queryRunner.release();
      } catch (releaseError) {
        console.error('❌ Failed to release query runner:', releaseError);
      }
    }
    await dataSource.destroy();
    process.exit(1);
  }
}

addAdminIdToMapper();

