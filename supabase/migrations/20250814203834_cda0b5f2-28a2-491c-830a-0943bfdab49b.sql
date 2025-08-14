-- Create foreign key relationship between ride_requests and profiles if it doesn't exist
DO $$
BEGIN
    -- Check if foreign key constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'ride_requests_user_id_fkey' 
        AND table_name = 'ride_requests'
    ) THEN
        -- Add the foreign key constraint
        ALTER TABLE ride_requests 
        ADD CONSTRAINT ride_requests_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES profiles(user_id);
    END IF;
END $$;