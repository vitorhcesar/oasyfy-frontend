
-- Create KYC status enum
CREATE TYPE public.kyc_status AS ENUM ('pending', 'under_review', 'approved', 'rejected');
CREATE TYPE public.person_type AS ENUM ('pf', 'pj');

-- Create KYC submissions table
CREATE TABLE public.kyc_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  status kyc_status NOT NULL DEFAULT 'pending',
  person_type person_type NOT NULL,
  
  -- Personal info (PF & PJ)
  full_name TEXT NOT NULL,
  cpf TEXT,
  date_of_birth DATE,
  phone TEXT,
  
  -- Business info (PJ only)
  company_name TEXT,
  cnpj TEXT,
  trading_name TEXT,
  business_activity TEXT,
  monthly_revenue TEXT,
  
  -- Address
  zip_code TEXT NOT NULL,
  street TEXT NOT NULL,
  number TEXT NOT NULL,
  complement TEXT,
  neighborhood TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  
  -- Documents URLs
  document_front_url TEXT,
  document_back_url TEXT,
  selfie_url TEXT,
  proof_of_address_url TEXT,
  company_contract_url TEXT,
  
  -- Admin review
  rejection_reason TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.kyc_submissions ENABLE ROW LEVEL SECURITY;

-- Sellers can view their own KYC
CREATE POLICY "Sellers can view own kyc"
  ON public.kyc_submissions FOR SELECT
  USING (auth.uid() = user_id);

-- Sellers can insert their own KYC
CREATE POLICY "Sellers can insert own kyc"
  ON public.kyc_submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Sellers can update their own pending KYC
CREATE POLICY "Sellers can update own pending kyc"
  ON public.kyc_submissions FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

-- Admins can view all KYC
CREATE POLICY "Admins can view all kyc"
  ON public.kyc_submissions FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Admins can update KYC status
CREATE POLICY "Admins can update kyc"
  ON public.kyc_submissions FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- Timestamp trigger
CREATE TRIGGER update_kyc_updated_at
  BEFORE UPDATE ON public.kyc_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for KYC documents
INSERT INTO storage.buckets (id, name, public) VALUES ('kyc-documents', 'kyc-documents', false);

-- Storage policies
CREATE POLICY "Users can upload own kyc docs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own kyc docs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all kyc docs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'kyc-documents' AND has_role(auth.uid(), 'admin'));
