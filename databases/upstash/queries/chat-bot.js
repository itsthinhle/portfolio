'use server'
import apiUtility from '@/utilities/api'
import {index} from "@/databases/upstash";

export async function sendMessage(_message) {
    try {
        const embeddingServiceUrl = new URL(`${process.env.EMBEDDING_SERVICE_URL}/embed`)
        const embeddedTextResponse = await apiUtility.post(embeddingServiceUrl, {
            text: `Query: ${_message}`
        })
        const embeddedText = await embeddedTextResponse.json()

        return index.query({
            vector: embeddedText,
            topK: 1,
            includeMetadata: true
        })
    } catch (error) {
        throw new Error('Failed to get chatbot\'s answer.')
    }
}
