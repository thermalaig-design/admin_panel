# OPD Scheduler - Day-Wise Schedule Implementation 

## Overview
I've successfully updated the Doctor management system to support **day-wise OPD scheduling**. Now doctors can have different start/end times for different days of the week, with auto-generated appointment slots for each day.

## What Changed

### 1. **New DayWiseOPDScheduler Component** 
Created [src/admin/components/DayWiseOPDScheduler.jsx](src/admin/components/DayWiseOPDScheduler.jsx)

This component manages:
- Day-by-day scheduling (Monday, Tuesday, etc.)
- Individual start/end times per day
- Automatic slot generation based on duration
- Clean, expandable UI for each day
- Ability to add/remove days dynamically

### 2. **Updated DoctorsPage** 
Modified [src/admin/pages/DoctorsPage.jsx](src/admin/pages/DoctorsPage.jsx)

- Replaced single Global OPD schedule with day-wise scheduling
- Integrated new DayWiseOPDScheduler component for both General and Private OPD
- Updated form data handling to work with new schedule format
- Updated doctor card display to show day-wise schedules

### 3. **Database Schema**
Uses existing columns:
- `general_opd_schedule` (JSONB) - Array of day schedules for General OPD
- `private_opd_schedule` (JSONB) - Array of day schedules for Private OPD

## Data Structure

Each schedule is stored as a JSON array:

```json
[
  {
    "day": "Mon",
    "start": "09:00",
    "end": "12:00",
    "slotDuration": 15,
    "slots": [
      {
        "start": "09:00",
        "end": "09:15",
        "label": "9:00 AM – 9:15 AM"
      },
      {
        "start": "09:15",
        "end": "09:30",
        "label": "9:15 AM – 9:30 AM"
      }
      // ... more slots generated based on duration
    ]
  },
  {
    "day": "Wed",
    "start": "12:00",
    "end": "16:00",
    "slotDuration": 15,
    "slots": [ /* ... */ ]
  }
]
```

## How to Use

### Adding/Editing a Doctor

1. **Click "Add Doctor"** or edit an existing doctor
2. **OPD Schedule Sections**:
   - General OPD Schedule (Blue)
   - Private OPD Schedule (Purple)
3. **In Each Section**:
   - Click **"Add Day"** to add a specific day
   - Days expand to show:
     - **Start Time**: Select clinic start time
     - **End Time**: Select clinic end time
     - **Slot Duration**: How long each appointment slot is (e.g., 15 minutes)
     - **Generate**: Auto-generate all slots for that time range
   - Multiple days can have different times
   - Remove any day with the trash icon

### Example Scenarios

**Example 1: Doctor available Mon-Wed morning, Fri afternoon**
```
General OPD:
  Monday:  9:00 AM - 12:00 PM  (30 min slots)
  Tuesday: 9:00 AM - 12:00 PM  (30 min slots)
  Wednesday: 9:00 AM - 12:00 PM (30 min slots)
  Friday: 2:00 PM - 5:00 PM     (30 min slots)
```

**Example 2: Different schedules for General vs Private**
```
General OPD: Mon, Wed, Fri: 9 AM - 1 PM (20 min slots)
Private OPD: Tue, Thu: 2 PM - 6 PM (30 min slots)
```

## Key Features

✅ **Day-Wise Control** - Set different hours for each day
✅ **Auto-Generate Slots** - Automatically create appointment slots based on duration  
✅ **Clean UI** - Expandable day cards, easy to manage
✅ **Flexible Duration** - Set any slot duration (15, 20, 30 minutes, etc.)
✅ **Add/Remove Days** - Dynamically add or remove days  
✅ **Visual Display** - Doctor cards show day-wise schedules with slot counts

## Backward Compatibility

⚠️ **Note**: The old format (single start/end time) is still stored in the database:
- `general_opd_start`, `general_opd_end` 
- `private_opd_start`, `private_opd_end`
- `general_opd_slots`, `private_opd_slots`

The new system uses:
- `general_opd_schedule` (JSONB array)
- `private_opd_schedule` (JSONB array)

Old data  will still work for display, but new/edited doctors will use the new format.

## Migration Notes

If you want to migrate existing doctors to the new format, you can:

1. Use a migration script to convert old format to new format
2. Or manually re-enter each doctor's schedule using the new form

Example conversion:
```javascript
// Old format
{
  general_opd_start: "09:00",
  general_opd_end: "12:00",
  general_opd_days: "Mon, Tue, Wed"
  // ...
}

// New format
{
  general_opd_schedule: [
    { day: 'Mon', start: '09:00', end: '12:00', slotDuration: 15, slots: [...] },
    { day: 'Tue', start: '09:00', end: '12:00', slotDuration: 15, slots: [...] },
    { day: 'Wed', start: '09:00', end: '12:00', slotDuration: 15, slots: [...] }
  ]
}
```

## Files Modified

1. **[src/admin/components/DayWiseOPDScheduler.jsx](src/admin/components/DayWiseOPDScheduler.jsx)** - NEW component
2. **[src/admin/pages/DoctorsPage.jsx](src/admin/pages/DoctorsPage.jsx)** - Updated to use new component

## Testing

To test the implementation:

1. Start the dev server: `npm run dev`
2. Go to Admin > Doctors
3. Click "Add Doctor" to create a new doctor
4. Fill in basic info
5. Check "Available for OPD"
6. In General/Private OPD sections:
   - Click "Add Day"
   - Set times and duration
   - Click "Generate" to create slots
7. Save the doctor

## UI Design

The new interface is:
- **Simple & Clean** - Minimal, focused design
- **Color-Coded** - Blue for General OPD, Purple for Private OPD
- **Intuitive** - Expandable day cards with clear labels
- **Responsive** - Works on mobile and desktop

---

**Status**: ✅ Complete and ready to use
