import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Brain, Clock, TrendingUp, FileText, User } from "lucide-react"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Get recent assessments
  const { data: assessments } = await supabase
    .from("assessments")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back, {profile?.first_name || user.email}
              </h1>
              <p className="text-gray-600">Track your cognitive health and assessment progress</p>
            </div>
            <Button asChild variant="outline">
              <Link href="/profile">
                <User className="h-4 w-4 mr-2" />
                Profile
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Assessments</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{assessments?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Completed assessments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Assessment</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {assessments?.[0] ? new Date(assessments[0].created_at).toLocaleDateString() : "None"}
              </div>
              <p className="text-xs text-muted-foreground">Most recent test</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Risk Level</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{assessments?.[0]?.risk_level || "Unknown"}</div>
              <p className="text-xs text-muted-foreground">Current assessment</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reports</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {assessments?.filter((a) => a.status === "completed").length || 0}
              </div>
              <p className="text-xs text-muted-foreground">Available reports</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Start New Assessment</CardTitle>
                <CardDescription>Choose the type of cognitive assessment you&apos;d like to take</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <Button asChild className="h-auto p-6 flex flex-col items-start bg-blue-600 hover:bg-blue-700">
                    <Link href="/assessment/cognitive">
                      <Brain className="h-8 w-8 mb-2" />
                      <div className="text-left">
                        <div className="font-semibold">Cognitive Assessment</div>
                        <div className="text-sm opacity-90">Memory, attention, and executive function tests</div>
                      </div>
                    </Link>
                  </Button>

                  <Button asChild variant="outline" className="h-auto p-6 flex flex-col items-start bg-transparent">
                    <Link href="/assessment/speech">
                      <div className="h-8 w-8 mb-2 bg-green-100 rounded flex items-center justify-center">🎤</div>
                      <div className="text-left">
                        <div className="font-semibold">Speech Analysis</div>
                        <div className="text-sm text-muted-foreground">Voice pattern and language assessment</div>
                      </div>
                    </Link>
                  </Button>

                  <Button asChild variant="outline" className="h-auto p-6 flex flex-col items-start bg-transparent">
                    <Link href="/assessment/comprehensive">
                      <div className="h-8 w-8 mb-2 bg-purple-100 rounded flex items-center justify-center">📋</div>
                      <div className="text-left">
                        <div className="font-semibold">Comprehensive Test</div>
                        <div className="text-sm text-muted-foreground">Complete cognitive and speech evaluation</div>
                      </div>
                    </Link>
                  </Button>

                  <Button asChild variant="outline" className="h-auto p-6 flex flex-col items-start bg-transparent">
                    <Link href="/results">
                      <FileText className="h-8 w-8 mb-2" />
                      <div className="text-left">
                        <div className="font-semibold">View Results</div>
                        <div className="text-sm text-muted-foreground">Review past assessments and reports</div>
                      </div>
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Recent Assessments</CardTitle>
                <CardDescription>Your latest cognitive evaluations</CardDescription>
              </CardHeader>
              <CardContent>
                {assessments && assessments.length > 0 ? (
                  <div className="space-y-4">
                    {assessments.map((assessment) => (
                      <div key={assessment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium capitalize">{assessment.assessment_type}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(assessment.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            assessment.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : assessment.status === "in_progress"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {assessment.status.replace("_", " ")}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No assessments yet. Start your first evaluation above.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
