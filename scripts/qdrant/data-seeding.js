// This script can be execute directly via node: $node data-seeding.js
const {QdrantClient} = require('@qdrant/js-client-rest')
const metadata = require('./metadata')
const { pipeline } = require('@xenova/transformers')

const featureExtractionPipeline = await pipeline(
  'feature-extraction',
  'Xenova/all-MiniLM-L6-v2'
)

// Transform text to vector
// May need to check new code from qdrant action
const embedText = async (_string) => {
  // Generate embedding
  const output = await featureExtractionPipeline(_string, {
    pooling: 'mean',
    normalize: true,
  })

  return Array.from(output.data)
}

const createPagePoints = async () => {
  return Promise.all(metadata.page.map(async _pageMetadata => {
    return {
      id: _pageMetadata.id,
      vector: await embedText(_pageMetadata.description),
      payload: {
        title: _pageMetadata.title,
        description: _pageMetadata.description,
        path: _pageMetadata.path,
        answer: _pageMetadata.answer
      },
    }
  }))
}

// An async function to execute the operation
async function main() {
  const qdrantClient = new QdrantClient({
    url: 'Unknown',
    apiKey: 'Unknown',
  })

  const pagePoints = await createPagePoints()
  console.log(pagePoints)

  // Upsert function (uncomment it to update the data --------------------
  // index.upsert(pagePoints)
  qdrantClient.upsert('portfolio', {
    points: pagePoints
  })
}

// Call the async function
main()





