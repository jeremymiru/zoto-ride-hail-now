-- Update existing user to Peter Kariuki
UPDATE profiles 
SET full_name = 'Peter Kariuki', 
    phone = '+254712345678',
    total_rides = 25,
    rating = 4.8
WHERE email = 'jeremy.kariuki@strathmore.edu';

-- Insert mock drivers
INSERT INTO profiles (user_id, email, full_name, role, phone, rating, total_rides, is_active) VALUES
(gen_random_uuid(), 'mike.driver@zoto.com', 'Mike Johnson', 'driver', '+254722456789', 4.9, 342, true),
(gen_random_uuid(), 'james.driver@zoto.com', 'James Mukasa', 'driver', '+254733567890', 4.7, 198, true),
(gen_random_uuid(), 'peter.boda@zoto.com', 'Peter Ssemakula', 'boda_boda', '+254744678901', 4.8, 567, true),
(gen_random_uuid(), 'david.boda@zoto.com', 'David Namubiru', 'boda_boda', '+254755789012', 4.6, 234, true),
(gen_random_uuid(), 'grace.driver@zoto.com', 'Grace Nakato', 'driver', '+254766890123', 4.9, 456, true),
(gen_random_uuid(), 'simon.boda@zoto.com', 'Simon Otieno', 'boda_boda', '+254777901234', 4.7, 321, true);

-- Insert mock passengers
INSERT INTO profiles (user_id, email, full_name, role, phone, rating, total_rides, is_active) VALUES
(gen_random_uuid(), 'mary.passenger@zoto.com', 'Mary Wanjiku', 'car_owner', '+254788012345', 4.8, 67, true),
(gen_random_uuid(), 'john.passenger@zoto.com', 'John Kamau', 'car_owner', '+254799123456', 4.9, 89, true),
(gen_random_uuid(), 'ann.passenger@zoto.com', 'Ann Muthoni', 'car_owner', '+254700234567', 4.7, 45, true),
(gen_random_uuid(), 'paul.passenger@zoto.com', 'Paul Kiprotich', 'car_owner', '+254711345678', 4.8, 23, true);

-- Insert vehicles for drivers
INSERT INTO vehicles (driver_id, make, model, year, color, license_plate, vehicle_type, is_active)
SELECT 
    p.user_id,
    CASE 
        WHEN p.full_name = 'Mike Johnson' THEN 'Toyota'
        WHEN p.full_name = 'James Mukasa' THEN 'Honda'
        WHEN p.full_name = 'Grace Nakato' THEN 'Nissan'
        WHEN p.full_name = 'Peter Ssemakula' THEN 'Honda'
        WHEN p.full_name = 'David Namubiru' THEN 'Bajaj'
        WHEN p.full_name = 'Simon Otieno' THEN 'TVS'
    END as make,
    CASE 
        WHEN p.full_name = 'Mike Johnson' THEN 'Corolla'
        WHEN p.full_name = 'James Mukasa' THEN 'Civic'
        WHEN p.full_name = 'Grace Nakato' THEN 'Note'
        WHEN p.full_name = 'Peter Ssemakula' THEN 'CB150R'
        WHEN p.full_name = 'David Namubiru' THEN 'Boxer'
        WHEN p.full_name = 'Simon Otieno' THEN 'Apache'
    END as model,
    CASE 
        WHEN p.role = 'driver' THEN 2020
        WHEN p.role = 'boda_boda' THEN 2021
    END as year,
    CASE 
        WHEN p.full_name = 'Mike Johnson' THEN 'White'
        WHEN p.full_name = 'James Mukasa' THEN 'Silver'
        WHEN p.full_name = 'Grace Nakato' THEN 'Blue'
        WHEN p.full_name = 'Peter Ssemakula' THEN 'Red'
        WHEN p.full_name = 'David Namubiru' THEN 'Blue'
        WHEN p.full_name = 'Simon Otieno' THEN 'Black'
    END as color,
    CASE 
        WHEN p.full_name = 'Mike Johnson' THEN 'KBZ 123A'
        WHEN p.full_name = 'James Mukasa' THEN 'KCA 456B'
        WHEN p.full_name = 'Grace Nakato' THEN 'KCB 789C'
        WHEN p.full_name = 'Peter Ssemakula' THEN 'KMBA 789D'
        WHEN p.full_name = 'David Namubiru' THEN 'KMBB 456E'
        WHEN p.full_name = 'Simon Otieno' THEN 'KMBC 123F'
    END as license_plate,
    CASE 
        WHEN p.role = 'driver' THEN 'car'::vehicle_type
        WHEN p.role = 'boda_boda' THEN 'motorcycle'::vehicle_type
    END as vehicle_type,
    true as is_active
FROM profiles p 
WHERE p.role IN ('driver', 'boda_boda') 
AND p.email LIKE '%@zoto.com' 
AND p.full_name IN ('Mike Johnson', 'James Mukasa', 'Grace Nakato', 'Peter Ssemakula', 'David Namubiru', 'Simon Otieno');

-- Insert live locations for drivers (online status)
INSERT INTO live_locations (user_id, user_type, latitude, longitude, status, vehicle_type, accuracy, speed, heading)
SELECT 
    p.user_id,
    p.role::text,
    CASE 
        WHEN p.full_name = 'Mike Johnson' THEN 0.3476 + (random() - 0.5) * 0.01
        WHEN p.full_name = 'James Mukasa' THEN 0.2937 + (random() - 0.5) * 0.01
        WHEN p.full_name = 'Grace Nakato' THEN 0.3163 + (random() - 0.5) * 0.01
        WHEN p.full_name = 'Peter Ssemakula' THEN 0.3372 + (random() - 0.5) * 0.01
        WHEN p.full_name = 'David Namubiru' THEN 0.3280 + (random() - 0.5) * 0.01
        WHEN p.full_name = 'Simon Otieno' THEN 0.3420 + (random() - 0.5) * 0.01
    END as latitude,
    CASE 
        WHEN p.full_name = 'Mike Johnson' THEN 32.5825 + (random() - 0.5) * 0.01
        WHEN p.full_name = 'James Mukasa' THEN 32.6147 + (random() - 0.5) * 0.01
        WHEN p.full_name = 'Grace Nakato' THEN 32.5822 + (random() - 0.5) * 0.01
        WHEN p.full_name = 'Peter Ssemakula' THEN 32.5851 + (random() - 0.5) * 0.01
        WHEN p.full_name = 'David Namubiru' THEN 32.5780 + (random() - 0.5) * 0.01
        WHEN p.full_name = 'Simon Otieno' THEN 32.5900 + (random() - 0.5) * 0.01
    END as longitude,
    CASE 
        WHEN random() > 0.3 THEN 'online'
        ELSE 'busy'
    END as status,
    CASE 
        WHEN p.role = 'driver' THEN 'car'
        WHEN p.role = 'boda_boda' THEN 'motorcycle'
    END as vehicle_type,
    5.0 + random() * 10 as accuracy,
    random() * 20 as speed,
    random() * 360 as heading
FROM profiles p 
WHERE p.role IN ('driver', 'boda_boda') 
AND p.email LIKE '%@zoto.com';

-- Insert historical ride requests
INSERT INTO ride_requests (user_id, pickup_address, pickup_latitude, pickup_longitude, destination_address, destination_latitude, destination_longitude, service_type, status, estimated_fare, notes, created_at)
SELECT 
    p.user_id,
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
FROM profiles p WHERE p.email = 'jeremy.kariuki@strathmore.edu'
UNION ALL
SELECT 
    p.user_id,
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
FROM profiles p WHERE p.email = 'jeremy.kariuki@strathmore.edu'
UNION ALL
SELECT 
    p.user_id,
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
FROM profiles p WHERE p.email = 'jeremy.kariuki@strathmore.edu';

-- Insert some active ride requests from other users
INSERT INTO ride_requests (user_id, pickup_address, pickup_latitude, pickup_longitude, destination_address, destination_latitude, destination_longitude, service_type, status, estimated_fare, created_at)
SELECT 
    p.user_id,
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
FROM profiles p WHERE p.email = 'mary.passenger@zoto.com'
UNION ALL
SELECT 
    p.user_id,
    'Ntinda Shopping Complex',
    0.3372,
    32.5851,
    'Lugogo Mall',
    0.3500,
    32.5950,
    'motorcycle'::service_type,
    'pending'::request_status,
    800.00,
    now() - interval '2 minutes'
FROM profiles p WHERE p.email = 'john.passenger@zoto.com';

-- Create completed rides for some requests
INSERT INTO rides (request_id, driver_id, vehicle_id, status, pickup_time, start_time, end_time, actual_fare, driver_rating, passenger_rating)
SELECT 
    rr.id,
    (SELECT user_id FROM profiles WHERE role = 'driver' AND email = 'mike.driver@zoto.com'),
    (SELECT id FROM vehicles WHERE driver_id = (SELECT user_id FROM profiles WHERE email = 'mike.driver@zoto.com')),
    'completed'::ride_status,
    rr.created_at + interval '3 minutes',
    rr.created_at + interval '8 minutes',
    rr.created_at + interval '45 minutes',
    rr.estimated_fare,
    5,
    4
FROM ride_requests rr 
WHERE rr.status = 'completed' AND rr.pickup_address = 'Westlands Shopping Centre'
UNION ALL
SELECT 
    rr.id,
    (SELECT user_id FROM profiles WHERE role = 'driver' AND email = 'grace.driver@zoto.com'),
    (SELECT id FROM vehicles WHERE driver_id = (SELECT user_id FROM profiles WHERE email = 'grace.driver@zoto.com')),
    'completed'::ride_status,
    rr.created_at + interval '2 minutes',
    rr.created_at + interval '5 minutes',
    rr.created_at + interval '25 minutes',
    rr.estimated_fare,
    5,
    5
FROM ride_requests rr 
WHERE rr.status = 'completed' AND rr.pickup_address = 'Sarit Centre'
UNION ALL
SELECT 
    rr.id,
    (SELECT user_id FROM profiles WHERE role = 'boda_boda' AND email = 'peter.boda@zoto.com'),
    (SELECT id FROM vehicles WHERE driver_id = (SELECT user_id FROM profiles WHERE email = 'peter.boda@zoto.com')),
    'completed'::ride_status,
    rr.created_at + interval '1 minute',
    rr.created_at + interval '3 minutes',
    rr.created_at + interval '18 minutes',
    rr.estimated_fare,
    4,
    5
FROM ride_requests rr 
WHERE rr.status = 'completed' AND rr.pickup_address = 'Makerere University';

-- Insert notifications for drivers about pending requests
INSERT INTO notifications (user_id, type, title, message, data, read)
SELECT 
    p.user_id,
    'ride_request',
    'New Ride Request',
    'You have a new ride request nearby',
    json_build_object('request_id', rr.id, 'pickup_address', rr.pickup_address, 'estimated_fare', rr.estimated_fare),
    false
FROM profiles p 
CROSS JOIN ride_requests rr
WHERE p.role IN ('driver', 'boda_boda') 
AND rr.status = 'pending'
AND p.email IN ('mike.driver@zoto.com', 'james.driver@zoto.com', 'grace.driver@zoto.com')
LIMIT 6;