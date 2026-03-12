# User Profiles Feature Setup Guide

## Overview
A new **User Profiles** section has been added to the Admin Panel. This allows you to view and manage all user profiles with their complete data from Supabase.

## What's New

### Features Added:
1. **User Profiles Page** - Quick access option in the Admin Panel's directory
2. **Profile List View** - Search and filter user profiles by:
   - Name, ID, Email, Phone number
   - Filter by elected members or incomplete profiles
3. **Detailed Profile Information** - Click on any profile to see:
   - Personal Information (DOB, Gender, Blood Group, Nationality, Aadhaar)
   - Contact Information (Mobile, Email, WhatsApp)
   - Address (Home & Office)
   - Professional Details (Position, Company, Role)
   - Emergency Contact Information
   - Family Details (Spouse, Children)
   - Social Media Links (Facebook, Twitter, Instagram, LinkedIn)
4. **Quick Statistics** - Dashboard shows:
   - Total users
   - Users with contact info
   - Elected members
   - Complete profiles

## Installation Steps

### Step 1: Create User Profiles Table

Run the setup script:
```bash
cd backend
npm run setup-profiles
```

**Or manually (if script fails):**

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the entire SQL from: `backend/sql/create_user_profiles_table.sql`
5. Click **Execute**

### Step 2: Verify Installation

After creating the table, the Admin Panel will automatically:
- Show "User Profiles" in the directory categories
- Display the user count
- Allow you to view, search, and filter profiles

## Database Schema

The `user_profiles` table includes:

```
- id: Auto-incrementing primary key
- user_id: Link to authentication user
- user_identifier: Unique identifier (email or username)
- name: Full name
- role: User role/designation
- member_id: Membership ID
- mobile: Phone number
- email: Email address
- address_home: Home address
- address_office: Office address
- company_name: Company name
- resident_landline: Resident phone
- office_landline: Office phone
- gender: Gender
- marital_status: Marital status
- nationality: Country
- aadhaar_id: Aadhaar number
- blood_group: Blood type
- dob: Date of birth
- emergency_contact_name: Emergency contact name
- emergency_contact_number: Emergency contact phone
- profile_photo_url: Profile photo URL
- spouse_name: Spouse's name
- spouse_contact_number: Spouse's phone
- children_count: Number of children
- facebook: Facebook profile
- twitter: Twitter handle
- instagram: Instagram handle
- linkedin: LinkedIn profile
- whatsapp: WhatsApp number
- family_members: JSON array of family data
- position: Job position
- location: Primary location
- is_elected_member: Boolean flag for elected members
- created_at: Record creation timestamp
- updated_at: Last update timestamp
```

## How to Use

### Accessing User Profiles:

1. Open **Admin Panel**
2. Go to **Directory Categories**
3. Click **User Profiles** card
4. You'll see:
   - **Statistics** at the top (Total users, contacts, elected, complete)
   - **Search bar** to find specific users
   - **Filter buttons** for different categories
   - **Profile list** with quick info

### Viewing Full Profile:

1. Click on any profile card in the list
2. The card expands to show all details
3. Click again to collapse
4. Or click another profile to view it

### Searching Profiles:

Use the search bar to find users by:
- Full name
- User identifier
- Email address
- Phone number
- Member ID

### Filtering Profiles:

- **All**: Shows all profiles matching search
- **Elected Members**: Only elected members
- **Incomplete**: Profiles without basic info

## Files Modified/Created

### New Files:
- `src/admin/pages/UserProfilesPage.jsx` - Main profile page component
- `backend/sql/create_user_profiles_table.sql` - Database schema
- `backend/setup_user_profiles.js` - Setup script
- `USER_PROFILES_SETUP_GUIDE.md` - This file

### Modified Files:
- `src/admin/pages/DirectoryMain.jsx` - Added User Profiles category
- `src/admin/AdminPanel.jsx` - Added route handling
- `src/admin/components/CategoryCard.jsx` - Added User icon support

## Troubleshooting

### "User Profiles table not found" error:
- Ensure you've run the setup script or executed the SQL
- Check that the table exists in Supabase Dashboard -> Tables
- Verify your Supabase credentials in `.env`

### No profiles showing:
- Profiles need to be added to the `user_profiles` table first
- Check Supabase Dashboard to see if profiles exist
- Refresh the page with F5

### Search not working:
- Ensure profile data is correctly formatted
- Check browser console for any errors (F12 -> Console)
- Verify Supabase has proper data

## Next Steps

### Populate User Profiles:

You can add profiles manually or import them. Example to add a profile via Supabase:

```sql
INSERT INTO user_profiles (
  user_id, 
  user_identifier, 
  name, 
  email, 
  mobile
) VALUES (
  'uuid-here',
  'user@email.com',
  'John Doe',
  'john@email.com',
  '+91-9999999999'
);
```

### Integration with Auth:

Link user profiles to authentication users:
```javascript
const { data: { user } } = await supabase.auth.getUser();
// Create profile with user.id as user_id
```

## Support

For issues or questions:
1. Check the browser console (F12) for error messages
2. Verify Supabase connection and table structure
3. Ensure all required environment variables are set
4. Check the Admin Panel console logs

---

**Feature Status**: ✅ Ready to Use
**Last Updated**: February 24, 2026
