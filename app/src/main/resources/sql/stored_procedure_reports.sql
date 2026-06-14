USE cms;

-- Sample doctors
INSERT INTO doctors (name, specialty, email, password, phone)
VALUES
    ('Dr. Asha Rao', 'Cardiology', 'asha.rao@example.com', 'password1', '9876500001'),
    ('Dr. Vikram Shah', 'Dermatology', 'vikram.shah@example.com', 'password2', '9876500002'),
    ('Dr. Neha Iyer', 'Pediatrics', 'neha.iyer@example.com', 'password3', '9876500003')
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    specialty = VALUES(specialty),
    password = VALUES(password),
    phone = VALUES(phone);

-- Sample patients
INSERT INTO patients (name, email, password, phone, address)
VALUES
    ('Arun Kumar', 'arun.kumar@example.com', 'patient1', '9876510001', '12 Lake Road'),
    ('Divya Singh', 'divya.singh@example.com', 'patient2', '9876510002', '24 Park Street'),
    ('Farah Khan', 'farah.khan@example.com', 'patient3', '9876510003', '18 Hill Avenue'),
    ('Rohan Das', 'rohan.das@example.com', 'patient4', '9876510004', '31 River Lane')
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    password = VALUES(password),
    phone = VALUES(phone),
    address = VALUES(address);

SET @asha_id = (SELECT id FROM doctors WHERE email = 'asha.rao@example.com');
SET @vikram_id = (SELECT id FROM doctors WHERE email = 'vikram.shah@example.com');
SET @neha_id = (SELECT id FROM doctors WHERE email = 'neha.iyer@example.com');

SET @arun_id = (SELECT id FROM patients WHERE email = 'arun.kumar@example.com');
SET @divya_id = (SELECT id FROM patients WHERE email = 'divya.singh@example.com');
SET @farah_id = (SELECT id FROM patients WHERE email = 'farah.khan@example.com');
SET @rohan_id = (SELECT id FROM patients WHERE email = 'rohan.das@example.com');

-- Remove only this script's sample appointments so it can be rerun.
DELETE FROM appointments
WHERE patient_id IN (@arun_id, @divya_id, @farah_id, @rohan_id)
  AND appointment_time >= '2026-06-01 00:00:00'
  AND appointment_time < '2027-01-01 00:00:00';

-- Status: 0 = scheduled, 1 = completed.
INSERT INTO appointments (doctor_id, patient_id, appointment_time, status)
VALUES
    (@asha_id, @arun_id,   '2026-06-15 09:00:00', 1),
    (@asha_id, @divya_id,  '2026-06-15 10:00:00', 1),
    (@asha_id, @farah_id,  '2026-06-15 11:00:00', 1),
    (@vikram_id, @rohan_id,'2026-06-15 09:30:00', 1),
    (@neha_id, @arun_id,   '2026-06-15 14:00:00', 0),
    (@asha_id, @rohan_id,  '2026-06-20 09:00:00', 1),
    (@vikram_id, @arun_id, '2026-06-21 10:00:00', 1),
    (@neha_id, @divya_id,  '2026-07-05 11:00:00', 1),
    (@asha_id, @arun_id,   '2026-08-10 09:00:00', 1),
    (@asha_id, @divya_id,  '2026-09-12 10:00:00', 1),
    (@vikram_id, @farah_id,'2026-10-18 11:00:00', 1);

DROP PROCEDURE IF EXISTS GetDailyAppointmentReportByDoctor;
DROP PROCEDURE IF EXISTS GetDoctorWithMostPatientsByMonth;
DROP PROCEDURE IF EXISTS GetDoctorWithMostPatientsByYear;

DELIMITER //

CREATE PROCEDURE GetDailyAppointmentReportByDoctor(IN report_date DATE)
BEGIN
    SELECT
        d.id AS doctor_id,
        d.name AS doctor_name,
        d.specialty,
        COUNT(a.id) AS total_appointments,
        SUM(CASE WHEN a.status = 1 THEN 1 ELSE 0 END) AS completed_appointments,
        SUM(CASE WHEN a.status = 0 THEN 1 ELSE 0 END) AS scheduled_appointments
    FROM doctors d
    JOIN appointments a ON a.doctor_id = d.id
    WHERE a.appointment_time >= report_date
      AND a.appointment_time < DATE_ADD(report_date, INTERVAL 1 DAY)
    GROUP BY d.id, d.name, d.specialty
    ORDER BY total_appointments DESC, d.name;
END //

CREATE PROCEDURE GetDoctorWithMostPatientsByMonth(
    IN report_year INT,
    IN report_month INT
)
BEGIN
    SELECT
        d.id AS doctor_id,
        d.name AS doctor_name,
        d.specialty,
        COUNT(DISTINCT a.patient_id) AS patients_seen
    FROM doctors d
    JOIN appointments a ON a.doctor_id = d.id
    WHERE a.status = 1
      AND a.appointment_time >= STR_TO_DATE(
          CONCAT(report_year, '-', LPAD(report_month, 2, '0'), '-01'),
          '%Y-%m-%d'
      )
      AND a.appointment_time < DATE_ADD(
          STR_TO_DATE(
              CONCAT(report_year, '-', LPAD(report_month, 2, '0'), '-01'),
              '%Y-%m-%d'
          ),
          INTERVAL 1 MONTH
      )
    GROUP BY d.id, d.name, d.specialty
    ORDER BY patients_seen DESC, d.name
    LIMIT 1;
END //

CREATE PROCEDURE GetDoctorWithMostPatientsByYear(IN report_year INT)
BEGIN
    SELECT
        d.id AS doctor_id,
        d.name AS doctor_name,
        d.specialty,
        COUNT(DISTINCT a.patient_id) AS patients_seen
    FROM doctors d
    JOIN appointments a ON a.doctor_id = d.id
    WHERE a.status = 1
      AND a.appointment_time >= MAKEDATE(report_year, 1)
      AND a.appointment_time < MAKEDATE(report_year + 1, 1)
    GROUP BY d.id, d.name, d.specialty
    ORDER BY patients_seen DESC, d.name
    LIMIT 1;
END //

DELIMITER ;

-- Required evaluation statements
CALL GetDailyAppointmentReportByDoctor('2026-06-15');
CALL GetDoctorWithMostPatientsByMonth(2026, 6);
CALL GetDoctorWithMostPatientsByYear(2026);
