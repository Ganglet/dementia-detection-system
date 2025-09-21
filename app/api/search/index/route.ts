import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { indexDocument, type SearchDocument } from "@/lib/upstash-search"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, content, type, metadata } = body

    if (!title || !content || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const document: SearchDocument = {
      id: `${type}_${user.id}_${Date.now()}`,
      title,
      content,
      type,
      userId: user.id,
      metadata: metadata || {},
      createdAt: new Date().toISOString(),
    }

    const result = await indexDocument(document)

    if (!result.success) {
      return NextResponse.json({ error: "Failed to index document" }, { status: 500 })
    }

    return NextResponse.json({ success: true, documentId: document.id })
  } catch (error) {
    console.error("Index API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
