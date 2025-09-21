-- Create users profile table for patient information
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  education_level TEXT,
  primary_language TEXT DEFAULT 'english',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create assessments table to store cognitive test sessions
CREATE TABLE IF NOT EXISTS public.assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_type TEXT NOT NULL CHECK (assessment_type IN ('cognitive', 'speech', 'memory', 'comprehensive')),
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'cancelled')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  total_score DECIMAL(5,2),
  risk_level TEXT CHECK (risk_level IN ('low', 'moderate', 'high')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create assessment_tasks table for individual cognitive tasks
CREATE TABLE IF NOT EXISTS public.assessment_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL CHECK (task_type IN ('memory_recall', 'word_fluency', 'attention', 'executive_function', 'language', 'visuospatial')),
  task_name TEXT NOT NULL,
  instructions TEXT,
  max_score INTEGER NOT NULL DEFAULT 100,
  user_score INTEGER,
  response_time_ms INTEGER,
  user_response JSONB,
  correct_answer JSONB,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create speech_analysis table for speech pattern data
CREATE TABLE IF NOT EXISTS public.speech_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  audio_duration_seconds INTEGER,
  speech_rate DECIMAL(5,2), -- words per minute
  pause_frequency DECIMAL(5,2),
  voice_tremor_score DECIMAL(5,2),
  articulation_clarity DECIMAL(5,2),
  semantic_fluency_score DECIMAL(5,2),
  phonemic_fluency_score DECIMAL(5,2),
  analysis_data JSONB, -- detailed AI analysis results
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create risk_scores table for AI-generated risk assessments
CREATE TABLE IF NOT EXISTS public.risk_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  cognitive_score DECIMAL(5,2) NOT NULL,
  speech_score DECIMAL(5,2),
  memory_score DECIMAL(5,2),
  overall_risk_score DECIMAL(5,2) NOT NULL,
  risk_factors JSONB, -- array of identified risk factors
  recommendations TEXT[],
  confidence_level DECIMAL(3,2) CHECK (confidence_level >= 0 AND confidence_level <= 1),
  ai_model_version TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.speech_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_scores ENABLE ROW LEVEL SECURITY;
