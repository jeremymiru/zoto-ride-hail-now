# Demo Accounts for Zoto Platform Testing

## Test User Credentials

Since we can't create mock users in the Supabase auth system directly, you'll need to create these accounts manually through the sign-up process. Here are the suggested demo accounts:

### Car Owners (Passengers)
1. **John Doe**
   - Email: `john.doe@example.com`
   - Password: `demo123456`
   - Role: Car Owner
   - Phone: +256700123456

2. **Sarah Wilson**
   - Email: `sarah.wilson@example.com`
   - Password: `demo123456`
   - Role: Car Owner
   - Phone: +256700234567

### Drivers
3. **Mike Johnson** (Car Driver)
   - Email: `mike.driver@example.com`
   - Password: `demo123456`
   - Role: Driver
   - Phone: +256700345678
   - Vehicle: Toyota Corolla 2020, White, UAM 123A

4. **James Mukasa** (Car Driver)
   - Email: `james.rider@example.com`
   - Password: `demo123456`
   - Role: Driver
   - Phone: +256700456789
   - Vehicle: Honda Civic 2019, Silver, UAM 456B

5. **Peter Ssemakula** (Boda-Boda Driver)
   - Email: `peter.boda@example.com`
   - Password: `demo123456`
   - Role: Driver
   - Phone: +256700567890
   - Vehicle: Honda CB150R 2021, Red, UBA 789C

### Admin
6. **Zoto Admin**
   - Email: `admin@zoto.com`
   - Password: `demo123456`
   - Role: Admin
   - Phone: +256700678901

## Testing Workflow

1. **Sign up** each account through the `/auth` page
2. **Car Owners** can:
   - Request rides (car or motorcycle)
   - View ride history
   - Rate drivers

3. **Drivers** can:
   - View and accept ride requests
   - Update ride status
   - Add vehicle information
   - View earnings

4. **Admin** can:
   - Monitor all users and rides
   - View analytics dashboard
   - Manage system notifications

## Sample Locations (Kampala, Uganda)

- **Kampala CBD**: 0.3476, 32.5825
- **Makerere University**: 0.2937, 32.6147
- **Garden City Mall**: 0.3163, 32.5822
- **Ntinda Shopping Complex**: 0.3372, 32.5851

## Notes

- All passwords are set to `demo123456` for easy testing
- Drivers should add their vehicle information after signing up
- Phone numbers use Uganda format (+256)
- Use the sample locations for testing ride requests