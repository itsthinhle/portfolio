'use server'
import {Index} from '@upstash/vector'
import {pipeline} from '@xenova/transformers'

const index = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN,
})

const embedText = async (_string) => {
  const featureExtractionPipeline = await pipeline(
    'feature-extraction',
    'Xenova/bge-small-en-v1.5'
  )

  // Generate embedding
  const output = await featureExtractionPipeline(_string, {
    pooling: 'mean',
    normalize: true,
  })

  console.log(Array.from(output.data))

  return Array.from(output.data)
}

export async function sendMessage(_message) {
  try {
    return index.query({
      vector: await embedText(`Query: ${_message}`),
      topK: 1,
      includeMetadata: true
    })
  } catch (error) {
    throw new Error('Failed to get projects data.')
  }
}
