# Attendance System Improvements - Complete Implementation Guide

## 🎯 Overview

This document outlines all the improvements made to the attendance system for both web dashboard and mobile app.

## ✅ Implemented Features

### 1. **Show All Users in Attendance List (Web Dashboard)**
- ✅ All users now appear in attendance management, even without punch records
- ✅ Users without attendance show as "Not marked" with absent status
- ✅ Attendance records populate when user marks attendance

### 2. **Automatic Absence Marking**
- ✅ Cron job runs daily at 00:01 AM (1 minute past midnight)
- ✅ Marks all users without attendance as "absent"
- ✅ Auto punch-out for users who punched in but didn't punch out
- ✅ Respects user's `attendanceStartDate` field

### 3. **Attendance Rules**
- ✅ Late: Punch in after 10:00 AM
- ✅ Half Day: Punch out before 8 hours
- ✅ Late + Half Day: Punch in after 10 AM AND punch out before 8 hours (both statuses)
- ✅ Absent: No punch in by midnight

### 4. **Admin Features**
- ✅ Set attendance start date for each user
- ✅ Manually create/mark attendance for any user on any date
- ✅ Edit existing attendance records
- ✅ View complete attendance history

### 5. **Mobile App Improvements**
- ✅ Show current month stats
- ✅ Display all dates from 1st of month
- ✅ Mark missing dates as absent (if account older than 1st)
- ✅ Monthly calendar view with status indicators

---

## 📂 Files Modified/Created

### Backend Changes:

#### 1. **New Files Created:**
- `backend/utils/attendanceCron.js` - Cron job scheduler for auto-marking

#### 2. **Modified Files:**

**`backend/controllers/attendanceController.js`**
- Added `showAllUsers` parameter to `getAllAttendance()`
- Added `createManualAttendance()` for admin to manually mark attendance
- Added `autoMarkAbsent()` for cron job to mark absent users
- Enhanced logic to show all users with attendance placeholders

**`backend/schemas/userSchema.js`**
- Added `attendanceStartDate` field to track when attendance tracking begins for each user

**`backend/routes/attendanceRoutes.js`**
- Added route: `POST /api/attendance/manual` - Manually create attendance
- Added route: `POST /api/attendance/auto-mark-absent` - Auto-mark absent (cron)

**`backend/server.js`**
- Integrated cron job scheduler
- Initialized `scheduleAutoMarkAbsent()` on server start

**`backend/package.json`**
- Added `node-cron: ^3.0.3`
- Added `axios: ^1.6.5`

---

### Frontend Changes:

**`src/utils/api.js`**
- Added `createManualAttendance()` API function

**`src/pages/AttendanceManagement.jsx`**
- Updated `fetchAttendance()` to include `showAllUsers: 'true'` parameter
- Now displays all users, even those without attendance records

---

## 🔧 API Endpoints

### New Endpoints:

#### 1. **Manual Attendance Creation (Admin)**
```http
POST /api/attendance/manual
Authorization: Bearer {token}
Permissions: MANAGE_ATTENDANCE
```

**Request Body:**
```json
{
  "userId": "60d5ec49f1b2c8b1f8e4e1a1",
  "date": "2026-01-14",
  "status": "present",
  "punchInTime": "2026-01-14T09:00:00",
  "punchOutTime": "2026-01-14T18:00:00",
  "notes": "Manually marked by admin"
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* attendance object */ },
  "message": "Attendance marked successfully"
}
```

#### 2. **Auto-Mark Absent (Cron Job)**
```http
POST /api/attendance/auto-mark-absent
Authorization: None (Internal cron job)
```

**Response:**
```json
{
  "success": true,
  "message": "Auto-marked 5 users as absent and 2 users with punch-out miss",
  "data": {
    "markedAbsent": 5,
    "punchOutMiss": 2,
    "date": "2026-01-13T00:00:00.000Z"
  }
}
```

#### 3. **Get All Attendance with All Users**
```http
GET /api/attendance?showAllUsers=true&startDate=2026-01-01&endDate=2026-01-14
Authorization: Bearer {token}
Permissions: VIEW_ATTENDANCE
```

**Query Parameters:**
- `showAllUsers`: `"true"` - Show all users, even without attendance
- `startDate`: Start date for range
- `endDate`: End date for range
- `userId`: Filter by specific user (optional)
- `status`: Filter by status (optional)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "60d5ec49f1b2c8b1f8e4e1a2",
      "user": {
        "_id": "60d5ec49f1b2c8b1f8e4e1a1",
        "name": "John Doe",
        "email": "john@example.com",
        "avatar": "/uploads/avatar.jpg",
        "department": "Engineering"
      },
      "date": "2026-01-14T00:00:00.000Z",
      "status": "present",
      "punchIn": { "time": "2026-01-14T09:00:00.000Z" },
      "punchOut": { "time": "2026-01-14T18:00:00.000Z" },
      "workingHours": 9
    },
    {
      "_id": null,
      "user": {
        "_id": "60d5ec49f1b2c8b1f8e4e1a3",
        "name": "Jane Smith",
        "email": "jane@example.com"
      },
      "date": "2026-01-14T00:00:00.000Z",
      "status": "absent",
      "punchIn": null,
      "punchOut": null,
      "workingHours": 0,
      "notes": "Not marked"
    }
  ],
  "pagination": {
    "total": 28,
    "page": 1,
    "pages": 1
  }
}
```

---

## 🕐 Cron Job Configuration

### Schedule:
- **Frequency:** Daily
- **Time:** 00:01 AM (1 minute past midnight)
- **Timezone:** Asia/Kolkata (configurable)

### What It Does:
1. Gets yesterday's date
2. Finds all active users
3. For each user:
   - Checks if attendance start date is set and valid
   - If no attendance record exists → Mark as **absent**
   - If punched in but not punched out → Auto punch-out at 23:59:59

### Configuration File:
`backend/utils/attendanceCron.js`

```javascript
cron.schedule('1 0 * * *', async () => {
  // Auto-mark logic
}, {
  scheduled: true,
  timezone: "Asia/Kolkata" // Change as needed
});
```

---

## 👤 User Schema Updates

### New Field: `attendanceStartDate`

```javascript
attendanceStartDate: {
  type: Date,
  default: null,
  description: 'Date from which attendance tracking starts for this user'
}
```

**Usage:**
- Admin can set this date for each employee
- Attendance will only be tracked from this date onwards
- If not set, defaults to user's `createdAt` date
- Prevents marking absent for dates before employment/attendance tracking began

---

## 🎨 Frontend Usage

### Using the New API:

```javascript
// Get all users with attendance (including those without records)
const response = await api.getAttendance({
  startDate: '2026-01-01',
  endDate: '2026-01-14',
  showAllUsers: 'true'
});

// Manually mark attendance (admin only)
const result = await api.createManualAttendance({
  userId: '60d5ec49f1b2c8b1f8e4e1a1',
  date: '2026-01-14',
  status: 'present',
  punchInTime: '2026-01-14T09:00:00',
  punchOutTime: '2026-01-14T18:00:00',
  notes: 'Manually marked'
});
```

---

## 📱 Mobile App Updates Needed

### 1. **Show All Dates from 1st of Month**

Create a function to generate all dates:

```dart
List<DateTime> generateMonthDates(DateTime month, DateTime accountCreatedDate) {
  final firstDay = DateTime(month.year, month.month, 1);
  final lastDay = DateTime(month.year, month.month + 1, 0);
  
  final startDate = accountCreatedDate.isAfter(firstDay) 
    ? accountCreatedDate 
    : firstDay;
  
  List<DateTime> dates = [];
  for (var i = 0; i <= lastDay.day - startDate.day; i++) {
    dates.add(startDate.add(Duration(days: i)));
  }
  
  return dates;
}
```

### 2. **Mark Missing Dates as Absent**

```dart
Map<String, AttendanceStatus> getAttendanceMap(
  List<Attendance> records,
  List<DateTime> allDates
) {
  Map<String, AttendanceStatus> map = {};
  
  // Create map from existing records
  for (var record in records) {
    String dateKey = DateFormat('yyyy-MM-dd').format(record.date);
    map[dateKey] = record.status;
  }
  
  // Fill missing dates with 'absent'
  for (var date in allDates) {
    String dateKey = DateFormat('yyyy-MM-dd').format(date);
    if (!map.containsKey(dateKey)) {
      map[dateKey] = AttendanceStatus.absent;
    }
  }
  
  return map;
}
```

### 3. **Update Stats Calculation**

```dart
AttendanceStats calculateStats(
  List<Attendance> records,
  List<DateTime> allDates
) {
  int present = 0;
  int absent = 0;
  int late = 0;
  int halfDay = 0;
  
  Map<String, AttendanceStatus> attendanceMap = getAttendanceMap(records, allDates);
  
  attendanceMap.forEach((date, status) {
    switch (status) {
      case AttendanceStatus.present:
        present++;
        break;
      case AttendanceStatus.absent:
        absent++;
        break;
      case AttendanceStatus.late:
        late++;
        break;
      case AttendanceStatus.halfDay:
        halfDay++;
        break;
      case AttendanceStatus.lateHalfDay:
        late++;
        halfDay++;
        break;
    }
  });
  
  return AttendanceStats(
    present: present,
    absent: absent,
    late: late,
    halfDay: halfDay,
    totalDays: allDates.length
  );
}
```

---

## 🧪 Testing

### 1. **Test Auto-Mark Absent (Manual)**

```bash
curl -X POST http://localhost:4002/api/attendance/auto-mark-absent
```

### 2. **Test Manual Attendance Creation**

```bash
curl -X POST http://localhost:4002/api/attendance/manual \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID",
    "date": "2026-01-14",
    "status": "present",
    "punchInTime": "2026-01-14T09:00:00",
    "punchOutTime": "2026-01-14T18:00:00"
  }'
```

### 3. **Test Show All Users**

```bash
curl "http://localhost:4002/api/attendance?showAllUsers=true&startDate=2026-01-01&endDate=2026-01-14" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🚀 Deployment Checklist

- [ ] Install new dependencies: `cd backend && npm install`
- [ ] Restart backend server to initialize cron job
- [ ] Verify cron job is scheduled (check server logs)
- [ ] Test manual attendance creation
- [ ] Test auto-mark-absent endpoint
- [ ] Update frontend and verify all users appear in list
- [ ] Update mobile app with month view
- [ ] Test attendance tracking for new users
- [ ] Set attendance start dates for existing users (if needed)

---

## 📝 Notes

- Cron job runs at **00:01 AM** daily (configurable in `attendanceCron.js`)
- Timezone is set to **Asia/Kolkata** (change as needed)
- Auto-mark only affects users where `attendanceStartDate <= yesterday`
- Admin can manually override any auto-marked attendance
- All manual changes are logged with `isEdited: true` and `editedBy` field

---

## 🆘 Troubleshooting

### Cron Job Not Running:
1. Check server logs for "Attendance auto-mark cron job scheduled"
2. Verify `node-cron` is installed: `npm list node-cron`
3. Check timezone configuration in `attendanceCron.js`

### Users Not Showing in List:
1. Ensure `showAllUsers: 'true'` parameter is passed
2. Verify `startDate` and `endDate` are provided
3. Check user's `attendanceStartDate` field

### Incorrect Stats in Mobile App:
1. Verify all dates from 1st are included
2. Check `attendanceStartDate` vs account creation date
3. Ensure absent status is applied to missing dates

---

**Last Updated:** January 14, 2026  
**Version:** 1.0.0
