"use client"

import { useAssessment } from "@/hooks/use-assessment"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowLeft,
  Download,
  Share,
  Mic,
  FileText,
} from "lucide-react"

export default function AssessmentResultPage() {
  const params = useParams()
  const router = useRouter()
  const assessmentId = params.id as string
  const { assessment, loading, error, analyzeAssessment } = useAssessment(assessmentId)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  useEffect(() => {
    // If assessment is completed but no risk scores, trigger analysis
    if (
      assessment &&
      assessment.status === "completed" &&
      (!assessment.risk_scores || assessment.risk_scores.length === 0)
    ) {
      handleAnalyze()
    }
  }, [assessment])

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    try {
      await analyzeAssessment()
    } catch (error) {
      console.error("Analysis failed:", error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assessment results...</p>
        </div>
      </div>
    )
  }

  if (error || !assessment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Assessment Not Found</h2>
            <p className="text-muted-foreground mb-4">{error || "The requested assessment could not be found."}</p>
            <Button asChild>
              <Link href="/results">Back to Results</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const riskScore = assessment.risk_scores?.[0]
  const riskLevel = riskScore?.risk_level || assessment.risk_level
  const isAnalyzed = riskScore && riskScore.overall_risk_score !== null

  const getRiskColor = (level: string) => {
    switch (level) {
      case "high":
        return "text-red-600"
      case "moderate":
        return "text-yellow-600"
      case "low":
        return "text-green-600"
      default:
        return "text-gray-600"
    }
  }

  const getRiskBadgeVariant = (level: string) => {
    switch (level) {
      case "high":
        return "destructive"
      case "moderate":
        return "secondary"
      case "low":
        return "default"
      default:
        return "outline"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/results">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Results
              </Link>
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              <Button variant="outline" size="sm">
                <Share className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Assessment Results</h1>
          <p className="text-gray-600">
            {assessment.assessment_type.charAt(0).toUpperCase() + assessment.assessment_type.slice(1)} Assessment •{" "}
            {new Date(assessment.created_at).toLocaleDateString()}
          </p>
        </div>

        {/* Analysis Status */}
        {!isAnalyzed && assessment.status === "completed" && (
          <Card className="mb-8 border-blue-200 bg-blue-50">
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <h3 className="font-semibold text-blue-900">Analysis Required</h3>
                <p className="text-blue-700">Generate AI-powered risk assessment and recommendations</p>
              </div>
              <Button onClick={handleAnalyze} disabled={isAnalyzing} className="bg-blue-600 hover:bg-blue-700">
                {isAnalyzing ? "Analyzing..." : "Analyze Results"}
              </Button>
            </CardContent>
          </Card>
        )}

        {isAnalyzed && (
          <>
            {/* Risk Overview */}
            <div className="grid lg:grid-cols-3 gap-6 mb-8">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Risk Assessment Overview
                  </CardTitle>
                  <CardDescription>AI-generated analysis based on your assessment performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className={`text-4xl font-bold ${getRiskColor(riskLevel)} mb-2`}>
                        {riskLevel?.charAt(0).toUpperCase() + riskLevel?.slice(1)}
                      </div>
                      <div className="text-sm text-muted-foreground">Risk Level</div>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-blue-600 mb-2">{riskScore?.overall_risk_score}</div>
                      <div className="text-sm text-muted-foreground">Overall Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-purple-600 mb-2">
                        {Math.round((riskScore?.confidence_level || 0) * 100)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Confidence</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Domain Scores
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Cognitive</span>
                    <div className="flex items-center gap-2">
                      <Progress value={riskScore?.cognitive_score || 0} className="w-20" />
                      <span className="text-sm font-bold w-8">{riskScore?.cognitive_score}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Memory</span>
                    <div className="flex items-center gap-2">
                      <Progress value={riskScore?.memory_score || 0} className="w-20" />
                      <span className="text-sm font-bold w-8">{riskScore?.memory_score}</span>
                    </div>
                  </div>
                  {riskScore?.speech_score && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Speech</span>
                      <div className="flex items-center gap-2">
                        <Progress value={riskScore.speech_score} className="w-20" />
                        <span className="text-sm font-bold w-8">{riskScore.speech_score}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Risk Factors */}
            {riskScore?.risk_factors && riskScore.risk_factors.length > 0 && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Identified Risk Factors
                  </CardTitle>
                  <CardDescription>Factors that may indicate increased dementia risk</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {riskScore.risk_factors.map((factor, index) => (
                      <Badge key={index} variant={getRiskBadgeVariant(riskLevel)}>
                        {factor}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            {riskScore?.recommendations && riskScore.recommendations.length > 0 && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Recommendations
                  </CardTitle>
                  <CardDescription>Personalized recommendations based on your assessment</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {riskScore.recommendations.map((recommendation, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm">{recommendation}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Assessment Details */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Tasks Performance */}
          {assessment.assessment_tasks && assessment.assessment_tasks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Task Performance
                </CardTitle>
                <CardDescription>Detailed breakdown of individual tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {assessment.assessment_tasks.map((task, index) => (
                    <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">{task.task_name}</div>
                        <div className="text-sm text-muted-foreground capitalize">
                          {task.task_type.replace("_", " ")}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">
                          {task.user_score || 0}/{task.max_score}
                        </div>
                        {task.response_time_ms && (
                          <div className="text-sm text-muted-foreground">
                            {Math.round(task.response_time_ms / 1000)}s
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Speech Analysis */}
          {assessment.speech_analysis && assessment.speech_analysis.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="h-5 w-5" />
                  Speech Analysis
                </CardTitle>
                <CardDescription>Voice pattern and language assessment results</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {assessment.speech_analysis.map((speech, index) => (
                    <div key={speech.id} className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="font-medium">Speech Rate</div>
                          <div>{speech.speech_rate} wpm</div>
                        </div>
                        <div>
                          <div className="font-medium">Pause Frequency</div>
                          <div>{speech.pause_frequency}/min</div>
                        </div>
                        <div>
                          <div className="font-medium">Articulation</div>
                          <div>{Math.round(speech.articulation_clarity)}%</div>
                        </div>
                        <div>
                          <div className="font-medium">Duration</div>
                          <div>{speech.audio_duration_seconds}s</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Assessment Metadata */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Assessment Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="font-medium">Started</div>
                <div>{new Date(assessment.started_at).toLocaleString()}</div>
              </div>
              {assessment.completed_at && (
                <div>
                  <div className="font-medium">Completed</div>
                  <div>{new Date(assessment.completed_at).toLocaleString()}</div>
                </div>
              )}
              <div>
                <div className="font-medium">Type</div>
                <div className="capitalize">{assessment.assessment_type}</div>
              </div>
              <div>
                <div className="font-medium">Status</div>
                <div className="capitalize">{assessment.status.replace("_", " ")}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
