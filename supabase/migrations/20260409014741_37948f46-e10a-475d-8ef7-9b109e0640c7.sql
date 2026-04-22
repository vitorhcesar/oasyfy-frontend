
-- Goal type enum
CREATE TYPE public.goal_type AS ENUM ('revenue', 'transaction_count', 'avg_ticket', 'new_customers');

-- Reward type enum
CREATE TYPE public.reward_type AS ENUM ('balance_bonus', 'fee_discount', 'badge', 'custom');

-- Goals table
CREATE TABLE public.seller_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  goal_type goal_type NOT NULL DEFAULT 'revenue',
  target_value BIGINT NOT NULL,
  reward_type reward_type NOT NULL DEFAULT 'balance_bonus',
  reward_value BIGINT NOT NULL DEFAULT 0,
  reward_description TEXT,
  seller_id UUID, -- NULL = global goal for all sellers
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Goal progress table
CREATE TABLE public.seller_goal_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID NOT NULL REFERENCES public.seller_goals(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL,
  current_value BIGINT NOT NULL DEFAULT 0,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  reward_claimed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(goal_id, seller_id)
);

-- Enable RLS
ALTER TABLE public.seller_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_goal_progress ENABLE ROW LEVEL SECURITY;

-- RLS for seller_goals
CREATE POLICY "Admins can manage goals"
  ON public.seller_goals FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Sellers can view active goals"
  ON public.seller_goals FOR SELECT
  TO authenticated
  USING (is_active = true AND (seller_id IS NULL OR seller_id = auth.uid()));

-- RLS for seller_goal_progress
CREATE POLICY "Admins can manage goal progress"
  ON public.seller_goal_progress FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Sellers can view own progress"
  ON public.seller_goal_progress FOR SELECT
  TO authenticated
  USING (seller_id = auth.uid());

CREATE POLICY "Sellers can update own progress"
  ON public.seller_goal_progress FOR UPDATE
  TO authenticated
  USING (seller_id = auth.uid());

-- Triggers for updated_at
CREATE TRIGGER update_seller_goals_updated_at
  BEFORE UPDATE ON public.seller_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_seller_goal_progress_updated_at
  BEFORE UPDATE ON public.seller_goal_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
