import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

export async function getProjects() {
  try {
    return sql`SELECT * FROM app_projects`
  } catch (error) {
    throw new Error('Failed to get projects data.')
  }
}