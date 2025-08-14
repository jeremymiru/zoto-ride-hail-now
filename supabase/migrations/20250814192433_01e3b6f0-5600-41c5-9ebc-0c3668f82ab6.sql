-- First, let's create some mock users that already exist in auth.users table by using existing user IDs
-- Update Peter Kariuki profile
UPDATE profiles 
SET full_name = 'Peter Kariuki', 
    phone = '+254712345678',
    total_rides = 25,
    rating = 4.8
WHERE email = 'jeremy.kariuki@strathmore.edu';

-- Update Sarah Wilson to be a driver
UPDATE profiles 
SET role = 'driver', 
    full_name = 'Sarah Wilson (Driver)', 
    phone = '+254722456789',
    rating = 4.9,
    total_rides = 342
WHERE email = 'sarah.passenger@zoto.com';

-- Update mirujeremy to be a boda driver  
UPDATE profiles 
SET role = 'boda_boda', 
    full_name = 'James Mukasa', 
    phone = '+254733567890',
    rating = 4.7,
    total_rides = 198
WHERE email = 'mirujeremy@gmail.com';

-- Insert vehicles for existing drivers
INSERT INTO vehicles (driver_id, make, model, year, color, license_plate, vehicle_type, is_active)
SELECT 
    user_id,
    'Toyota',
    'Corolla',
    2020,
    'White',
    'KBZ 123A',
    'car'::vehicle_type,
    true
FROM profiles WHERE email = 'sarah.passenger@zoto.com'
UNION ALL
SELECT 
    user_id,
    'Honda',
    'CB150R',
    2021,
    'Red',
    'KMBA 789D',
    'motorcycle'::vehicle_type,
    true
FROM profiles WHERE email = 'mirujeremy@gmail.com';

-- Insert live locations for drivers (online status) - fixed user_type values
INSERT INTO live_locations (user_id, user_type, latitude, longitude, status, vehicle_type, accuracy, speed, heading)
SELECT 
    user_id,
    'driver',  -- Fixed: use 'driver' instead of role
    0.3476 + (random() - 0.5) * 0.01,
    32.5825 + (random() - 0.5) * 0.01,
    'online',
    'car',
    8.5,
    0,
    90
FROM profiles WHERE email = 'sarah.passenger@zoto.com'
UNION ALL
SELECT 
    user_id,
    'driver',  -- Fixed: use 'driver' instead of role for boda_boda
    0.2937 + (random() - 0.5) * 0.01,
    32.6147 + (random() - 0.5) * 0.01,
    'online',
    'motorcycle',
    6.2,
    15,
    180
FROM profiles WHERE email = 'mirujeremy@gmail.com';

-- Insert historical ride requests for Peter
INSERT INTO ride_requests (user_id, pickup_address, pickup_latitude, pickup_longitude, destination_address, destination_latitude, destination_longitude, service_type, status, estimated_fare, notes, created_at)
SELECT 
    user_id,
    'Westlands Shopping Centre',
    0.3276,
    32.5825,
    'JKIA Terminal 1',
    -1.3192,
    36.9275,
    'car'::service_type,
    'completed'::request_status,
    2500.00,
    'Airport pickup',
    now() - interval '2 days'
FROM profiles WHERE email = 'jeremy.kariuki@strathmore.edu'
UNION ALL
SELECT 
    user_id,
    'Sarit Centre',
    0.3163,
    32.5822,
    'Village Market',
    0.3420,
    32.5900,
    'car'::service_type,
    'completed'::request_status,
    800.00,
    'Shopping trip',
    now() - interval '1 day'
FROM profiles WHERE email = 'jeremy.kariuki@strathmore.edu'
UNION ALL
SELECT 
    user_id,
    'Makerere University',
    0.2937,
    32.6147,
    'Kampala CBD',
    0.3476,
    32.5825,
    'motorcycle'::service_type,
    'completed'::request_status,
    1200.00,
    'Quick ride to town',
    now() - interval '3 hours'
FROM profiles WHERE email = 'jeremy.kariuki@strathmore.edu';

-- Insert some active ride requests from other users  
INSERT INTO ride_requests (user_id, pickup_address, pickup_latitude, pickup_longitude, destination_address, destination_latitude, destination_longitude, service_type, status, estimated_fare, created_at)
SELECT 
    user_id,
    'Garden City Mall',
    0.3163,
    32.5822,
    'Nakumatt Oasis',
    0.3280,
    32.5780,
    'car'::service_type,
    'pending'::request_status,
    600.00,
    now() - interval '5 minutes'
FROM profiles WHERE email = 'jeremy.kariuki@student.moringaschool.com';

-- Create completed rides for historical requests
INSERT INTO rides (request_id, driver_id, vehicle_id, status, pickup_time, start_time, end_time, actual_fare, driver_rating, passenger_rating)
SELECT 
    rr.id,
    (SELECT user_id FROM profiles WHERE email = 'sarah.passenger@zoto.com'),
    (SELECT id FROM vehicles WHERE driver_id = (SELECT user_id FROM profiles WHERE email = 'sarah.passenger@zoto.com')),
    'completed'::ride_status,
    rr.created_at + interval '3 minutes',
    rr.created_at + interval '8 minutes',
    rr.created_at + interval '45 minutes',
    rr.estimated_fare,
    5,
    4
FROM ride_requests rr 
WHERE rr.pickup_address = 'Westlands Shopping Centre' AND rr.status = 'completed'
UNION ALL
SELECT 
    rr.id,
    (SELECT user_id FROM profiles WHERE email = 'sarah.passenger@zoto.com'),
    (SELECT id FROM vehicles WHERE driver_id = (SELECT user_id FROM profiles WHERE email = 'sarah.passenger@zoto.com')),
    'completed'::ride_status,
    rr.created_at + interval '2 minutes',
    rr.created_at + interval '5 minutes',
    rr.created_at + interval '25 minutes',
    rr.estimated_fare,
    5,
    5
FROM ride_requests rr 
WHERE rr.pickup_address = 'Sarit Centre' AND rr.status = 'completed'
UNION ALL
SELECT 
    rr.id,
    (SELECT user_id FROM profiles WHERE email = 'mirujeremy@gmail.com'),
    (SELECT id FROM vehicles WHERE driver_id = (SELECT user_id FROM profiles WHERE email = 'mirujeremy@gmail.com')),
    'completed'::ride_status,
    rr.created_at + interval '1 minute',
    rr.created_at + interval '3 minutes',
    rr.created_at + interval '18 minutes',
    rr.estimated_fare,
    4,
    5
FROM ride_requests rr 
WHERE rr.pickup_address = 'Makerere University' AND rr.status = 'completed';

-- Insert notifications for drivers about pending requests
INSERT INTO notifications (user_id, type, title, message, data, read)
SELECT 
    p.user_id,
    'ride_request',
    'New Ride Request',
    'You have a new ride request nearby - KSh ' || rr.estimated_fare,
    json_build_object('request_id', rr.id, 'pickup_address', rr.pickup_address, 'estimated_fare', rr.estimated_fare),
    false
FROM profiles p 
CROSS JOIN ride_requests rr
WHERE p.role IN ('driver', 'boda_boda') 
AND rr.status = 'pending'
LIMIT 3;