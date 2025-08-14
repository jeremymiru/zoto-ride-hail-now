-- Update existing profiles to match mock data roles and have proper test data
UPDATE profiles 
SET 
  full_name = 'Peter Kariuki',
  role = 'car_owner',
  total_rides = 15,
  rating = 4.8
WHERE user_id = 'dc3f9729-25a2-46b7-b10b-6dace279afcd';

UPDATE profiles 
SET 
  full_name = 'Sarah Wilson', 
  role = 'driver',
  total_rides = 87,
  rating = 4.9
WHERE user_id = 'e5e4f0a1-da32-471c-856b-f3b6cc6cf4f5';

-- Update any other existing profiles to have test data
UPDATE profiles 
SET 
  full_name = 'James Mukasa',
  role = 'driver', 
  total_rides = 124,
  rating = 4.7
WHERE user_id = '19c37074-3ee4-4ee2-90f8-b666b9b9f192';

UPDATE profiles 
SET 
  full_name = 'Sarah Passenger',
  role = 'car_owner',
  total_rides = 8,
  rating = 4.5  
WHERE user_id = '7ad79710-441a-4d07-9869-1a27e388c50b';