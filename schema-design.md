# Smart Clinic Management System - Database Schema Design

## MySQL Database Design

### 1. patients

| Column Name   | Data Type    | Constraints                 |
| ------------- | ------------ | --------------------------- |
| patient_id    | BIGINT       | PRIMARY KEY, AUTO_INCREMENT |
| first_name    | VARCHAR(50)  | NOT NULL                    |
| last_name     | VARCHAR(50)  | NOT NULL                    |
| email         | VARCHAR(100) | NOT NULL, UNIQUE            |
| phone         | VARCHAR(15)  | NOT NULL, UNIQUE            |
| date_of_birth | DATE         | NOT NULL                    |
| created_at    | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP   |

**Purpose:** Stores patient information and account details.

---

### 2. doctors

| Column Name    | Data Type    | Constraints                 |
| -------------- | ------------ | --------------------------- |
| doctor_id      | BIGINT       | PRIMARY KEY, AUTO_INCREMENT |
| first_name     | VARCHAR(50)  | NOT NULL                    |
| last_name      | VARCHAR(50)  | NOT NULL                    |
| specialization | VARCHAR(100) | NOT NULL                    |
| email          | VARCHAR(100) | NOT NULL, UNIQUE            |
| phone          | VARCHAR(15)  | NOT NULL, UNIQUE            |
| created_at     | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP   |

**Purpose:** Stores doctor profiles and specialties.

---

### 3. appointments

| Column Name      | Data Type    | Constraints                                           |
| ---------------- | ------------ | ----------------------------------------------------- |
| appointment_id   | BIGINT       | PRIMARY KEY, AUTO_INCREMENT                           |
| patient_id       | BIGINT       | NOT NULL, FOREIGN KEY REFERENCES patients(patient_id) |
| doctor_id        | BIGINT       | NOT NULL, FOREIGN KEY REFERENCES doctors(doctor_id)   |
| appointment_date | DATETIME     | NOT NULL                                              |
| status           | VARCHAR(20)  | NOT NULL DEFAULT 'SCHEDULED'                          |
| notes            | VARCHAR(500) | NULL                                                  |

**Purpose:** Maintains appointment schedules between patients and doctors.

---

### 4. admin

| Column Name   | Data Type    | Constraints                 |
| ------------- | ------------ | --------------------------- |
| admin_id      | BIGINT       | PRIMARY KEY, AUTO_INCREMENT |
| username      | VARCHAR(50)  | NOT NULL, UNIQUE            |
| email         | VARCHAR(100) | NOT NULL, UNIQUE            |
| password_hash | VARCHAR(255) | NOT NULL                    |
| created_at    | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP   |

**Purpose:** Stores administrator accounts used to manage the system.

---

## Relationship Summary

* One Patient can have many Appointments.
* One Doctor can have many Appointments.
* Each Appointment belongs to exactly one Patient and one Doctor.
* Admin users manage system operations but are not directly linked to appointments.

---

## MongoDB Collection Design

### Collection: prescriptions

MongoDB is chosen for prescriptions because prescription structures can evolve over time and may contain variable medication lists and notes.

### Sample Document

```json
{
  "_id": "6654f9b5a12c4f8d12345678",
  "patientId": 101,
  "doctorId": 25,
  "appointmentId": 5001,
  "prescriptionDate": "2026-06-14T10:30:00Z",
  "diagnosis": "Seasonal Allergy",
  "medications": [
    {
      "name": "Cetirizine",
      "dosage": "10mg",
      "frequency": "Once Daily",
      "durationDays": 7
    },
    {
      "name": "Nasal Spray",
      "dosage": "2 Sprays",
      "frequency": "Twice Daily",
      "durationDays": 5
    }
  ],
  "instructions": {
    "diet": "Avoid cold beverages",
    "followUpRequired": true,
    "followUpAfterDays": 14
  },
  "attachments": [
    {
      "fileName": "allergy_report.pdf",
      "fileType": "pdf"
    }
  ]
}
```

### Design Justification

* MySQL is used for Patients, Doctors, Appointments, and Admins because these entities require strong relationships, referential integrity, and transactional consistency.
* MongoDB is used for Prescriptions because prescription data may vary significantly between patients and can contain nested structures such as medication lists, instructions, and attachments.
* The hybrid database approach combines the reliability of relational databases with the flexibility of document-oriented storage.