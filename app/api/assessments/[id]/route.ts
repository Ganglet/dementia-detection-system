import { createClient } from "@/lib/supabase/server"
import { indexDocument } from "@/lib/upstash-search"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Verify user authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get assessment with related data
    const { data: assessment, error: assessmentError } = await supabase
      .from("assessments")
      .select(`
        *,
        assessment_tasks (*),
        speech_analysis (*),
        risk_scores (*)
      `)
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (assessmentError || !assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 })
    }

    return NextResponse.json({ assessment })
  } catch (error) {
    console.error("Error fetching assessment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const supabase = await createClient()

    // Verify user authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Update assessment
    const { data: assessment, error: updateError } = await supabase
      .from("assessments")
      .update(body)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (updateError || !assessment) {
      return NextResponse.json({ error: "Failed to update assessment" }, { status: 400 })
    }

    if (body.status === "completed") {
      try {
        await indexDocument({
          id: `assessment_${id}`,
          title: `${assessment.assessment_type} Assessment`,
          content: `${assessment.assessment_type} assessment completed on ${new Date(assessment.created_at).toLocaleDateString()}. Status: ${assessment.status}. ${assessment.notes || ""}`,
          type: "assessment",
          userId: user.id,
          metadata: {
            assessmentId: id,
            assessmentType: assessment.assessment_type,
            status: assessment.status,
            riskLevel: assessment.risk_level,
            totalScore: assessment.total_score,
          },
          createdAt: assessment.created_at,
        })
      } catch (searchError) {
        console.error("Error indexing updated assessment for search:", searchError)
        // Don't fail the request if search indexing fails
      }
    }

    return NextResponse.json({ assessment })
  } catch (error) {
    console.error("Error updating assessment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
