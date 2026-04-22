DROP POLICY "Sellers can update own pending kyc" ON public.kyc_submissions;

CREATE POLICY "Sellers can update own kyc for resubmission"
ON public.kyc_submissions
FOR UPDATE
USING (
  auth.uid() = user_id
  AND (
    status = 'pending'
    OR documents_status = 'rejected'
    OR bank_status = 'rejected'
    OR address_status = 'rejected'
  )
);