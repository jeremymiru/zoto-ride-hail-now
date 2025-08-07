# Zoto Platform Mock Accounts

## Ready-to-Use Demo Accounts

**IMPORTANT**: You can now sign up with your own email or use these pre-configured demo accounts for testing different user roles.

### 🚗 Car Owners (Request Rides)
**What they do**: Request rides from drivers, rate trips, view ride history

1. **John Doe** - *Frequent Commuter*
   - Email: `john.passenger@zoto.com`
   - Password: `ZotoDemo2024!`
   - Role: Car Owner
   - Use Case: Daily commuting, business trips

2. **Sarah Wilson** - *Occasional User*
   - Email: `sarah.passenger@zoto.com`
   - Password: `ZotoDemo2024!`
   - Role: Car Owner
   - Use Case: Weekend shopping, social events

### 🚕 Car Drivers (Professional Drivers)
**What they do**: Accept ride requests, drive passengers, manage vehicle info

3. **Mike Johnson** - *Professional Car Driver*
   - Email: `mike.driver@zoto.com`
   - Password: `ZotoDemo2024!`
   - Role: Driver
   - Vehicle: Toyota Corolla 2020, White, UAM 123A
   - Service Area: City center, airports

4. **James Mukasa** - *Part-time Driver*
   - Email: `james.driver@zoto.com`
   - Password: `ZotoDemo2024!`
   - Role: Driver
   - Vehicle: Honda Civic 2019, Silver, UAM 456B
   - Service Area: Residential areas, universities

### 🏍️ Boda-Boda Drivers (Motorcycle Taxi)
**What they do**: Quick rides, traffic navigation, affordable transport

5. **Peter Ssemakula** - *Experienced Boda Rider*
   - Email: `peter.boda@zoto.com`
   - Password: `ZotoDemo2024!`
   - Role: Boda-Boda
   - Vehicle: Honda CB150R 2021, Red, UBA 789C
   - Specialty: Quick city rides, heavy traffic areas

6. **David Namubiru** - *Student Boda Driver*
   - Email: `david.boda@zoto.com`
   - Password: `ZotoDemo2024!`
   - Role: Boda-Boda
   - Vehicle: Bajaj Boxer 2020, Blue, UBA 456D
   - Service Area: University campus, student areas

### 👨‍💼 Admin (Platform Management)
**What they do**: Monitor platform, manage users, view analytics

7. **Zoto Admin** - *Platform Administrator*
   - Email: `admin@zoto.com`
   - Password: `ZotoAdmin2024!`
   - Role: Admin
   - Access: Full platform control, analytics, user management

## 🚀 How to Test the Platform

### Option 1: Use Your Own Email
1. Go to `/auth` page
2. Click "Sign Up" tab
3. Enter your email, password, full name
4. Select your role (Car Owner, Driver, or Boda-Boda)
5. Sign up and then sign in

### Option 2: Use Demo Accounts
1. Go to `/auth` page
2. Use any email/password combination from above
3. If account doesn't exist, sign up first with those exact credentials
4. Then sign in to experience that user role

### 📱 User Experience by Role

**🚗 Car Owners Experience:**
- Dashboard shows "Request a Ride" interface
- Can set pickup/destination locations
- Choose between car or boda-boda service
- View ride status and history
- Rate completed rides

**🚕 Drivers Experience:**
- Dashboard shows available ride requests
- Can accept/reject ride requests
- Update ride status (picked up, en route, completed)
- Add vehicle information
- View earnings and ride history

**🏍️ Boda-Boda Experience:**
- Similar to car drivers but for motorcycle rides
- Optimized for quick, short-distance trips
- Traffic-friendly route suggestions

**👨‍💼 Admin Experience:**
- Full platform overview
- User management tools
- Ride analytics and monitoring
- System notifications control

## Sample Locations (Kampala, Uganda)

- **Kampala CBD**: 0.3476, 32.5825
- **Makerere University**: 0.2937, 32.6147
- **Garden City Mall**: 0.3163, 32.5822
- **Ntinda Shopping Complex**: 0.3372, 32.5851

## 💡 Testing Tips

- **Demo Passwords**: `ZotoDemo2024!` (users) | `ZotoAdmin2024!` (admin)
- **Your Own Account**: Use any email/password you prefer
- **Vehicle Setup**: Drivers should add vehicle info after first login
- **Phone Format**: Use Uganda format (+256) for realistic testing
- **Test Locations**: Use the Kampala coordinates below for ride requests
- **Role Testing**: Sign up multiple accounts to test passenger ↔ driver interactions

## 🌍 Sample Test Locations (Kampala, Uganda)

**For realistic ride testing, use these coordinates:**
- **Kampala CBD** (Central Business District): `0.3476, 32.5825`
- **Makerere University** (Student area): `0.2937, 32.6147`
- **Garden City Mall** (Shopping center): `0.3163, 32.5822`
- **Ntinda Shopping Complex** (Residential): `0.3372, 32.5851`
- **Entebbe Airport** (Airport rides): `0.0474, 32.4435`

## 🔧 Quick Start
1. Sign up with your email OR use demo accounts
2. Test as passenger: Request rides between above locations
3. Test as driver: Accept and complete ride requests
4. Test as admin: Monitor platform activity