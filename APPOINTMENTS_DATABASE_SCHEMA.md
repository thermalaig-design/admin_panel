# Appointments Database Schema Documentation

## Overview
The appointments feature provides a comprehensive system for managing patient appointments with doctors. This document covers the database schema, API endpoints, and UI implementation.

## Database Schema

### Table: `public.appointments`

#### Columns

| Column Name | Data Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | SERIAL | NO | Auto-increment | Primary key - unique appointment identifier |
| `patient_name` | VARCHAR(100) | NO | REQUIRED | Full name of the patient |
| `patient_phone` | VARCHAR(15) | NO | REQUIRED | Contact phone number |
| `patient_email` | VARCHAR(100) | YES | NULL | Email address |
| `patient_age` | INTEGER | YES | NULL | Patient's age in years |
| `patient_gender` | VARCHAR(10) | YES | NULL | Gender (Male/Female/Other) |
| `memory_number` | TEXT | YES | NULL | Hospital membership card number |
| `address` | TEXT | YES | NULL | Patient's residential address |
| `doctor_id` | TEXT | NO | REQUIRED | Doctor's unique identifier |
| `doctor_name` | VARCHAR(100) | NO | REQUIRED | Assigned doctor's name |
| `department` | VARCHAR(100) | YES | NULL | Medical department |
| `appointment_date` | DATE | NO | REQUIRED | Appointment scheduled date (YYYY-MM-DD) |
| `appointment_time` | TIME | YES | NULL | Appointment scheduled time (HH:MM:SS) |
| `appointment_type` | VARCHAR(50) | YES | 'General Consultation' | Type of appointment |
| `status` | VARCHAR(20) | YES | 'Pending' | Current appointment status |
| `reason` | TEXT | NO | REQUIRED | Reason for visit |
| `medical_history` | TEXT | YES | NULL | Patient's relevant medical history |
| `user_type` | VARCHAR(50) | YES | NULL | Type of user (Patient/Guardian/etc) |
| `user_id` | BIGINT | YES | NULL | User ID from auth system |
| `created_at` | TIMESTAMP | YES | NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMP | YES | NOW() | Last update timestamp |
| `booking_for` | VARCHAR(20) | YES | 'self' | Booking type: 'self' or 'family' |
| `patient_relationship` | TEXT | YES | NULL | Relationship if booking for family member |
| `remark` | TEXT | YES | NULL | Admin notes/remarks |
| `is_first_visit` | BOOLEAN | YES | NULL | Whether it's patient's first visit |

### Status Values (Constraint)
Valid status values are:
- `Pending` - Newly created, awaiting confirmation
- `Confirmed` - Accepted by admin/doctor
- `Cancelled` - Appointment cancelled
- `Completed` - Appointment completed
- `Rescheduled` - Appointment rescheduled

### Indexes

| Index Name | Columns | Type | Purpose |
|---|---|---|---|
| `idx_appointments_patient_phone` | patient_phone | BTREE | Fast lookup by phone |
| `idx_appointments_doctor_id` | doctor_id | BTREE | Find appointments by doctor |
| `idx_appointments_appointment_date` | appointment_date | BTREE | Find appointments by date |
| `idx_appointments_status` | status | BTREE | Filter by status |
| `idx_appointments_created_at` | created_at | BTREE | Chronological queries |

### Triggers

#### 1. `appointment_changes_notification_trigger`
- **Event**: AFTER UPDATE on remark, appointment_date, appointment_time
- **Function**: `notify_appointment_changes()`
- **Purpose**: Send notifications when appointment details change

#### 2. `update_appointments_updated_at_trigger`
- **Event**: BEFORE UPDATE on appointments
- **Function**: `update_appointments_updated_at()`
- **Purpose**: Automatically update the `updated_at` timestamp

## API Endpoints

### Get All Appointments (Admin)
```
GET /api/admin/appointments
Response: { data: Appointment[] }
```

### Update Appointment
```
PATCH /api/admin/appointments/:id
Body: {
  status?: 'Pending' | 'Confirmed' | 'Completed' | 'Rescheduled' | 'Cancelled'
  appointment_date?: string (YYYY-MM-DD)
  appointment_time?: string (HH:MM)
  remark?: string
  ...other fields
}
```

### Delete Appointment
```
DELETE /api/admin/appointments/:id
```

## UI Components

### AppointmentsPage.jsx
Main list view for all appointments with:
- Status filtering (All, Pending, Confirmed, Completed, Rescheduled)
- Doctor filtering
- Patient search (by name, phone, doctor, membership)
- Quick action buttons (Accept, Reschedule, Delete)
- Pagination support
- Stats dashboard showing counts per status

### AppointmentDetailPage.jsx
Detailed view for individual appointment with:
- Complete patient information
- Appointment details
- Medical information (reason, history)
- Quick action buttons
- Modal dialogs for:
  - Accepting with remarks
  - Rescheduling with new date/time
  - Adding/editing remarks

## Data Flow

### Creating Appointment
1. User provides appointment details
2. Required fields: patient_name, patient_phone, doctor_id, doctor_name, appointment_date, reason
3. Status defaults to 'Pending'
4. created_at automatically set to current time

### Accepting Appointment
1. Admin clicks "Accept" button
2. Optionally adds remarks
3. Status changes to 'Confirmed'
4. Trigger notifies relevant parties

### Rescheduling Appointment
1. Admin clicks "Reschedule"
2. Selects new date and time
3. Optional remarks about reschedule
4. Status changes to 'Rescheduled'
5. Updated_at timestamp updated
6. Notification triggered

### Completing Appointment
1. Admin clicks "Complete"
2. Status changes to 'Completed'
3. No further modifications allowed

## Key Features

### Timestamps
- Automatically managed by database triggers
- `created_at`: Set once at creation
- `updated_at`: Updated on any modification

### Notifications
- Triggered on status/date/time changes
- Configurable notification rules via triggers

### Data Validation
- Phone must be provided
- Patient name is required
- Doctor assignment is mandatory
- Appointment date required

### Search & Filter
- Full-text search on patient name, phone, doctor
- Filter by appointment status
- Filter by assigned doctor
- Pagination for large datasets

## Best Practices

1. **Date/Time Handling**: Always use YYYY-MM-DD for dates and HH:MM for times
2. **Status Management**: Follow the status flow: Pending → Confirmed → Completed
3. **Remarks**: Use for communicating with team about appointment status
4. **Membership**: Always capture membership numbers for billing/CRM integration
5. **Medical History**: Record relevant history for faster consultations

## Performance Considerations

- Indexes on frequently queried columns (phone, doctor_id, date, status)
- Pagination prevents large dataset loading
- Created_at index helps with chronological queries
- Status index speeds up filtering operations

## Future Enhancements

1. Recurring appointments
2. Appointment reminders (SMS/Email)
3. Doctor availability calendar integration
4. Patient self-booking portal
5. Appointment cancellation by patient
6. Performance metrics/analytics
7. Integration with doctor schedules
8. Waitlist management
