"use client"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Home } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"

interface AssessmentLayoutProps {
  children: ReactNode
  title: string
  description: string
  currentStep: number
  totalSteps: number
  onBack?: () => void
  showProgress?: boolean
}

export function AssessmentLayout({
  children,
  title,
  description,
  currentStep,
  totalSteps,
  onBack,
  showProgress = true,
}: AssessmentLayoutProps) {
  const progressValue = (currentStep / totalSteps) * 100

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              {onBack ? (
                <Button variant="ghost" size="sm" onClick={onBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              ) : (
                <Button asChild variant="ghost" size="sm">
                  <Link href="/dashboard">
                    <Home className="h-4 w-4 mr-2" />
                    Dashboard
                  </Link>
                </Button>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              Step {currentStep} of {totalSteps}
            </div>
          </div>

          {showProgress && (
            <div className="mb-6">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Progress</span>
                <span>{Math.round(progressValue)}% Complete</span>
              </div>
              <Progress value={progressValue} className="h-2" />
            </div>
          )}

          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">{description}</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">{children}</div>
      </div>
    </div>
  )
}
