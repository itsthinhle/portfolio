import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

export async function getAppCardCreationDateAndTitleByPath(_path) {
  try {
    //await new Promise((resolve) => setTimeout(resolve, 2000))
    return sql`SELECT creation_date, title 
      FROM app_cards
      WHERE path = ${_path}`
  } catch (error) {
    throw new Error(`Failed to get project metadata data with path '${_path}'.`)
  }
}

export async function getAppProjectCards() {
  try {
    return sql`SELECT * FROM app_cards WHERE type = 'project'`
  } catch (error) {
    throw new Error('Failed to get projects data.')
  }
}

export async function getAppBlogCards() {
  try {
    return sql`SELECT * FROM app_cards WHERE type = 'blog'`
  } catch (error) {
    throw new Error('Failed to get projects data.')
  }
}