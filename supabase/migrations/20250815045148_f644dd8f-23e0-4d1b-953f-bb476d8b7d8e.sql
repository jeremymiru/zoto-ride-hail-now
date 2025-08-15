-- Fix security vulnerability: Restrict profile access to own data and ride participants only

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create secure policies for profile access
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Allow users to view profiles of drivers/passengers in their active rides
CREATE POLICY "Users can view ride participant profiles" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() IN (
    -- User can see driver's profile if they have a ride with that driver
    SELECT rr.user_id 
    FROM ride_requests rr 
    JOIN rides r ON r.request_id = rr.id 
    WHERE r.driver_id = profiles.user_id 
    AND rr.user_id = auth.uid()
    AND r.status IN ('waiting', 'on_way', 'arrived', 'in_progress')
    
    UNION
    
    -- Driver can see passenger's profile if they're driving for that passenger
    SELECT r.driver_id 
    FROM ride_requests rr 
    JOIN rides r ON r.request_id = rr.id 
    WHERE rr.user_id = profiles.user_id 
    AND r.driver_id = auth.uid()
    AND r.status IN ('waiting', 'on_way', 'arrived', 'in_progress')
  )
);