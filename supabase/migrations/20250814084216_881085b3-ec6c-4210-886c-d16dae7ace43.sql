-- Create live_locations table for real-time tracking
CREATE TABLE public.live_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  heading DECIMAL(5, 2),
  speed DECIMAL(5, 2),
  accuracy DECIMAL(8, 2),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_type TEXT NOT NULL CHECK (user_type IN ('driver', 'rider')),
  vehicle_type TEXT CHECK (vehicle_type IN ('car', 'boda')),
  status TEXT NOT NULL DEFAULT 'online' CHECK (status IN ('online', 'busy', 'offline')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.live_locations ENABLE ROW LEVEL SECURITY;

-- Create policies for live locations
CREATE POLICY "Users can insert their own location" 
ON public.live_locations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own location" 
ON public.live_locations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view all online locations" 
ON public.live_locations 
FOR SELECT 
USING (status IN ('online', 'busy'));

CREATE POLICY "Users can delete their own location" 
ON public.live_locations 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_live_locations_updated_at
BEFORE UPDATE ON public.live_locations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add location to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_locations;

-- Enable replica identity for real-time updates
ALTER TABLE public.live_locations REPLICA IDENTITY FULL;

-- Create index for performance
CREATE INDEX idx_live_locations_user_type_status ON public.live_locations(user_type, status);
CREATE INDEX idx_live_locations_coordinates ON public.live_locations(latitude, longitude);
CREATE INDEX idx_live_locations_timestamp ON public.live_locations(timestamp DESC);