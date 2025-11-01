import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

export async function getAppProjects() {
  try {
    return sql`SELECT * FROM app_projects`
  } catch (error) {
    throw new Error('Failed to get projects data.')
  }
}

export async function getAppProjectCreationDateAndTitleByPath(_path) {
  try {
    //await new Promise((resolve) => setTimeout(resolve, 2000))
    return sql`SELECT creation_date, title 
      FROM app_projects
      WHERE path = ${_path}`
  } catch (error) {
    throw new Error(`Failed to get project metadata data with path '${_path}'.`)
  }
}