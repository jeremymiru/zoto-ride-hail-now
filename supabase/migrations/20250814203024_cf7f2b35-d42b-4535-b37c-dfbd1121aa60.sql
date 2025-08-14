-- Add some pending ride requests for Sarah to see
INSERT INTO ride_requests (
  id,
  user_id, 
  pickup_address,
  destination_address,
  pickup_latitude,
  pickup_longitude,
  destination_latitude,
  destination_longitude,
  service_type,
  estimated_fare,
  status,
  created_at,
  updated_at
) VALUES 
-- Peter Kariuki's profile ID for ride requests that Sarah can see
(
  '990e8400-e29b-41d4-a716-446655440001',
  (SELECT id FROM auth.users WHERE email = 'jeremy.kariuki@strathmore.edu'),
  'University of Nairobi, Nairobi',
  'Jomo Kenyatta International Airport, Nairobi',
  -1.2966,
  36.8083,
  -1.3192,
  36.9278,
  'car',
  1800.00,
  'pending',
  NOW() - INTERVAL '5 minutes',
  NOW() - INTERVAL '5 minutes'
),
(
  '990e8400-e29b-41d4-a716-446655440002', 
  (SELECT id FROM auth.users WHERE email = 'jeremy.kariuki@strathmore.edu'),
  'Westlands, Nairobi',
  'Karen Shopping Centre, Karen',
  -1.2674,
  36.8108,
  -1.3197,
  36.7072,
  'car',
  950.00,
  'pending',
  NOW() - INTERVAL '3 minutes',
  NOW() - INTERVAL '3 minutes'
),
(
  '990e8400-e29b-41d4-a716-446655440003',
  (SELECT id FROM auth.users WHERE email = 'jeremy.kariuki@strathmore.edu'), 
  'CBD, Nairobi',
  'Gigiri, Nairobi',
  -1.2843,
  36.8214,
  -1.2330,
  36.8063,
  'motorcycle',
  450.00,
  'pending',
  NOW() - INTERVAL '1 minute',
  NOW() - INTERVAL '1 minute'
);