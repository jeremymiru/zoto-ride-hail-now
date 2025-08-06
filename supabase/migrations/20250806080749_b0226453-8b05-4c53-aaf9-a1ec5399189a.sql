-- Insert mock profiles for testing
INSERT INTO public.profiles (user_id, email, full_name, role, phone, rating, total_rides, is_active) VALUES
-- Car Owners
('11111111-1111-1111-1111-111111111111', 'john.doe@example.com', 'John Doe', 'car_owner', '+256700123456', 4.8, 25, true),
('22222222-2222-2222-2222-222222222222', 'sarah.wilson@example.com', 'Sarah Wilson', 'car_owner', '+256700234567', 4.5, 12, true),

-- Drivers
('33333333-3333-3333-3333-333333333333', 'mike.driver@example.com', 'Mike Johnson', 'driver', '+256700345678', 4.9, 150, true),
('44444444-4444-4444-4444-444444444444', 'james.rider@example.com', 'James Mukasa', 'driver', '+256700456789', 4.7, 98, true),
('55555555-5555-5555-5555-555555555555', 'peter.boda@example.com', 'Peter Ssemakula', 'driver', '+256700567890', 4.6, 205, true),

-- Admin
('66666666-6666-6666-6666-666666666666', 'admin@zoto.com', 'Zoto Admin', 'admin', '+256700678901', 5.0, 0, true);

-- Insert vehicles for drivers
INSERT INTO public.vehicles (driver_id, make, model, year, color, license_plate, vehicle_type, is_active) VALUES
-- Car drivers
('33333333-3333-3333-3333-333333333333', 'Toyota', 'Corolla', 2020, 'White', 'UAM 123A', 'car', true),
('44444444-4444-4444-4444-444444444444', 'Honda', 'Civic', 2019, 'Silver', 'UAM 456B', 'car', true),
-- Motorcycle drivers
('55555555-5555-5555-5555-555555555555', 'Honda', 'CB150R', 2021, 'Red', 'UBA 789C', 'motorcycle', true);

-- Insert some sample ride requests
INSERT INTO public.ride_requests (user_id, pickup_latitude, pickup_longitude, pickup_address, destination_latitude, destination_longitude, destination_address, service_type, estimated_fare, status, notes) VALUES
('11111111-1111-1111-1111-111111111111', 0.3476, 32.5825, 'Kampala Central Business District', 0.2937, 32.6147, 'Makerere University', 'car', 15000, 'pending', 'Need to reach university by 9 AM'),
('22222222-2222-2222-2222-222222222222', 0.3163, 32.5822, 'Garden City Mall', 0.3372, 32.5851, 'Ntinda Shopping Complex', 'motorcycle', 8000, 'pending', 'Quick delivery needed');

-- Insert some notifications
INSERT INTO public.notifications (user_id, title, message, type, data, read) VALUES
-- Driver notifications
('33333333-3333-3333-3333-333333333333', 'New Ride Request', 'You have a new ride request from Kampala CBD to Makerere University', 'ride_request', '{"request_id": "ride_request_id_1", "fare": 15000}', false),
('55555555-5555-5555-5555-555555555555', 'New Delivery Request', 'Quick delivery from Garden City to Ntinda', 'ride_request', '{"request_id": "ride_request_id_2", "fare": 8000}', false),

-- User notifications
('11111111-1111-1111-1111-111111111111', 'Looking for Driver', 'We are finding the best driver for your trip', 'status_update', '{"status": "searching"}', false),
('22222222-2222-2222-2222-222222222222', 'Looking for Boda-Boda', 'Searching for nearby motorcycle drivers', 'status_update', '{"status": "searching"}', false),

-- Admin notifications
('66666666-6666-6666-6666-666666666666', 'System Alert', 'Daily analytics report is ready', 'system', '{"type": "daily_report"}', false);