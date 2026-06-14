package com.project.back_end.services;

import com.project.back_end.DTO.AppointmentDTO;
import com.project.back_end.models.Appointment;
import com.project.back_end.models.Doctor;
import com.project.back_end.models.Patient;
import com.project.back_end.repo.AppointmentRepository;
import com.project.back_end.repo.DoctorRepository;
import com.project.back_end.repo.PatientRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final TokenService tokenService;

    public AppointmentService(AppointmentRepository appointmentRepository,
                              DoctorRepository doctorRepository,
                              PatientRepository patientRepository,
                              TokenService tokenService) {
        this.appointmentRepository = appointmentRepository;
        this.doctorRepository = doctorRepository;
        this.patientRepository = patientRepository;
        this.tokenService = tokenService;
    }

    @Transactional
    public int bookAppointment(Appointment appointment) {
        try {
            Doctor doctor = doctorRepository.findById(appointment.getDoctor().getId()).orElse(null);
            Patient patient = patientRepository.findById(appointment.getPatient().getId()).orElse(null);
            if (doctor == null || patient == null) {
                return 0;
            }

            LocalDateTime start = appointment.getAppointmentTime();
            LocalDateTime end = start.plusHours(1);
            List<Appointment> conflicts = appointmentRepository.findByDoctorIdAndAppointmentTimeBetween(
                    doctor.getId(), start, end);
            if (!conflicts.isEmpty()) {
                return 0;
            }

            appointment.setDoctor(doctor);
            appointment.setPatient(patient);
            appointmentRepository.save(appointment);
            return 1;
        } catch (RuntimeException exception) {
            return 0;
        }
    }

    @Transactional
    public Map<String, String> updateAppointment(Appointment appointment) {
        Map<String, String> response = new HashMap<>();
        Appointment existing = appointmentRepository.findById(appointment.getId()).orElse(null);
        if (existing == null) {
            response.put("message", "Appointment not found");
            return response;
        }

        if (!existing.getPatient().getId().equals(appointment.getPatient().getId())) {
            response.put("message", "Unauthorized to update this appointment");
            return response;
        }

        Doctor doctor = doctorRepository.findById(appointment.getDoctor().getId()).orElse(null);
        if (doctor == null) {
            response.put("message", "Invalid doctor");
            return response;
        }

        LocalDateTime start = appointment.getAppointmentTime();
        LocalDateTime end = start.plusHours(1);
        List<Appointment> conflicts = appointmentRepository.findByDoctorIdAndAppointmentTimeBetween(
                doctor.getId(), start, end);
        boolean slotTaken = conflicts.stream().anyMatch(conflict -> !conflict.getId().equals(appointment.getId()));
        if (slotTaken) {
            response.put("message", "Selected time slot is not available");
            return response;
        }

        existing.setDoctor(doctor);
        existing.setAppointmentTime(appointment.getAppointmentTime());
        existing.setStatus(appointment.getStatus());
        appointmentRepository.save(existing);
        response.put("message", "Appointment updated successfully");
        return response;
    }

    @Transactional
    public Map<String, String> cancelAppointment(Long appointmentId, String patientEmail) {
        Map<String, String> response = new HashMap<>();
        Appointment appointment = appointmentRepository.findById(appointmentId).orElse(null);
        if (appointment == null) {
            response.put("message", "Appointment not found");
            return response;
        }

        if (!appointment.getPatient().getEmail().equals(patientEmail)) {
            response.put("message", "Unauthorized to cancel this appointment");
            return response;
        }

        appointmentRepository.delete(appointment);
        response.put("message", "Appointment cancelled successfully");
        return response;
    }

    @Transactional(readOnly = true)
    public List<AppointmentDTO> getAppointments(String token, LocalDate date, String patientName) {
        String email = tokenService.getEmailFromToken(token);
        Doctor doctor = doctorRepository.findByEmail(email);
        if (doctor == null) {
            return List.of();
        }

        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = date.atTime(23, 59, 59);
        List<Appointment> appointments;

        if (patientName == null || patientName.isBlank() || "null".equalsIgnoreCase(patientName)) {
            appointments = appointmentRepository.findByDoctorIdAndAppointmentTimeBetween(
                    doctor.getId(), start, end);
        } else {
            appointments = appointmentRepository.findByDoctorIdAndPatient_NameContainingIgnoreCaseAndAppointmentTimeBetween(
                    doctor.getId(), patientName, start, end);
        }

        return appointments.stream().map(AppointmentDTO::new).collect(Collectors.toList());
    }

    @Transactional
    public void changeStatus(long appointmentId, int status) {
        appointmentRepository.updateStatus(status, appointmentId);
    }
}
