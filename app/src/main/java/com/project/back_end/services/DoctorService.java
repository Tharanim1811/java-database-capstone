package com.project.back_end.services;

import com.project.back_end.DTO.Login;
import com.project.back_end.models.Appointment;
import com.project.back_end.models.Doctor;
import com.project.back_end.repo.AppointmentRepository;
import com.project.back_end.repo.DoctorRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class DoctorService {

    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;
    private final TokenService tokenService;

    public DoctorService(DoctorRepository doctorRepository,
                         AppointmentRepository appointmentRepository,
                         TokenService tokenService) {
        this.doctorRepository = doctorRepository;
        this.appointmentRepository = appointmentRepository;
        this.tokenService = tokenService;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getDoctorAvailability(Long doctorId, LocalDate date) {
        Map<String, Object> response = new HashMap<>();
        Doctor doctor = doctorRepository.findById(doctorId).orElse(null);
        if (doctor == null) {
            response.put("message", "Doctor not found");
            return response;
        }

        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = date.atTime(23, 59, 59);
        List<Appointment> bookedAppointments = appointmentRepository.findByDoctorIdAndAppointmentTimeBetween(
                doctorId, start, end);

        Set<String> bookedSlots = new HashSet<>();
        for (Appointment appointment : bookedAppointments) {
            String timePrefix = appointment.getAppointmentTime().toLocalTime().toString().substring(0, 5);
            for (String slot : doctor.getAvailableTimes()) {
                if (slot.startsWith(timePrefix)) {
                    bookedSlots.add(slot);
                }
            }
        }

        List<String> availableTimes = doctor.getAvailableTimes().stream()
                .filter(slot -> !bookedSlots.contains(slot))
                .collect(Collectors.toList());

        response.put("availableTimes", availableTimes);
        return response;
    }

    public int saveDoctor(Doctor doctor) {
        try {
            if (doctorRepository.findByEmail(doctor.getEmail()) != null) {
                return -1;
            }
            doctorRepository.save(doctor);
            return 1;
        } catch (RuntimeException exception) {
            return 0;
        }
    }

    public int updateDoctor(Doctor doctor) {
        try {
            if (!doctorRepository.existsById(doctor.getId())) {
                return -1;
            }
            doctorRepository.save(doctor);
            return 1;
        } catch (RuntimeException exception) {
            return 0;
        }
    }

    @Transactional(readOnly = true)
    public List<Doctor> getDoctors() {
        return doctorRepository.findAll();
    }

    @Transactional
    public int deleteDoctor(Long doctorId) {
        try {
            if (!doctorRepository.existsById(doctorId)) {
                return -1;
            }
            appointmentRepository.deleteAllByDoctorId(doctorId);
            doctorRepository.deleteById(doctorId);
            return 1;
        } catch (RuntimeException exception) {
            return 0;
        }
    }

    public Map<String, Object> validateDoctor(Login login) {
        Map<String, Object> response = new HashMap<>();
        Doctor doctor = doctorRepository.findByEmail(login.getEmail());
        if (doctor == null || !doctor.getPassword().equals(login.getPassword())) {
            response.put("message", "Invalid credentials");
            return response;
        }
        response.put("token", tokenService.generateToken(doctor.getEmail(), "doctor"));
        response.put("message", "Login successful");
        return response;
    }

    @Transactional(readOnly = true)
    public List<Doctor> findDoctorByName(String name) {
        return doctorRepository.findByNameLike("%" + name + "%");
    }

    public List<Doctor> filterDoctors(String name, String time, String specialty) {
        boolean hasName = isValidFilterValue(name);
        boolean hasTime = isValidFilterValue(time);
        boolean hasSpecialty = isValidFilterValue(specialty);

        if (hasName && hasTime && hasSpecialty) {
            return filterDoctorsByNameSpecilityandTime(name, specialty, time);
        }
        if (hasName && hasTime) {
            return filterDoctorByNameAndTime(name, time);
        }
        if (hasName && hasSpecialty) {
            return filterDoctorByNameAndSpecility(name, specialty);
        }
        if (hasTime && hasSpecialty) {
            return filterDoctorByTimeAndSpecility(specialty, time);
        }
        if (hasName) {
            return findDoctorByName(name);
        }
        if (hasTime) {
            return filterDoctorsByTime(time);
        }
        if (hasSpecialty) {
            return filterDoctorBySpecility(specialty);
        }
        return getDoctors();
    }

    @Transactional(readOnly = true)
    public List<Doctor> filterDoctorsByNameSpecilityandTime(String name, String specialty, String time) {
        List<Doctor> doctors = doctorRepository.findByNameContainingIgnoreCaseAndSpecialtyIgnoreCase(name, specialty);
        return filterDoctorByTime(doctors, time);
    }

    @Transactional(readOnly = true)
    public List<Doctor> filterDoctorByTime(List<Doctor> doctors, String time) {
        return doctors.stream()
                .filter(doctor -> doctor.getAvailableTimes().stream().anyMatch(slot -> matchesTimePeriod(slot, time)))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Doctor> filterDoctorByNameAndTime(String name, String time) {
        return filterDoctorByTime(findDoctorByName(name), time);
    }

    @Transactional(readOnly = true)
    public List<Doctor> filterDoctorByNameAndSpecility(String name, String specialty) {
        return doctorRepository.findByNameContainingIgnoreCaseAndSpecialtyIgnoreCase(name, specialty);
    }

    @Transactional(readOnly = true)
    public List<Doctor> filterDoctorByTimeAndSpecility(String specialty, String time) {
        return filterDoctorByTime(doctorRepository.findBySpecialtyIgnoreCase(specialty), time);
    }

    @Transactional(readOnly = true)
    public List<Doctor> filterDoctorBySpecility(String specialty) {
        return doctorRepository.findBySpecialtyIgnoreCase(specialty);
    }

    @Transactional(readOnly = true)
    public List<Doctor> filterDoctorsByTime(String time) {
        return filterDoctorByTime(getDoctors(), time);
    }

    private boolean matchesTimePeriod(String slot, String period) {
        int hour = Integer.parseInt(slot.substring(0, 2));
        if ("AM".equalsIgnoreCase(period)) {
            return hour < 12;
        }
        if ("PM".equalsIgnoreCase(period)) {
            return hour >= 12;
        }
        return true;
    }

    private boolean isValidFilterValue(String value) {
        return value != null && !value.isBlank() && !"null".equalsIgnoreCase(value);
    }
}
