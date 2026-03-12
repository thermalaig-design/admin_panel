# Quick Start: User Profiles Feature

## 🎯 One-Minute Setup

### Database Setup:
```bash
cd backend
npm install  # if not already done
npm run setup-profiles
```

### Manual SQL Setup (if script fails):
1. Open Supabase Dashboard
2. Go to SQL Editor → New Query
3. Copy content from `backend/sql/create_user_profiles_table.sql`
4. Execute

## 📍 Finding User Profiles in Admin Panel

```
Admin Panel
├── Directory Categories
│   ├── ⭐ User Profiles ← NEW!
│   ├── Trustee Members
│   ├── Patron Members
│   ├── Elected Members
│   ├── Committee Members
│   ├── Hospitals
│   └── Doctors
```

## 🔍 User Profiles Page Features

### 1. Quick Stats (Top Section)
```
┌─────────────────────────────────────────────────┐
│  👥 Total Users    📞 With Contact    🎖️ Elected  │
│     245              189                 42     │
└─────────────────────────────────────────────────┘
```

### 2. Search & Filter
```
🔍 Search by name, email, phone, member ID...
[All]  [Elected Members]  [Incomplete]
```

### 3. Profile List
```
┌─────────────────────────────────────────────────┐
│ 👤 John Doe                        [Elected]    │
│    ID: #12345                        25/02/26   │
│    📞 +91-9999999999  📧 john@...  📍 Mumbai   │
│                                                  │
│    Click to expand → ⬇️                         │
│                                                  │
│    [Expandable Details]                        │
│    • Date of Birth: 15/03/1990                 │
│    • Email: john.doe@email.com                 │
│    • Address: 123 Main St, Mumbai              │
│    • Position: Project Manager                 │
│    • Company: Tech Corp                        │
│    • And more...                               │
└─────────────────────────────────────────────────┘
```

## 📊 What Data is Displayed

### Quick View (Always Visible)
- ✅ Name
- ✅ User ID
- ✅ Mobile
- ✅ Email
- ✅ Location
- ✅ Elected member badge

### Expanded View (Click to Expand)

**Personal Info**
- Date of Birth
- Gender
- Blood Group
- Nationality
- Aadhaar ID

**Contact**
- Mobile
- Email
- WhatsApp

**Address**
- Home Address
- Office Address

**Professional**
- Position
- Company
- Role

**Emergency**
- Emergency Contact Name
- Emergency Contact Number

**Family**
- Spouse Name
- Children Count

**Social Media**
- Facebook, Twitter, Instagram, LinkedIn

## 🎮 How to Use

### View All Users
1. Click "User Profiles" in Admin Panel
2. See list of all profiles

### Search for Someone
1. Type name/email/phone in search bar
2. List filters in real-time

### Filter Users
- **All**: All matching search results
- **Elected**: Only elected members
- **Incomplete**: Profiles missing basic data

### View Full Profile
1. Click on any profile card
2. Card expands to show all details
3. Click again to collapse

### Go Back
- Click back arrow or navigate to another section

## 📱 Mobile Responsive

✅ Full responsive design
✅ Touch-friendly interface
✅ Search works on mobile
✅ Expandable details on small screens

## 🔐 Security Notes

- Only authenticated admins can access
- Data from Supabase (follows RLS policies)
- Profile photos stored separately
- No data modification yet (view-only)

## 📝 Adding/Editing Profiles

Currently profiles are viewed only. To add/edit profiles:

**Option 1**: Add via Supabase Dashboard
- Go to Tables → user_profiles
- Click Insert Row
- Fill in the data

**Option 2**: Add via SQL
```sql
INSERT INTO user_profiles (
  user_id, user_identifier, name, email, mobile
) VALUES (
  'user-uuid', 'user@email.com', 'Name', 'email@...', '+91-...'
);
```

**Option 3**: Bulk import (coming soon)

## ✨ Features Coming Soon

- 📝 Edit profile information
- ➕ Add new profiles
- 📤 Export profiles to CSV/Excel
- 🗑️ Delete profiles
- 📸 Profile photo upload
- 🏷️ Tags and categories
- 📋 Custom fields

## 🆘 Troubleshooting

### "Table not found" Error
```
✓ Run setup script: npm run setup-profiles
✓ Or execute SQL from backend/sql/create_user_profiles_table.sql
✓ Refresh browser (Ctrl+Shift+R)
```

### Search returns nothing
```
✓ Check if profiles exist in Supabase
✓ Verify data is entered correctly
✓ Use browser console (F12) to check for errors
✓ Check Supabase connection
```

### Page loading slow
```
✓ Check internet connection
✓ Ensure Supabase is responding
✓ Clear browser cache (Ctrl+Shift+Delete)
✓ Try incognito/private mode
```

## 📞 Need Help?

1. Check browser console (F12) for errors
2. View complete guide: `USER_PROFILES_SETUP_GUIDE.md`
3. Check Supabase Dashboard for table status
4. Verify `.env` has correct credentials

---

**Version**: 1.0  
**Last Updated**: 24 Feb 2026  
**Status**: ✅ Production Ready
