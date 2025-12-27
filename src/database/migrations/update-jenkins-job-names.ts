import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

async function updateJenkinsJobNames() {
    const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT) || 5432,
        username: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        database: process.env.POSTGRES_DB,
        logging: true,
    });

    await dataSource.initialize();
    console.log('Connected to database');

    // First, let's check the actual column names
    const columns = await dataSource.query(`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'repos'
  `);
    console.log('Repos columns:', columns);

    const projectColumns = await dataSource.query(`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'projects'
  `);
    console.log('Projects columns:', projectColumns);

    // Update all repos that don't have jenkinsJobName set
    // jenkinsJobName = project.keyPrefix + '-' + repo.name
    try {
        const result = await dataSource.query(`
      UPDATE repos r
      SET "jenkinsJobName" = p."keyPrefix" || '-' || r.name
      FROM projects p
      WHERE r."projectId" = p.id
      AND r."jenkinsJobName" IS NULL
    `);
        console.log('Updated repos:', result);
    } catch (err) {
        console.error('Update failed, trying alternative query...');
        // Alternative if column names are different
        const repos = await dataSource.query('SELECT * FROM repos LIMIT 5');
        console.log('Sample repos:', repos);
        const projects = await dataSource.query('SELECT * FROM projects LIMIT 5');
        console.log('Sample projects:', projects);
    }

    await dataSource.destroy();
    console.log('Done!');
}

updateJenkinsJobNames().catch(console.error);
