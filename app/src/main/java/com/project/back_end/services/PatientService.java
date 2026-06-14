package com.project.back_end.services;

import com.project.back_end.DTO.AppointmentDTO;
import com.project.back_end.models.Patient;
import com.project.back_end.repo.AppointmentRepository;
import com.project.back_end.repo.PatientRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class PatientService {

    private final PatientRepository patientRepository;
    private final AppointmentRepository appointmentRepository;
    private final TokenService tokenService;

    public PatientService(PatientRepository patientRepository,
                          AppointmentRepository appointmentRepository,
                          TokenService tokenService) {
        this.patientRepository = patientRepository;
        this.appointmentRepository = appointmentRepository;
        this.tokenService = tokenService;
    }

    public int createPatient(Patient patient) {
        try {
            patientRepository.save(patient);
            return 1;
        } catch (RuntimeException exception) {
            return 0;
        }
    }

    @Transactional(readOnly = true)
    public List<AppointmentDTO> getPatientAppointment(Long patientId) {
        return appointmentRepository.findByPatientId(patientId).stream()
                .map(AppointmentDTO::new)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AppointmentDTO> filterByCondition(Long patientId, String condition) {
        int status = "past".equalsIgnoreCase(condition) ? 1 : 0;
        return appointmentRepository.findByPatient_IdAndStatusOrderByAppointmentTimeAsc(patientId, status)
                .stream()
                .map(AppointmentDTO::new)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AppointmentDTO> filterByDoctor(Long patientId, String doctorName) {
        return appointmentRepository.filterByDoctorNameAndPatientId(doctorName, patientId).stream()
                .map(AppointmentDTO::new)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AppointmentDTO> filterByDoctorAndCondition(Long patientId, String doctorName, String condition) {
        int status = "past".equalsIgnoreCase(condition) ? 1 : 0;
        return appointmentRepository.filterByDoctorNameAndPatientIdAndStatus(doctorName, patientId, status)
                .stream()
                .map(AppointmentDTO::new)
                .collect(Collectors.toList());
    }

    public Map<String, Object> getPatientDetails(String token) {
        Map<String, Object> response = new HashMap<>();
        String email = tokenService.getEmailFromToken(token);
        Patient patient = patientRepository.findByEmail(email);
        if (patient == null) {
            response.put("message", "Patient not found");
            return response;
        }
        response.put("patient", patient);
        return response;
    }
}
