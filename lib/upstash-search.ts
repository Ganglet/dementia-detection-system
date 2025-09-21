import { Client } from "@upstash/search"

export const searchClient = new Client({
  url: process.env.UPSTASH_SEARCH_REST_URL!,
  token: process.env.UPSTASH_SEARCH_REST_TOKEN!,
})

export const readOnlySearchClient = new Client({
  url: process.env.UPSTASH_SEARCH_REST_URL!,
  token: process.env.UPSTASH_SEARCH_REST_READONLY_TOKEN!,
})

export interface SearchDocument {
  id: string
  title: string
  content: string
  type: "assessment" | "result" | "recommendation" | "profile"
  userId: string
  metadata?: Record<string, any>
  createdAt: string
}

export async function indexDocument(doc: SearchDocument) {
  try {
    await searchClient.upsert({
      id: doc.id,
      data: {
        title: doc.title,
        content: doc.content,
        type: doc.type,
        userId: doc.userId,
        metadata: doc.metadata || {},
        createdAt: doc.createdAt,
      },
    })
    return { success: true }
  } catch (error) {
    console.error("Error indexing document:", error)
    return { success: false, error }
  }
}

export async function searchDocuments(query: string, userId: string, type?: string) {
  try {
    const searchQuery = type ? `${query} AND userId:${userId} AND type:${type}` : `${query} AND userId:${userId}`

    const results = await readOnlySearchClient.search(searchQuery, {
      limit: 20,
    })

    return { success: true, results: results.hits }
  } catch (error) {
    console.error("Error searching documents:", error)
    return { success: false, error, results: [] }
  }
}

export async function deleteDocument(id: string) {
  try {
    await searchClient.delete(id)
    return { success: true }
  } catch (error) {
    console.error("Error deleting document:", error)
    return { success: false, error }
  }
}
