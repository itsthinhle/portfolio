// This script can be execute directly via node: $node data-seeding.js
const metadata = require('./metadata/index.js')
const { pipeline } = require('@xenova/transformers')
const { Index } = require('@upstash/vector')

const index = new Index({
  url: 'Unknown',
  token: 'Unknown',
})

// Transform text to vector
// May need to check new code from qdrant action
const embedText = async (_string) => {
  const featureExtractionPipeline = await pipeline(
    'feature-extraction',
    'Xenova/all-MiniLM-L6-v2'
  )

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
      metadata: {
        title: _pageMetadata.title,
        description: _pageMetadata.description,
        type: _pageMetadata.type,
        path: _pageMetadata.path,
        answer: _pageMetadata.answer
      },
    }
  }))
}

const createFAQPoints = async () => {
  return Promise.all(metadata.faq.map(async _faqMetadata => {
    return {
      id: _faqMetadata.id,
      vector: await embedText(_faqMetadata.question),
      metadata: {
        type: _faqMetadata.type,
        answer: _faqMetadata.answer
      },
    }
  }))
}

// An async function to execute the operation
async function main() {
  const pagePoints = await createPagePoints()
  const faqPoints = await createFAQPoints()

  // Upsert function (uncomment it to update the data --------------------
  index.upsert([...pagePoints, ...faqPoints])
}

// Call the async function
main()





