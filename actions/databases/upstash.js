'use server'
import apiUtility from '@/utilities/api'
import {Index} from '@upstash/vector'

const index = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN,
})

export async function sendMessage(_message) {
  try {
    const embeddingServiceUrl = new URL(`${process.env.EMBEDDING_SERVICE_URL}/embed`)
    const embeddedTextResponse = await apiUtility.post(embeddingServiceUrl, {
      text: `Query: ${_message}`
    })

    return index.query({
      vector: embeddedTextResponse.json(),
      topK: 1,
      includeMetadata: true
    })
  } catch (error) {
    throw new Error('Failed to get chatbot\'s answer.')
  }
}
