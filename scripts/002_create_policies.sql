-- Profiles policies
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_delete_own" ON public.profiles
  FOR DELETE USING (auth.uid() = id);

-- Assessments policies
CREATE POLICY "assessments_select_own" ON public.assessments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "assessments_insert_own" ON public.assessments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "assessments_update_own" ON public.assessments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "assessments_delete_own" ON public.assessments
  FOR DELETE USING (auth.uid() = user_id);

-- Assessment tasks policies
CREATE POLICY "assessment_tasks_select_own" ON public.assessment_tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.assessments 
      WHERE assessments.id = assessment_tasks.assessment_id 
      AND assessments.user_id = auth.uid()
    )
  );

CREATE POLICY "assessment_tasks_insert_own" ON public.assessment_tasks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.assessments 
      WHERE assessments.id = assessment_tasks.assessment_id 
      AND assessments.user_id = auth.uid()
    )
  );

CREATE POLICY "assessment_tasks_update_own" ON public.assessment_tasks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.assessments 
      WHERE assessments.id = assessment_tasks.assessment_id 
      AND assessments.user_id = auth.uid()
    )
  );

-- Speech analysis policies
CREATE POLICY "speech_analysis_select_own" ON public.speech_analysis
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.assessments 
      WHERE assessments.id = speech_analysis.assessment_id 
      AND assessments.user_id = auth.uid()
    )
  );

CREATE POLICY "speech_analysis_insert_own" ON public.speech_analysis
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.assessments 
      WHERE assessments.id = speech_analysis.assessment_id 
      AND assessments.user_id = auth.uid()
    )
  );

-- Risk scores policies
CREATE POLICY "risk_scores_select_own" ON public.risk_scores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.assessments 
      WHERE assessments.id = risk_scores.assessment_id 
      AND assessments.user_id = auth.uid()
    )
  );

CREATE POLICY "risk_scores_insert_own" ON public.risk_scores
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.assessments 
      WHERE assessments.id = risk_scores.assessment_id 
      AND assessments.user_id = auth.uid()
    )
  );
