package com.project.back_end.services;

import com.project.back_end.DTO.AppointmentDTO;
import com.project.back_end.DTO.Login;
import com.project.back_end.models.Admin;
import com.project.back_end.models.Doctor;
import com.project.back_end.models.Patient;
import com.project.back_end.repo.AdminRepository;
import com.project.back_end.repo.PatientRepository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@org.springframework.stereotype.Service
public class Service {

    private final TokenService tokenService;
    private final AdminRepository adminRepository;
    private final PatientRepository patientRepository;
    private final DoctorService doctorService;
    private final PatientService patientService;

    public Service(TokenService tokenService, AdminRepository adminRepository,
                   PatientRepository patientRepository, DoctorService doctorService,
                   PatientService patientService) {
        this.tokenService = tokenService;
        this.adminRepository = adminRepository;
        this.patientRepository = patientRepository;
        this.doctorService = doctorService;
        this.patientService = patientService;
    }

    public boolean validateToken(String token, String role) {
        return tokenService.validateToken(token, role);
    }

    public Map<String, Object> validateAdmin(Admin admin) {
        Map<String, Object> response = new HashMap<>();
        Admin found = adminRepository.findByUsername(admin.getUsername());
        if (found != null && found.getPassword().equals(admin.getPassword())) {
            response.put("token", tokenService.generateToken(found.getUsername(), "admin"));
            response.put("message", "Login successful");
            return response;
        }
        response.put("message", "Invalid credentials");
        return response;
    }

    public Map<String, Object> validatePatientLogin(Login login) {
        Map<String, Object> response = new HashMap<>();
        Patient patient = patientRepository.findByEmail(login.getEmail());
        if (patient != null && patient.getPassword().equals(login.getPassword())) {
            response.put("token", tokenService.generateToken(patient.getEmail(), "patient"));
            response.put("message", "Login successful");
            return response;
        }
        response.put("message", "Invalid credentials");
        return response;
    }

    public boolean patientExists(Patient patient) {
        return patientRepository.findByEmailOrPhone(patient.getEmail(), patient.getPhone()) != null;
    }

    public List<Doctor> filterDoctors(String name, String time, String specialty) {
        return doctorService.filterDoctors(name, time, specialty);
    }

    public Map<String, Object> filterPatientAppointments(String condition, String name, String token) {
        Map<String, Object> response = new HashMap<>();
        String email = tokenService.getEmailFromToken(token);
        Patient patient = patientRepository.findByEmail(email);
        if (patient == null) {
            response.put("message", "Patient not found");
            return response;
        }

        List<AppointmentDTO> appointments;
        boolean hasCondition = isValidFilterValue(condition);
        boolean hasName = isValidFilterValue(name);

        if (hasCondition && hasName) {
            appointments = patientService.filterByDoctorAndCondition(patient.getId(), name, condition);
        } else if (hasCondition) {
            appointments = patientService.filterByCondition(patient.getId(), condition);
        } else if (hasName) {
            appointments = patientService.filterByDoctor(patient.getId(), name);
        } else {
            appointments = patientService.getPatientAppointment(patient.getId());
        }

        response.put("appointments", appointments);
        return response;
    }

    private boolean isValidFilterValue(String value) {
        return value != null && !value.isBlank() && !"null".equalsIgnoreCase(value);
    }
}
