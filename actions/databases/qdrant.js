'use server'
import {QdrantClient} from '@qdrant/js-client-rest'
import {pipeline} from '@xenova/transformers'

const qdrantClient = new QdrantClient({
  url: 'Unknown',
  apiKey: 'Unknown',
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

  return Array.from(output.data)
}

export async function sendMessage(_message) {
  try {
    return []
    // return qdrantClient.search('portfolio', {
    //   vector: await embedText(_message),
    //   limit: 10
    // })
  } catch (error) {
    throw new Error('Failed to get projects data.')
  }
}
