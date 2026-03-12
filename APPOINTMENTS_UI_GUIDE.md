# Appointments UI - Quick Reference Guide

## Overview
The improved appointments management system provides a clean, intuitive interface for managing patient appointments. This guide covers all features and workflows.

## Main Components

### 1. AppointmentsPage (List View)
The main page showing all appointments with filtering, searching, and bulk actions.

#### Header Section
- **Title**: "Appointments" with description
- **Refresh Button**: Click to reload all appointments
- **Quick Stats**: Shows Total, Pending, Confirmed, Completed, Today count

#### Stats Dashboard
- **Color-coded cards** showing appointment counts
- **Interactive**: Click any card to filter by that status
- Shows "Today" appointments for quick reference

#### Search & Filter
- **Search Bar**: Search by:
  - Patient name
  - Phone number
  - Doctor name
  - Department
  - Membership number
  
- **Status Filter**: Click tabs to filter:
  - All (shows all appointments)
  - Pending (awaiting confirmation)
  - Confirmed (accepted appointments)
  - Completed (finished appointments)

- **Doctor Filter**: Dropdown to filter by specific doctor

#### Appointment Cards (List View)
Each appointment displays:

**Header Row**:
- Status indicator (animated dot)
- Color-coded status badge
- Delete button

**Patient Info**:
- Patient avatar with initial
- Patient name (clickable to view details)
- Booking type badge (Self/Family)
- Phone number
- Membership number (if available)

**Quick Details**:
- Doctor name
- Appointment type
- Scheduled date and time
- Remark preview (if present)

**Action Buttons** (Bottom):
- ✓ Accept - Confirm the appointment
- ⟳ Reschedule - Change date/time
- 🗑️ Delete - Remove appointment

#### Pagination
- Navigation controls for large datasets
- Shows current page and total pages
- Jump to specific page

### 2. AppointmentDetailPage (Detail View)
Accessed by clicking an appointment card. Shows complete appointment information.

#### Left Sidebar
**Patient Card**:
- Large patient avatar
- Full name
- Case ID
- Status badge

**Quick Actions Buttons**:
- Accept Appointment
- Reschedule
- Add Remark

#### Main Content Area

**Appointment Details**:
- Appointment Date (with day name)
- Appointment Time
- Doctor Name & Department
- Appointment Type
- Current Status

**Patient Information**:
- Phone Number
- Email (if available)
- Age
- Gender
- Membership Number
- Address
- Relationship (if family booking)

**Medical Information**:
- Reason for Visit
- Medical History
- Current Remarks

### 3. Modal Dialogs

#### Accept Appointment Modal
Opens when clicking "Accept" or "✓ Accept" button
- **Title**: "Accept Appointment"
- **Input**: Text area for remarks/notes
- **Buttons**: Cancel, Save
- **Result**: Status changes to "Confirmed"

#### Reschedule Modal
Opens when clicking "⟳ Reschedule" or "Reschedule" button
- **Title**: "Reschedule Appointment"
- **Fields**:
  - New Date (date picker)
  - New Time (time picker)
  - Note (optional text area)
- **Buttons**: Cancel, Reschedule
- **Result**: Status changes to "Rescheduled"

#### Remarks Modal
Opens when clicking "Add Remark" button
- **Title**: "Add Remark"
- **Input**: Large text area for private notes
- **Buttons**: Cancel, Save
- **Result**: Remark saved to appointment

#### Delete Confirmation
Opens when clicking delete button
- **Title**: "Delete Appointment?"
- **Warning**: Explains action cannot be undone
- **Buttons**: Cancel, Delete
- **Result**: Appointment removed permanently

### 4. Color Coding

| Status | Color | Meaning |
|---|---|---|
| Pending | Amber/Yellow | Awaiting confirmation |
| Confirmed | Emerald/Green | Appointment accepted |
| Completed | Blue | Appointment finished |
| Rescheduled | Purple | Date/time changed |
| Cancelled | Red | Appointment cancelled |

## Workflows

### Workflow 1: Accept a Pending Appointment
1. Go to Appointments page
2. Find the pending appointment (yellow dots)
3. Click the card OR click "✓ Accept" button
4. In modal, optionally add remarks
5. Click "Save"
6. Appointment status changes to "Confirmed"
7. Success notification appears

### Workflow 2: Reschedule an Appointment
1. View appointment (from list or detail page)
2. Click "⟳ Reschedule" button
3. Select new date from calendar
4. Select new time
5. Optionally add note about reschedule
6. Click "Reschedule"
7. Status changes to "Rescheduled"
8. Automatic notifications sent

### Workflow 3: Complete an Appointment
1. View appointment in detail
2. Click "Complete" button in Quick Actions
3. Confirm the action
4. Status changes to "Completed"
5. No further modifications allowed

### Workflow 4: Delete an Appointment
1. From list: Click delete icon (X) on card
2. From detail: Click delete icon in header
3. Confirm deletion in modal
4. Appointment removed
5. Notification confirms deletion

### Workflow 5: Search and Filter
1. Use search bar to find specific patient
2. Use status tabs to filter by status
3. Use doctor dropdown to filter by doctor
4. Combine multiple filters
5. Click on card to view details

### Workflow 6: Add Medical Notes
1. Open appointment detail
2. Scroll to "Medical Information" section
3. Click "Add Remark" button
4. Enter notes/remarks
5. Click "Save"
6. Remarks saved and visible in detail view

## Tips & Tricks

### Keyboard Shortcuts
- Search bar is always accessible at top
- Tab to navigate between action buttons
- Enter to confirm modals

### Efficient Management
1. **Use filters**: Reduce visible appointments to focus on priority
2. **Batch operations**: Sort by date to group appointments
3. **Add remarks**: Keep communication centralized
4. **Use membership numbers**: For quick reference and billing

### Common Actions
- **Quick Accept**: Click ✓ button directly on card
- **Quick Delete**: Click X button directly on card
- **View All Details**: Click anywhere on card to open detail view
- **Search By Phone**: Most reliable identifier for quick lookup

## Responsive Design

- **Desktop**: Full 3-column layout with detailed sidebar
- **Tablet**: Stacked layout, all features accessible
- **Mobile**: Single column, touch-friendly buttons

## Notifications

### Success Messages Appear When:
- Appointment accepted
- Appointment rescheduled
- Appointment completed
- Remark saved
- Appointment deleted

### Auto-Dismiss
- Success messages appear for 3 seconds
- Dismiss manually by closing
- Do not block other interactions

## Performance Notes

- Page loads appointments lazily
- Pagination prevents overloading
- Search is client-side with history
- Filters are instant without page reload

## Troubleshooting

| Issue | Solution |
|---|---|
| Search not working | Try exact phone number or first name |
| Button disabled | Appointment may be Completed or Cancelled |
| Modal not opening | Check browser console for errors |
| Data not refreshing | Click Refresh button in header |
| Slow loading | Reduce filter results or check internet |

## Best Practices

1. **Always add remarks when accepting** - Helps team understand context
2. **Reschedule with reason** - Improves communication
3. **Complete when done** - Keeps data accurate
4. **Use membership numbers** - For CRM integration
5. **Check today's count** - Start with "Today" filter for daily workflow

## Keyboard Navigation

- **Tab**: Move between buttons
- **Space/Enter**: Activate buttons
- **Esc**: Close modals
- **Ctrl+F**: Browser find (good for long lists)

## Data Fields Explained

### Required Fields
- **Patient Name**: Full name for identification
- **Patient Phone**: Primary contact method
- **Doctor ID/Name**: Who will see the patient
- **Appointment Date**: When to schedule
- **Reason**: Why the appointment is needed

### Optional Fields
- **Age**: For medical record
- **Gender**: For medical record
- **Email**: Alternative contact
- **Address**: For records
- **Medical History**: Context for Doctor
- **Remarks**: Internal notes

## Status Lifecycle

```
Pending → Confirmed → Completed
         → Rescheduled → (Confirmed again)
         → Cancelled (final)
```

## Integration Notes

### With Doctor Profile
- Doctor name auto-populated from doctor list
- Department shown with doctor info

### With Patient Database
- Membership lookups available
- Phone number validation

### With Notifications
- Automatic triggers on status change
- Email/SMS integration ready

## Future Features (Coming Soon)
- Calendar view
- Recurring appointments
- Appointment reminders
- Doctor availability sync
- Patient self-service portal
