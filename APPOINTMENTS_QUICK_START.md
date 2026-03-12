# Appointments - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Files Ready
✅ **AppointmentsPage.jsx** - List/filter view  
✅ **AppointmentDetailPage.jsx** - Detail view  
✅ **Database schema** - All set up  

### Step 2: Access the Features

#### List View (Main Page)
```
URL: /admin/appointments
Shows: All appointments with search & filters
```

#### Detail View (Click any appointment)
```
Shows: Complete appointment information
Actions: Accept, Reschedule, Add Remark, Delete
```

### Step 3: Common Actions

#### Find an Appointment
1. Go to Appointments page
2. Type patient name/phone in search bar
3. OR Click status tab to filter
4. OR Use doctor dropdown

#### Accept an Appointment
1. Click blue "✓ ACCEPT" button
2. Add optional remarks
3. Click "Save"
4. Status becomes "Confirmed"

#### Reschedule an Appointment
1. Click purple "⟳ RESCHEDULE" button
2. Pick new date
3. Pick new time
4. Add optional reason
5. Click "Reschedule"
6. Status becomes "Rescheduled"

#### Delete an Appointment
1. Click red delete icon (X)
2. Confirm in modal
3. Appointment removed immediately

### Step 4: Search Tips

**By Name**: Patient first/last name  
**By Phone**: Full 10-digit number  
**By Doctor**: Doctor's full name  
**By Membership**: Membership card number  

### Step 5: Filter Tips

- **Status Tabs**: Quick filter (All, Pending, Confirmed, Completed)
- **Doctor Dropdown**: Filter by doctor
- **Combine Filters**: Use search + status + doctor together

## 📊 Status Flow

```
Pending (🟡)
    ↓
Confirmed (🟢) → Completed (🔵)
    ↓
Rescheduled (🟣)

Any Status → Cancelled (🔴) [Final]
```

## 📱 Mobile Tips

- Tap appointment to open detail view
- Scroll left/right for more info
- Use dropdown filters instead of tabs
- Buttons adjust for touch

## ⚡ Quick Stats

- **Total**: All appointments
- **Pending**: Awaiting confirmation
- **Confirmed**: Accepted
- **Completed**: Finished
- **Today**: Today's count

Click any stat to filter!

## 🎨 Color Quick Reference

| Color | Status | Meaning |
|-------|--------|---------|
| 🟡 Yellow | Pending | Needs action |
| 🟢 Green | Confirmed | Approved |
| 🔵 Blue | Completed | Done |
| 🟣 Purple | Rescheduled | Date changed |
| ⚫ Red | Cancelled | Cancelled |

## 🔥 Pro Tips

1. **Daily Workflow**: Start with "Today" filter
2. **Quick Accept**: Click ✓ button directly on card
3. **Bulk Search**: Search by phone for exact match
4. **Doctor View**: Use doctor filter to see workload
5. **Add Notes**: Always add remarks when accepting
6. **Save Time**: Use status tabs instead of searching

## ❓ FAQ

**Q: Where's the calendar view?**  
A: Coming soon! For now use date filter.

**Q: Can patient book online?**  
A: Not yet. Coming in future update.

**Q: Can I bulk update?**  
A: Not yet. One at a time for safety.

**Q: Where are recurring appointments?**  
A: Coming soon!

## 🛠️ Troubleshooting

**Search not working?**  
→ Try exact phone number or full name

**Button disabled?**  
→ Appointment may be completed (read-only)

**Data not updating?**  
→ Click Refresh button in header

**Modal not opening?**  
→ Check browser console (F12)

**Slow loading?**  
→ Use filters to reduce results

## 📞 Contact Info

For issues: Check the documentation files  
For customization: Contact development team  
For bugs: Create issue with details  

## 🎯 Next Steps

1. Go to Appointments page
2. Try searching for a patient
3. Click to open details
4. Practice accepting/rescheduling
5. Add remarks to get familiar
6. Try all filters

## 📚 Full Guides

For detailed information, see:
- **APPOINTMENTS_DATABASE_SCHEMA.md** - Data details
- **APPOINTMENTS_UI_GUIDE.md** - All features
- **APPOINTMENTS_IMPROVEMENTS.md** - What's new
- **APPOINTMENTS_COMPLETE_GUIDE.md** - Full reference

---

**Happy Scheduling! 🎉**

Questions? Check the documentation or contact support.
