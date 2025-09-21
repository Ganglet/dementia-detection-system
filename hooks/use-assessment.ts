"use client"

import { createClient } from "@/lib/supabase/client"
import { useState, useEffect } from "react"

interface Assessment {
  id: string
  user_id: string
  assessment_type: string
  status: string
  started_at: string
  completed_at?: string
  total_score?: number
  risk_level?: string
  created_at: string
  assessment_tasks?: any[]
  speech_analysis?: any[]
  risk_scores?: any[]
}

export function useAssessment(assessmentId: string) {
  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (assessmentId) {
      fetchAssessment()
    }
  }, [assessmentId])

  const fetchAssessment = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/assessments/${assessmentId}`)

      if (!response.ok) {
        throw new Error("Failed to fetch assessment")
      }

      const data = await response.json()
      setAssessment(data.assessment)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const analyzeAssessment = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/assessments/${assessmentId}/analyze`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to analyze assessment")
      }

      const data = await response.json()
      await fetchAssessment() // Refresh assessment data
      return data.riskAssessment
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed")
      throw err
    } finally {
      setLoading(false)
    }
  }

  const updateAssessment = async (updates: Partial<Assessment>) => {
    try {
      const response = await fetch(`/api/assessments/${assessmentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error("Failed to update assessment")
      }

      const data = await response.json()
      setAssessment(data.assessment)
      return data.assessment
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed")
      throw err
    }
  }

  return {
    assessment,
    loading,
    error,
    refetch: fetchAssessment,
    analyzeAssessment,
    updateAssessment,
  }
}
