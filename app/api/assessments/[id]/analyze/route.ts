import { createClient } from "@/lib/supabase/server"
import { DementiaRiskScorer } from "@/lib/risk-scoring"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    // Get assessment data
    const { data: assessment, error: assessmentError } = await supabase
      .from("assessments")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (assessmentError || !assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 })
    }

    // Get assessment tasks
    const { data: tasks, error: tasksError } = await supabase
      .from("assessment_tasks")
      .select("*")
      .eq("assessment_id", id)

    if (tasksError) {
      return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 })
    }

    // Get speech analysis data
    const { data: speechData, error: speechError } = await supabase
      .from("speech_analysis")
      .select("*")
      .eq("assessment_id", id)

    if (speechError) {
      console.error("Speech data error:", speechError)
    }

    // Calculate cognitive scores from tasks
    const cognitiveScores = {
      memoryScore: calculateDomainScore(tasks || [], "memory_recall"),
      attentionScore: calculateDomainScore(tasks || [], "attention"),
      languageScore: calculateDomainScore(tasks || [], "language"),
      executiveScore: calculateDomainScore(tasks || [], "executive_function"),
      visuospatialScore: calculateDomainScore(tasks || [], "visuospatial"),
    }

    // Extract speech metrics
    const speechMetrics = speechData?.[0]
      ? {
          speechRate: speechData[0].speech_rate || 120,
          pauseFrequency: speechData[0].pause_frequency || 8,
          voiceTremorScore: speechData[0].voice_tremor_score || 20,
          articulationClarity: speechData[0].articulation_clarity || 85,
          semanticFluencyScore: speechData[0].semantic_fluency_score || 80,
          phonemicFluencyScore: speechData[0].phonemic_fluency_score || 75,
        }
      : {
          speechRate: 120,
          pauseFrequency: 8,
          voiceTremorScore: 20,
          articulationClarity: 85,
          semanticFluencyScore: 80,
          phonemicFluencyScore: 75,
        }

    // Get user profile for additional risk factors
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

    const additionalFactors = {
      age: profile?.date_of_birth
        ? new Date().getFullYear() - new Date(profile.date_of_birth).getFullYear()
        : undefined,
      educationLevel: profile?.education_level,
    }

    // Generate risk assessment
    const riskAssessment = DementiaRiskScorer.generateFullAssessment(cognitiveScores, speechMetrics, additionalFactors)

    // Save risk scores to database
    const { data: riskScore, error: riskError } = await supabase
      .from("risk_scores")
      .insert({
        assessment_id: id,
        cognitive_score: riskAssessment.cognitiveScore,
        speech_score: riskAssessment.speechScore,
        memory_score: riskAssessment.memoryScore,
        overall_risk_score: riskAssessment.overallRiskScore,
        risk_factors: riskAssessment.riskFactors,
        recommendations: riskAssessment.recommendations,
        confidence_level: riskAssessment.confidenceLevel,
        ai_model_version: "v1.0.0",
      })
      .select()
      .single()

    if (riskError) {
      console.error("Error saving risk scores:", riskError)
      return NextResponse.json({ error: "Failed to save risk assessment" }, { status: 500 })
    }

    // Update assessment with risk level and total score
    await supabase
      .from("assessments")
      .update({
        risk_level: riskAssessment.riskLevel,
        total_score: riskAssessment.cognitiveScore,
      })
      .eq("id", id)

    return NextResponse.json({
      success: true,
      riskAssessment,
      riskScoreId: riskScore.id,
    })
  } catch (error) {
    console.error("Error analyzing assessment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function calculateDomainScore(tasks: any[], taskType: string): number {
  const domainTasks = tasks.filter((task) => task.task_type === taskType)

  if (domainTasks.length === 0) {
    return 75 // Default score if no tasks of this type
  }

  const totalScore = domainTasks.reduce((sum, task) => sum + (task.user_score || 0), 0)
  return Math.round(totalScore / domainTasks.length)
}
