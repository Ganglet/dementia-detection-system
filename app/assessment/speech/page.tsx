"use client"

import { AssessmentLayout } from "@/components/assessment-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState, useRef, useEffect } from "react"
import { Mic, Square, Play, RotateCcw } from "lucide-react"

interface SpeechTask {
  id: string
  name: string
  instructions: string
  prompt: string
  duration: number
  type: "reading" | "description" | "fluency" | "conversation"
}

const SPEECH_TASKS: SpeechTask[] = [
  {
    id: "reading-1",
    name: "Reading Passage",
    instructions: "Read the following passage aloud clearly and naturally.",
    prompt:
      "The quick brown fox jumps over the lazy dog. This sentence contains every letter of the alphabet. Reading aloud helps assess speech clarity, rhythm, and pronunciation patterns that may indicate cognitive changes.",
    duration: 60,
    type: "reading",
  },
  {
    id: "description-1",
    name: "Picture Description",
    instructions: "Describe what you see in detail for 2 minutes.",
    prompt:
      "Imagine you are looking at a busy park scene with children playing, people walking dogs, families having picnics, and trees providing shade. Describe everything you observe.",
    duration: 120,
    type: "description",
  },
  {
    id: "fluency-1",
    name: "Word Fluency",
    instructions: "Say as many words as you can that start with the letter 'F' in 60 seconds.",
    prompt: "Think of words that begin with 'F' and say them aloud. Examples: fish, flower, friend...",
    duration: 60,
    type: "fluency",
  },
  {
    id: "conversation-1",
    name: "Personal Story",
    instructions: "Tell a story about a memorable experience from your childhood.",
    prompt:
      "Share a favorite memory from when you were young. It could be a family vacation, a special birthday, or any experience that stands out to you.",
    duration: 180,
    type: "conversation",
  },
]

export default function SpeechAssessmentPage() {
  const [currentTask, setCurrentTask] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [assessmentId, setAssessmentId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const currentTaskData = SPEECH_TASKS[currentTask]

  useEffect(() => {
    initializeAssessment()
    requestMicrophonePermission()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
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
          assessment_type: "speech",
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

  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      setHasPermission(true)
      stream.getTracks().forEach((track) => track.stop()) // Stop the stream immediately
    } catch (error) {
      console.error("Microphone permission denied:", error)
      setHasPermission(false)
    }
  }

  const startRecording = async () => {
    if (!hasPermission) {
      await requestMicrophonePermission()
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" })
        setAudioBlob(audioBlob)
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1
          if (newTime >= currentTaskData.duration) {
            stopRecording()
            return currentTaskData.duration
          }
          return newTime
        })
      }, 1000)
    } catch (error) {
      console.error("Error starting recording:", error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  const resetRecording = () => {
    setAudioBlob(null)
    setRecordingTime(0)
    audioChunksRef.current = []
  }

  const analyzeAudio = async (audioBlob: Blob): Promise<any> => {
    // Simulate AI analysis - in a real app, this would call an AI service
    const duration = recordingTime
    const mockAnalysis = {
      speech_rate: Math.random() * 50 + 100, // 100-150 words per minute
      pause_frequency: Math.random() * 10 + 5, // 5-15 pauses per minute
      voice_tremor_score: Math.random() * 100,
      articulation_clarity: Math.random() * 100,
      semantic_fluency_score: Math.random() * 100,
      phonemic_fluency_score: Math.random() * 100,
    }

    return {
      audio_duration_seconds: duration,
      ...mockAnalysis,
      analysis_data: {
        task_type: currentTaskData.type,
        raw_metrics: mockAnalysis,
        confidence_score: Math.random() * 0.3 + 0.7, // 0.7-1.0
      },
    }
  }

  const saveTaskResponse = async () => {
    if (!assessmentId || !audioBlob) return

    setIsLoading(true)
    try {
      // Analyze the audio
      const analysisResults = await analyzeAudio(audioBlob)

      // Save speech analysis
      await supabase.from("speech_analysis").insert({
        assessment_id: assessmentId,
        ...analysisResults,
      })

      // Save task record
      await supabase.from("assessment_tasks").insert({
        assessment_id: assessmentId,
        task_type: currentTaskData.type,
        task_name: currentTaskData.name,
        instructions: currentTaskData.instructions,
        max_score: 100,
        user_score: Math.round(analysisResults.articulation_clarity),
        response_time_ms: recordingTime * 1000,
        user_response: { recording_duration: recordingTime, task_completed: true },
      })
    } catch (error) {
      console.error("Error saving speech analysis:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNext = async () => {
    if (audioBlob) {
      await saveTaskResponse()
    }

    if (currentTask < SPEECH_TASKS.length - 1) {
      setCurrentTask(currentTask + 1)
      resetRecording()
    } else {
      await completeAssessment()
    }
  }

  const completeAssessment = async () => {
    if (!assessmentId) return

    try {
      setIsLoading(true)
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
      alert("Error completing assessment. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (hasPermission === false) {
    return (
      <AssessmentLayout
        title="Speech Assessment"
        description="Analyze speech patterns and language capabilities"
        currentStep={1}
        totalSteps={1}
        showProgress={false}
      >
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Microphone Access Required</CardTitle>
            <CardDescription>We need access to your microphone to record speech samples</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-6">
              This assessment requires microphone access to analyze your speech patterns. Please allow microphone access
              when prompted by your browser.
            </p>
            <Button onClick={requestMicrophonePermission}>Request Microphone Access</Button>
          </CardContent>
        </Card>
      </AssessmentLayout>
    )
  }

  const progressValue = (recordingTime / currentTaskData.duration) * 100

  return (
    <AssessmentLayout
      title="Speech Assessment"
      description="Analyze speech patterns and language capabilities"
      currentStep={currentTask + 1}
      totalSteps={SPEECH_TASKS.length}
    >
      <Card>
        <CardHeader>
          <CardTitle>{currentTaskData.name}</CardTitle>
          <CardDescription>{currentTaskData.instructions}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium mb-2">Task Prompt:</p>
            <p>{currentTaskData.prompt}</p>
          </div>

          <div className="text-center">
            <div className="mb-4">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, "0")}
              </div>
              <div className="text-sm text-muted-foreground">
                / {Math.floor(currentTaskData.duration / 60)}:
                {(currentTaskData.duration % 60).toString().padStart(2, "0")}
              </div>
            </div>

            <Progress value={progressValue} className="mb-6" />

            <div className="flex justify-center gap-4">
              {!isRecording && !audioBlob && (
                <Button onClick={startRecording} size="lg" className="bg-red-600 hover:bg-red-700">
                  <Mic className="h-5 w-5 mr-2" />
                  Start Recording
                </Button>
              )}

              {isRecording && (
                <Button onClick={stopRecording} size="lg" variant="outline">
                  <Square className="h-5 w-5 mr-2" />
                  Stop Recording
                </Button>
              )}

              {audioBlob && !isRecording && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      const audio = new Audio(URL.createObjectURL(audioBlob))
                      audio.play()
                    }}
                    variant="outline"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Play
                  </Button>
                  <Button onClick={resetRecording} variant="outline">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Re-record
                  </Button>
                </div>
              )}
            </div>
          </div>

          {audioBlob && (
            <div className="text-center">
              <div className="p-4 bg-green-50 rounded-lg mb-4">
                <p className="text-green-800 font-medium">Recording completed successfully!</p>
                <p className="text-sm text-green-600">Duration: {recordingTime} seconds</p>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => setCurrentTask(Math.max(0, currentTask - 1))}
              disabled={currentTask === 0 || isRecording}
            >
              Previous
            </Button>
            <Button onClick={handleNext} disabled={!audioBlob || isLoading || isRecording}>
              {isLoading
                ? "Processing..."
                : currentTask === SPEECH_TASKS.length - 1
                  ? "Complete Assessment"
                  : "Next Task"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </AssessmentLayout>
  )
}
