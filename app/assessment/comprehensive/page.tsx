"use client"

import type React from "react"

import { AssessmentLayout } from "@/components/assessment-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Brain, Mic, CheckCircle, Clock } from "lucide-react"

interface AssessmentPhase {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  route: string
  duration: string
  completed: boolean
}

export default function ComprehensiveAssessmentPage() {
  const [currentPhase, setCurrentPhase] = useState(0)
  const [assessmentId, setAssessmentId] = useState<string | null>(null)
  const [cognitiveCompleted, setCognitiveCompleted] = useState(false)
  const [speechCompleted, setSpeechCompleted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const phases: AssessmentPhase[] = [
    {
      id: "cognitive",
      name: "Cognitive Assessment",
      description: "Memory, attention, language, executive function, and visuospatial tests",
      icon: <Brain className="h-8 w-8" />,
      route: "/assessment/cognitive",
      duration: "15-20 minutes",
      completed: cognitiveCompleted,
    },
    {
      id: "speech",
      name: "Speech Analysis",
      description: "Voice pattern analysis and language fluency evaluation",
      icon: <Mic className="h-8 w-8" />,
      route: "/assessment/speech",
      duration: "10-15 minutes",
      completed: speechCompleted,
    },
  ]

  useEffect(() => {
    initializeAssessment()
    checkCompletedPhases()
  }, [])

  const initializeAssessment = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from("assessments")
        .insert({
          user_id: user.id,
          assessment_type: "comprehensive",
          status: "in_progress",
        })
        .select()
        .single()

      if (error) throw error
      setAssessmentId(data.id)
    } catch (error) {
      console.error("Error initializing comprehensive assessment:", error)
    }
  }

  const checkCompletedPhases = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Check for recent completed assessments
      const { data: recentAssessments } = await supabase
        .from("assessments")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
        .order("created_at", { ascending: false })

      if (recentAssessments) {
        const hasCognitive = recentAssessments.some((a) => a.assessment_type === "cognitive")
        const hasSpeech = recentAssessments.some((a) => a.assessment_type === "speech")

        setCognitiveCompleted(hasCognitive)
        setSpeechCompleted(hasSpeech)

        // Move to next phase if current is completed
        if (hasCognitive && currentPhase === 0) {
          setCurrentPhase(1)
        }
      }
    } catch (error) {
      console.error("Error checking completed phases:", error)
    }
  }

  const startPhase = (phaseIndex: number) => {
    const phase = phases[phaseIndex]
    // Store comprehensive assessment ID in localStorage for child assessments
    if (assessmentId) {
      localStorage.setItem("comprehensiveAssessmentId", assessmentId)
    }
    router.push(phase.route)
  }

  const completeComprehensiveAssessment = async () => {
    if (!assessmentId) return

    setIsLoading(true)
    try {
      await supabase
        .from("assessments")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", assessmentId)

      router.push(`/results/${assessmentId}`)
    } catch (error) {
      console.error("Error completing comprehensive assessment:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const allPhasesCompleted = cognitiveCompleted && speechCompleted
  const progressValue = (((cognitiveCompleted ? 1 : 0) + (speechCompleted ? 1 : 0)) / phases.length) * 100

  return (
    <AssessmentLayout
      title="Comprehensive Assessment"
      description="Complete cognitive and speech evaluation for thorough dementia risk screening"
      currentStep={currentPhase + 1}
      totalSteps={phases.length}
    >
      <div className="space-y-6">
        {/* Progress Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Assessment Progress
            </CardTitle>
            <CardDescription>Complete both phases for comprehensive evaluation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Overall Progress</span>
                <span>{Math.round(progressValue)}% Complete</span>
              </div>
              <Progress value={progressValue} className="h-3" />
            </div>
            <div className="text-sm text-muted-foreground">
              {allPhasesCompleted
                ? "All phases completed! Ready to generate comprehensive report."
                : `${cognitiveCompleted ? 1 : 0} of ${phases.length} phases completed`}
            </div>
          </CardContent>
        </Card>

        {/* Assessment Phases */}
        <div className="grid gap-4">
          {phases.map((phase, index) => (
            <Card key={phase.id} className={`transition-all ${phase.completed ? "bg-green-50 border-green-200" : ""}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-3 rounded-lg ${phase.completed ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"}`}
                    >
                      {phase.completed ? <CheckCircle className="h-8 w-8" /> : phase.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{phase.name}</CardTitle>
                      <CardDescription className="mt-1">{phase.description}</CardDescription>
                      <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{phase.duration}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {phase.completed ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-medium">Completed</span>
                      </div>
                    ) : (
                      <Button
                        onClick={() => startPhase(index)}
                        className={index === currentPhase ? "bg-blue-600 hover:bg-blue-700" : ""}
                        variant={index === currentPhase ? "default" : "outline"}
                      >
                        {index === currentPhase ? "Start Now" : "Begin Phase"}
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Completion Card */}
        {allPhasesCompleted && (
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">Assessment Complete!</CardTitle>
              <CardDescription className="text-blue-700">
                All phases have been completed. Generate your comprehensive report to view detailed results and
                recommendations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={completeComprehensiveAssessment}
                disabled={isLoading}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? "Generating Report..." : "Generate Comprehensive Report"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        {!allPhasesCompleted && (
          <Card>
            <CardHeader>
              <CardTitle>Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                  1
                </div>
                <div>
                  <p className="font-medium">Complete Cognitive Assessment</p>
                  <p className="text-sm text-muted-foreground">
                    Take memory, attention, language, executive function, and visuospatial tests
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                  2
                </div>
                <div>
                  <p className="font-medium">Complete Speech Analysis</p>
                  <p className="text-sm text-muted-foreground">
                    Record speech samples for voice pattern and language fluency analysis
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                  3
                </div>
                <div>
                  <p className="font-medium">Review Comprehensive Report</p>
                  <p className="text-sm text-muted-foreground">
                    Get detailed analysis combining all assessment data with AI-powered insights
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AssessmentLayout>
  )
}
