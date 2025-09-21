import { createClient } from "@/lib/supabase/server"
import { indexDocument } from "@/lib/upstash-search"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { assessment_type, language = "en" } = body
    const supabase = await createClient()

    // Verify user authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!assessment_type) {
      return NextResponse.json({ error: "Assessment type is required" }, { status: 400 })
    }

    // Create new assessment
    const { data: assessment, error: createError } = await supabase
      .from("assessments")
      .insert({
        user_id: user.id,
        assessment_type,
        language,
        status: "in_progress",
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (createError || !assessment) {
      return NextResponse.json({ error: "Failed to create assessment" }, { status: 400 })
    }

    try {
      await indexDocument({
        id: `assessment_${assessment.id}`,
        title: `${assessment_type} Assessment Started`,
        content: `New ${assessment_type} assessment started on ${new Date(assessment.created_at).toLocaleDateString()}. Status: ${assessment.status}. Language: ${language}.`,
        type: "assessment",
        userId: user.id,
        metadata: {
          assessmentId: assessment.id,
          assessmentType: assessment_type,
          status: assessment.status,
          language: language,
        },
        createdAt: assessment.created_at,
      })
    } catch (searchError) {
      console.error("Error indexing new assessment for search:", searchError)
      // Don't fail the request if search indexing fails
    }

    return NextResponse.json({ assessment })
  } catch (error) {
    console.error("Error creating assessment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify user authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all assessments for the user
    const { data: assessments, error: fetchError } = await supabase
      .from("assessments")
      .select(`
        *,
        risk_scores (*)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (fetchError) {
      return NextResponse.json({ error: "Failed to fetch assessments" }, { status: 500 })
    }

    return NextResponse.json({ assessments })
  } catch (error) {
    console.error("Error fetching assessments:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
