-- Create the notifications table for user-specific notifications
-- This table stores individual notifications for each user (trustees/patrons)

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id INTEGER REFERENCES user_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  type VARCHAR(50) DEFAULT 'general',
  target_audience VARCHAR(20), -- 'trustees', 'patrons', or 'both'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for user access (users can only see their own notifications)
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING (auth.uid()::text = user_id::text OR auth.role() = 'service_role');

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE TO authenticated
  USING (auth.uid()::text = user_id::text OR auth.role() = 'service_role')
  WITH CHECK (auth.uid()::text = user_id::text OR auth.role() = 'service_role');

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE notifications_id_seq TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_target_audience ON public.notifications(target_audience);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notifications_updated_at 
    BEFORE UPDATE ON public.notifications 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
-- INSERT INTO public.notifications (user_id, title, message, type, target_audience)
-- VALUES 
--   (1, 'Welcome!', 'Welcome to the Trustee & Patron Portal', 'welcome', 'both'),
--   (2, 'System Update', 'Scheduled maintenance on Sunday', 'system', 'trustees');