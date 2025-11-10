-- Drop trigger first, then recreate function with proper security settings
DROP TRIGGER IF EXISTS set_updated_at ON public.skin_analyses;
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.skin_analyses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();