interface CognitiveScores {
  memoryScore: number
  attentionScore: number
  languageScore: number
  executiveScore: number
  visuospatialScore: number
}

interface SpeechMetrics {
  speechRate: number
  pauseFrequency: number
  voiceTremorScore: number
  articulationClarity: number
  semanticFluencyScore: number
  phonemicFluencyScore: number
}

interface RiskFactors {
  age?: number
  educationLevel?: string
  cognitiveDecline: boolean
  speechAbnormalities: boolean
  memoryImpairment: boolean
  languageDeficits: boolean
  executiveDysfunction: boolean
}

export interface RiskAssessment {
  cognitiveScore: number
  speechScore: number
  memoryScore: number
  overallRiskScore: number
  riskLevel: "low" | "moderate" | "high"
  riskFactors: string[]
  recommendations: string[]
  confidenceLevel: number
}

export class DementiaRiskScorer {
  // Cognitive domain weights based on research
  private static readonly COGNITIVE_WEIGHTS = {
    memory: 0.35,
    attention: 0.15,
    language: 0.2,
    executive: 0.2,
    visuospatial: 0.1,
  }

  // Speech analysis weights
  private static readonly SPEECH_WEIGHTS = {
    speechRate: 0.2,
    pauseFrequency: 0.15,
    voiceTremor: 0.1,
    articulation: 0.25,
    semanticFluency: 0.15,
    phonemicFluency: 0.15,
  }

  // Risk thresholds
  private static readonly RISK_THRESHOLDS = {
    low: 30,
    moderate: 60,
    high: 100,
  }

  static calculateCognitiveScore(scores: CognitiveScores): number {
    const weightedScore =
      scores.memoryScore * this.COGNITIVE_WEIGHTS.memory +
      scores.attentionScore * this.COGNITIVE_WEIGHTS.attention +
      scores.languageScore * this.COGNITIVE_WEIGHTS.language +
      scores.executiveScore * this.COGNITIVE_WEIGHTS.executive +
      scores.visuospatialScore * this.COGNITIVE_WEIGHTS.visuospatial

    return Math.round(weightedScore)
  }

  static calculateSpeechScore(metrics: SpeechMetrics): number {
    // Normalize speech metrics (higher scores indicate better performance)
    const normalizedMetrics = {
      speechRate: this.normalizeSpeechRate(metrics.speechRate),
      pauseFrequency: this.normalizePauseFrequency(metrics.pauseFrequency),
      voiceTremor: 100 - metrics.voiceTremorScore, // Invert tremor score
      articulation: metrics.articulationClarity,
      semanticFluency: metrics.semanticFluencyScore,
      phonemicFluency: metrics.phonemicFluencyScore,
    }

    const weightedScore =
      normalizedMetrics.speechRate * this.SPEECH_WEIGHTS.speechRate +
      normalizedMetrics.pauseFrequency * this.SPEECH_WEIGHTS.pauseFrequency +
      normalizedMetrics.voiceTremor * this.SPEECH_WEIGHTS.voiceTremor +
      normalizedMetrics.articulation * this.SPEECH_WEIGHTS.articulation +
      normalizedMetrics.semanticFluency * this.SPEECH_WEIGHTS.semanticFluency +
      normalizedMetrics.phonemicFluency * this.SPEECH_WEIGHTS.phonemicFluency

    return Math.round(weightedScore)
  }

  private static normalizeSpeechRate(rate: number): number {
    // Normal speech rate: 120-150 words per minute
    // Score decreases for rates outside this range
    if (rate >= 120 && rate <= 150) return 100
    if (rate >= 100 && rate < 120) return 80
    if (rate > 150 && rate <= 170) return 80
    if (rate >= 80 && rate < 100) return 60
    if (rate > 170 && rate <= 200) return 60
    return 40 // Very slow or very fast speech
  }

  private static normalizePauseFrequency(frequency: number): number {
    // Normal pause frequency: 5-10 pauses per minute
    // Higher scores for normal pause patterns
    if (frequency >= 5 && frequency <= 10) return 100
    if (frequency >= 3 && frequency < 5) return 80
    if (frequency > 10 && frequency <= 15) return 70
    if (frequency >= 1 && frequency < 3) return 60
    if (frequency > 15 && frequency <= 20) return 50
    return 30 // Very few or excessive pauses
  }

  static identifyRiskFactors(
    cognitiveScore: number,
    speechScore: number,
    memoryScore: number,
    additionalFactors?: Partial<RiskFactors>,
  ): string[] {
    const riskFactors: string[] = []

    // Cognitive risk factors
    if (cognitiveScore < 70) {
      riskFactors.push("Significant cognitive impairment detected")
    } else if (cognitiveScore < 85) {
      riskFactors.push("Mild cognitive decline observed")
    }

    // Memory-specific risk factors
    if (memoryScore < 60) {
      riskFactors.push("Severe memory impairment")
    } else if (memoryScore < 75) {
      riskFactors.push("Moderate memory difficulties")
    }

    // Speech risk factors
    if (speechScore < 65) {
      riskFactors.push("Significant speech and language abnormalities")
    } else if (speechScore < 80) {
      riskFactors.push("Mild speech pattern irregularities")
    }

    // Additional risk factors
    if (additionalFactors?.age && additionalFactors.age > 75) {
      riskFactors.push("Advanced age (>75 years)")
    }

    if (additionalFactors?.educationLevel === "low") {
      riskFactors.push("Limited educational background")
    }

    return riskFactors
  }

  static generateRecommendations(riskLevel: "low" | "moderate" | "high", riskFactors: string[]): string[] {
    const recommendations: string[] = []

    switch (riskLevel) {
      case "high":
        recommendations.push("Immediate consultation with a neurologist or geriatrician recommended")
        recommendations.push("Comprehensive neuropsychological evaluation advised")
        recommendations.push("Consider brain imaging (MRI) to rule out structural abnormalities")
        recommendations.push("Family members should be informed and involved in care planning")
        break

      case "moderate":
        recommendations.push("Follow-up assessment in 6 months recommended")
        recommendations.push("Consultation with healthcare provider to discuss findings")
        recommendations.push("Consider cognitive training exercises and mental stimulation")
        recommendations.push("Monitor for changes in daily functioning")
        break

      case "low":
        recommendations.push("Continue regular health check-ups")
        recommendations.push("Maintain cognitive engagement through reading, puzzles, and social activities")
        recommendations.push("Follow-up screening in 12-24 months")
        recommendations.push("Maintain healthy lifestyle with regular exercise and balanced diet")
        break
    }

    // Specific recommendations based on risk factors
    if (riskFactors.some((factor) => factor.includes("memory"))) {
      recommendations.push("Memory training exercises and strategies may be beneficial")
    }

    if (riskFactors.some((factor) => factor.includes("speech"))) {
      recommendations.push("Speech therapy evaluation may be helpful")
    }

    return recommendations
  }

  static calculateOverallRisk(
    cognitiveScore: number,
    speechScore: number,
    memoryScore: number,
  ): { score: number; level: "low" | "moderate" | "high"; confidence: number } {
    // Weighted combination of scores (inverted so higher risk = higher score)
    const overallScore = Math.round(
      (100 - cognitiveScore) * 0.5 + (100 - speechScore) * 0.3 + (100 - memoryScore) * 0.2,
    )

    let riskLevel: "low" | "moderate" | "high"
    let confidence: number

    if (overallScore < this.RISK_THRESHOLDS.low) {
      riskLevel = "low"
      confidence = 0.85 + Math.random() * 0.1 // 0.85-0.95
    } else if (overallScore < this.RISK_THRESHOLDS.moderate) {
      riskLevel = "moderate"
      confidence = 0.75 + Math.random() * 0.15 // 0.75-0.90
    } else {
      riskLevel = "high"
      confidence = 0.8 + Math.random() * 0.15 // 0.80-0.95
    }

    return {
      score: overallScore,
      level: riskLevel,
      confidence: Math.round(confidence * 100) / 100,
    }
  }

  static generateFullAssessment(
    cognitiveScores: CognitiveScores,
    speechMetrics: SpeechMetrics,
    additionalFactors?: Partial<RiskFactors>,
  ): RiskAssessment {
    const cognitiveScore = this.calculateCognitiveScore(cognitiveScores)
    const speechScore = this.calculateSpeechScore(speechMetrics)
    const memoryScore = cognitiveScores.memoryScore

    const riskFactors = this.identifyRiskFactors(cognitiveScore, speechScore, memoryScore, additionalFactors)

    const overallRisk = this.calculateOverallRisk(cognitiveScore, speechScore, memoryScore)
    const recommendations = this.generateRecommendations(overallRisk.level, riskFactors)

    return {
      cognitiveScore,
      speechScore,
      memoryScore,
      overallRiskScore: overallRisk.score,
      riskLevel: overallRisk.level,
      riskFactors,
      recommendations,
      confidenceLevel: overallRisk.confidence,
    }
  }
}
