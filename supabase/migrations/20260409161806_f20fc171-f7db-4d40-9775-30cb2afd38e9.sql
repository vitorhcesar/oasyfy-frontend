CREATE POLICY "Users can delete own login logs"
ON public.login_logs
FOR DELETE
TO public
USING (auth.uid() = user_id);