import { createClient } from "@/lib/supabase/server"
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

    return NextResponse.json({ assessment })
  } catch (error) {
    console.error("Error updating assessment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
