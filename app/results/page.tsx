import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Calendar, TrendingUp, Brain, FileText, Eye } from "lucide-react"

export default async function ResultsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get all assessments for the user
  const { data: assessments } = await supabase
    .from("assessments")
    .select(`
      *,
      risk_scores (
        overall_risk_score,
        risk_level,
        confidence_level
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  const completedAssessments = assessments?.filter((a) => a.status === "completed") || []
  const inProgressAssessments = assessments?.filter((a) => a.status === "in_progress") || []

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Assessment Results</h1>
          <p className="text-gray-600">Review your cognitive health assessments and track progress over time</p>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Assessments</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{assessments?.length || 0}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedAssessments.length}</div>
              <p className="text-xs text-muted-foreground">With results</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inProgressAssessments.length}</div>
              <p className="text-xs text-muted-foreground">Pending completion</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Latest Risk Level</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{completedAssessments[0]?.risk_level || "N/A"}</div>
              <p className="text-xs text-muted-foreground">Most recent</p>
            </CardContent>
          </Card>
        </div>

        {/* Completed Assessments */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Completed Assessments</h2>
            <Button asChild>
              <Link href="/dashboard">New Assessment</Link>
            </Button>
          </div>

          {completedAssessments.length > 0 ? (
            <div className="grid gap-6">
              {completedAssessments.map((assessment) => {
                const riskScore = assessment.risk_scores?.[0]
                const riskLevel = riskScore?.risk_level || assessment.risk_level
                const riskColor =
                  riskLevel === "high"
                    ? "text-red-600"
                    : riskLevel === "moderate"
                      ? "text-yellow-600"
                      : "text-green-600"
                const riskBg =
                  riskLevel === "high"
                    ? "bg-red-50 border-red-200"
                    : riskLevel === "moderate"
                      ? "bg-yellow-50 border-yellow-200"
                      : "bg-green-50 border-green-200"

                return (
                  <Card key={assessment.id} className={`${riskBg} border-2`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Brain className="h-5 w-5" />
                            {assessment.assessment_type.charAt(0).toUpperCase() + assessment.assessment_type.slice(1)}{" "}
                            Assessment
                          </CardTitle>
                          <CardDescription className="flex items-center gap-4 mt-2">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(assessment.created_at).toLocaleDateString()}
                            </span>
                            {assessment.completed_at && (
                              <span>Completed: {new Date(assessment.completed_at).toLocaleDateString()}</span>
                            )}
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${riskColor} capitalize`}>{riskLevel}</div>
                          <div className="text-sm text-muted-foreground">Risk Level</div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <div className="font-medium">Overall Score</div>
                            <div className="text-lg">
                              {riskScore?.overall_risk_score || assessment.total_score || "N/A"}
                            </div>
                          </div>
                          <div>
                            <div className="font-medium">Confidence</div>
                            <div className="text-lg">
                              {riskScore?.confidence_level ? `${Math.round(riskScore.confidence_level * 100)}%` : "N/A"}
                            </div>
                          </div>
                          <div>
                            <div className="font-medium">Duration</div>
                            <div className="text-lg">
                              {assessment.completed_at && assessment.started_at
                                ? `${Math.round(
                                    (new Date(assessment.completed_at).getTime() -
                                      new Date(assessment.started_at).getTime()) /
                                      (1000 * 60),
                                  )} min`
                                : "N/A"}
                            </div>
                          </div>
                          <div>
                            <div className="font-medium">Status</div>
                            <div className="text-lg capitalize">{assessment.status.replace("_", " ")}</div>
                          </div>
                        </div>
                        <Button asChild>
                          <Link href={`/results/${assessment.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No completed assessments yet</h3>
                <p className="text-muted-foreground mb-4">
                  Complete your first cognitive assessment to see detailed results and risk analysis.
                </p>
                <Button asChild>
                  <Link href="/dashboard">Start Assessment</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* In Progress Assessments */}
        {inProgressAssessments.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">In Progress</h2>
            <div className="grid gap-4">
              {inProgressAssessments.map((assessment) => (
                <Card key={assessment.id}>
                  <CardContent className="flex items-center justify-between p-6">
                    <div>
                      <h3 className="font-semibold capitalize">{assessment.assessment_type} Assessment</h3>
                      <p className="text-sm text-muted-foreground">
                        Started: {new Date(assessment.started_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button asChild variant="outline">
                      <Link href={`/assessment/${assessment.assessment_type}`}>Continue</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
