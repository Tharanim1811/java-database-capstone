import { createDoctorCard } from "./components/doctorCard.js";
import { closeModal, openModal } from "./components/modals.js";
import { filterDoctors, getDoctors, saveDoctor } from "./services/doctorServices.js";

const state = {
  doctors: [],
  requestId: 0
};

const elements = {};

function setStatus(message = "", type = "info") {
  elements.status.textContent = message;
  elements.status.className = `status-message status-${type}`;
}

function updateCount() {
  const count = elements.content.querySelectorAll(".doctor-card").length;
  elements.count.textContent = `${count} doctor${count === 1 ? "" : "s"} displayed`;
}

function renderDoctors(doctors) {
  elements.content.replaceChildren();

  if (!doctors.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML = "<h3>No doctors found</h3><p>Try changing the search or filter criteria.</p>";
    elements.content.appendChild(empty);
    updateCount();
    return;
  }

  doctors.forEach(doctor => {
    elements.content.appendChild(createDoctorCard(doctor, {
      onDeleted: (_, message) => {
        setStatus(message, "success");
        state.doctors = state.doctors.filter(item => item.id !== doctor.id);
        updateCount();
      },
      onError: message => setStatus(message, "error")
    }));
  });
  updateCount();
}

async function loadDoctors() {
  setStatus("Loading doctor directory...", "info");
  try {
    state.doctors = await getDoctors();
    renderDoctors(state.doctors);
    setStatus("");
  } catch (error) {
    renderDoctors([]);
    setStatus(error.message, "error");
  }
}

async function applyFilters() {
  const requestId = ++state.requestId;
  const name = elements.search.value.trim();
  const time = elements.time.value;
  const specialty = elements.specialty.value;

  if (!name && !time && !specialty) {
    renderDoctors(state.doctors);
    setStatus("");
    return;
  }

  setStatus("Filtering doctors...", "info");
  try {
    const doctors = await filterDoctors(name, time, specialty);
    if (requestId !== state.requestId) return;
    renderDoctors(doctors);
    setStatus("");
  } catch (error) {
    if (requestId !== state.requestId) return;

    // Keep basic name filtering useful while the API is being integrated.
    const localMatches = state.doctors.filter(doctor => {
      const matchesName = !name || doctor.name?.toLowerCase().includes(name.toLowerCase());
      const matchesSpecialty = !specialty ||
        doctor.specialty?.toLowerCase() === specialty.toLowerCase();
      const matchesTime = !time || doctor.availableTimes?.some(slot => {
        const hour = Number(slot.slice(0, 2));
        return time === "AM" ? hour < 12 : hour >= 12;
      });
      return matchesName && matchesSpecialty && matchesTime;
    });
    renderDoctors(localMatches);
    setStatus(`${error.message} Showing locally filtered results.`, "warning");
  }
}

function openAddDoctorModal() {
  openModal("addDoctor", {
    onSubmit: async form => {
      const submitButton = form.querySelector("button[type='submit']");
      const status = document.getElementById("modalStatus");
      const availableTimes = [...form.querySelectorAll("input[name='availability']:checked")]
        .map(input => input.value);

      const doctor = {
        name: form.elements.name.value.trim(),
        specialty: form.elements.specialty.value,
        email: form.elements.email.value.trim(),
        password: form.elements.password.value,
        phone: form.elements.phone.value.trim(),
        availableTimes
      };

      const token = localStorage.getItem("token");
      if (!token) {
        status.textContent = "Your admin session has expired.";
        status.className = "status-message status-error";
        return;
      }

      submitButton.disabled = true;
      status.textContent = "Saving doctor...";
      status.className = "status-message status-info";

      try {
        const result = await saveDoctor(doctor, token);
        closeModal();
        setStatus(result.message, "success");
        await loadDoctors();
      } catch (error) {
        submitButton.disabled = false;
        status.textContent = error.message;
        status.className = "status-message status-error";
      }
    }
  });
}

function debounce(callback, delay = 250) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => callback(...args), delay);
  };
}

document.addEventListener("DOMContentLoaded", () => {
  localStorage.setItem("userRole", "admin");

  elements.content = document.getElementById("content");
  elements.status = document.getElementById("adminStatus");
  elements.count = document.getElementById("doctorCount");
  elements.search = document.getElementById("searchBar");
  elements.time = document.getElementById("filterTime");
  elements.specialty = document.getElementById("filterSpecialty");

  document.getElementById("addDoctorButton").addEventListener("click", openAddDoctorModal);
  elements.search.addEventListener("input", debounce(applyFilters));
  elements.time.addEventListener("change", applyFilters);
  elements.specialty.addEventListener("change", applyFilters);
  document.getElementById("clearDoctorFilters").addEventListener("click", () => {
    elements.search.value = "";
    elements.time.value = "";
    elements.specialty.value = "";
    applyFilters();
  });

  window.openModal = openModal;
  loadDoctors();
});
