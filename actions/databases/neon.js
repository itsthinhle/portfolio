'use server'
import {neon} from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

/* App cards */

export async function getAppProjectCards() {
  try {
    //await new Promise((resolve) => setTimeout(resolve, 40000))
    return sql`SELECT * FROM app_cards 
      WHERE type = 'project'`
  } catch (error) {
    throw new Error('Failed to get projects data.')
  }
}

export async function getAppBlogCards() {
  try {
    return sql`SELECT * FROM app_cards 
               WHERE type = 'blog'`
  } catch (error) {
    throw new Error('Failed to get projects data.')
  }
}

/* States and Cities */

export async function getStatesIds() {
  try {
    return sql`SELECT id FROM states`
  } catch (error) {
    throw new Error('Failed to get state ids.')
  }
}

export async function getCityNamesByStateId(_stateId) {
  try {
    return sql`SELECT city from cities WHERE state_id = ${_stateId}`
  } catch (error) {
    throw new Error('Failed to get cities.')
  }
}

