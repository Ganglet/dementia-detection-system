"use client"

import { AssessmentLayout } from "@/components/assessment-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Clock, SkipForward } from "lucide-react"

interface CognitiveTask {
  id: string
  type: string
  name: string
  instructions: string
  question: string
  options?: string[]
  correctAnswer?: string
  timeLimit?: number
}

const COGNITIVE_TASKS: CognitiveTask[] = [
  {
    id: "memory-1",
    type: "memory_recall",
    name: "Word List Memory",
    instructions: "Study the following words for 30 seconds, then recall as many as possible.",
    question: "Please type the words you remember (separated by commas):",
    correctAnswer: "apple,chair,ocean,guitar,mountain,library,butterfly,telescope",
    timeLimit: 30,
  },
  {
    id: "attention-1",
    type: "attention",
    name: "Number Sequence",
    instructions: "What comes next in this sequence?",
    question: "2, 4, 8, 16, 32, ?",
    options: ["48", "64", "96", "128"],
    correctAnswer: "64",
  },
  {
    id: "language-1",
    type: "language",
    name: "Word Fluency",
    instructions: "Name as many animals as you can in 60 seconds.",
    question: "Type animal names (separated by commas):",
    timeLimit: 60,
  },
  {
    id: "executive-1",
    type: "executive_function",
    name: "Problem Solving",
    instructions: "Solve this logic problem.",
    question: "If all roses are flowers, and some flowers are red, which statement must be true?",
    options: ["All roses are red", "Some roses might be red", "No roses are red", "All flowers are roses"],
    correctAnswer: "Some roses might be red",
  },
  {
    id: "visuospatial-1",
    type: "visuospatial",
    name: "Pattern Recognition",
    instructions: "Which shape completes the pattern?",
    question: "Circle, Square, Triangle, Circle, Square, ?",
    options: ["Circle", "Square", "Triangle", "Diamond"],
    correctAnswer: "Triangle",
  },
]

export default function CognitiveAssessmentPage() {
  const [currentTask, setCurrentTask] = useState(0)
  const [responses, setResponses] = useState<Record<string, string>>({})
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [isStudyPhase, setIsStudyPhase] = useState(false)
  const [studyPhaseCompleted, setStudyPhaseCompleted] = useState(false)
  const [assessmentId, setAssessmentId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const currentTaskData = COGNITIVE_TASKS[currentTask]

  useEffect(() => {
    initializeAssessment()
  }, [])

  useEffect(() => {
    if (timeLeft !== null && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0) {
      if (isStudyPhase) {
        setIsStudyPhase(false)
        setStudyPhaseCompleted(true)
        setTimeLeft(null)
      } else {
        handleNext()
      }
    }
  }, [timeLeft, isStudyPhase])

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
          assessment_type: "cognitive",
          status: "in_progress",
        })
        .select()
        .single()

      if (error) throw error
      setAssessmentId(data.id)
    } catch (error) {
      console.error("Error initializing assessment:", error)
    }
  }

  const startStudyPhase = () => {
    setIsStudyPhase(true)
    setTimeLeft(currentTaskData.timeLimit || 30)
  }

  const skipTimer = () => {
    if (isStudyPhase) {
      setIsStudyPhase(false)
      setStudyPhaseCompleted(true)
      setTimeLeft(null)
    } else {
      setTimeLeft(null)
    }
  }

  const handleResponse = (value: string) => {
    setResponses({ ...responses, [currentTaskData.id]: value })
  }

  const saveTaskResponse = async () => {
    if (!assessmentId) return

    const response = responses[currentTaskData.id] || ""
    const isCorrect = currentTaskData.correctAnswer
      ? response.toLowerCase().trim() === currentTaskData.correctAnswer.toLowerCase()
      : null

    try {
      await supabase.from("assessment_tasks").insert({
        assessment_id: assessmentId,
        task_type: currentTaskData.type,
        task_name: currentTaskData.name,
        instructions: currentTaskData.instructions,
        max_score: 100,
        user_score: isCorrect ? 100 : 0,
        user_response: { answer: response },
        correct_answer: { answer: currentTaskData.correctAnswer },
      })
    } catch (error) {
      console.error("Error saving task response:", error)
    }
  }

  const handleNext = async () => {
    setIsLoading(true)
    await saveTaskResponse()

    if (currentTask < COGNITIVE_TASKS.length - 1) {
      setCurrentTask(currentTask + 1)
      setTimeLeft(null)
      setIsStudyPhase(false)
      setStudyPhaseCompleted(false)
    } else {
      await completeAssessment()
    }
    setIsLoading(false)
  }

  const completeAssessment = async () => {
    if (!assessmentId) return

    try {
      await supabase
        .from("assessments")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", assessmentId)

      const comprehensiveId = localStorage.getItem("comprehensiveAssessmentId")
      if (comprehensiveId) {
        localStorage.removeItem("comprehensiveAssessmentId")
        router.push("/assessment/comprehensive")
      } else {
        router.push(`/results/${assessmentId}`)
      }
    } catch (error) {
      console.error("Error completing assessment:", error)
    }
  }

  const renderStudyPhase = () => (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Clock className="h-5 w-5" />
          Study Phase
        </CardTitle>
        <CardDescription>Memorize these words</CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="text-6xl font-bold text-blue-600">{timeLeft}</div>
          <Button variant="outline" size="sm" onClick={skipTimer} className="flex items-center gap-2 bg-transparent">
            <SkipForward className="h-4 w-4" />
            Skip Timer
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xl font-medium">
          {currentTaskData.correctAnswer?.split(",").map((word, index) => (
            <div key={index} className="p-4 bg-blue-50 rounded-lg">
              {word}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  const renderTask = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {currentTaskData.name}
          {timeLeft !== null && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-orange-600">
                <Clock className="h-4 w-4" />
                {timeLeft}s
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={skipTimer}
                className="flex items-center gap-1 bg-transparent"
              >
                <SkipForward className="h-3 w-3" />
                Skip
              </Button>
            </div>
          )}
        </CardTitle>
        <CardDescription>{currentTaskData.instructions}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-lg font-medium">{currentTaskData.question}</div>

        {currentTaskData.options ? (
          <RadioGroup value={responses[currentTaskData.id] || ""} onValueChange={(value) => handleResponse(value)}>
            {currentTaskData.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`} className="text-base">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        ) : (
          <div>
            <Label htmlFor="response">Your Answer:</Label>
            <Input
              id="response"
              value={responses[currentTaskData.id] || ""}
              onChange={(e) => handleResponse(e.target.value)}
              placeholder="Type your answer here..."
              className="mt-2"
            />
          </div>
        )}

        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={() => setCurrentTask(Math.max(0, currentTask - 1))}
            disabled={currentTask === 0}
          >
            Previous
          </Button>
          <Button
            onClick={handleNext}
            disabled={
              isLoading ||
              (currentTaskData.type !== "memory_recall" && !responses[currentTaskData.id]) ||
              (currentTaskData.type === "memory_recall" && isStudyPhase)
            }
          >
            {isLoading ? "Saving..." : currentTask === COGNITIVE_TASKS.length - 1 ? "Complete Assessment" : "Next"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  if (
    currentTaskData.type === "memory_recall" &&
    timeLeft === null &&
    !responses[currentTaskData.id] &&
    !isStudyPhase &&
    !studyPhaseCompleted
  ) {
    return (
      <AssessmentLayout
        title="Cognitive Assessment"
        description="Complete a series of cognitive tasks to evaluate memory, attention, and executive function"
        currentStep={currentTask + 1}
        totalSteps={COGNITIVE_TASKS.length}
      >
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Memory Test Instructions</CardTitle>
            <CardDescription>You will have 30 seconds to study a list of words</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-6">
              In the next phase, you&apos;ll see a list of 8 words. Study them carefully for 30 seconds, then
              you&apos;ll be asked to recall as many as possible.
            </p>
            <Button onClick={startStudyPhase} size="lg">
              Start Study Phase
            </Button>
          </CardContent>
        </Card>
      </AssessmentLayout>
    )
  }

  return (
    <AssessmentLayout
      title="Cognitive Assessment"
      description="Complete a series of cognitive tasks to evaluate memory, attention, and executive function"
      currentStep={currentTask + 1}
      totalSteps={COGNITIVE_TASKS.length}
    >
      {isStudyPhase ? renderStudyPhase() : renderTask()}
    </AssessmentLayout>
  )
}
