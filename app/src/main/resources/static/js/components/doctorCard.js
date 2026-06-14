import { deleteDoctor } from "../services/doctorServices.js";
import { getPatientData } from "../services/patientServices.js";

function appendDetail(container, label, value) {
  const row = document.createElement("p");
  const title = document.createElement("strong");
  title.textContent = `${label}: `;
  row.append(title, document.createTextNode(value || "Not provided"));
  container.appendChild(row);
}

export function createDoctorCard(doctor, options = {}) {
  const card = document.createElement("article");
  card.className = "doctor-card";
  card.dataset.doctorId = doctor.id;

  const info = document.createElement("div");
  info.className = "doctor-info";

  const badge = document.createElement("span");
  badge.className = "specialty-badge";
  badge.textContent = doctor.specialty || "General medicine";

  const name = document.createElement("h3");
  name.textContent = doctor.name || "Unnamed doctor";

  info.append(badge, name);
  appendDetail(info, "Email", doctor.email);
  appendDetail(info, "Phone", doctor.phone);

  const availability = document.createElement("div");
  availability.className = "availability-list";
  const availabilityTitle = document.createElement("strong");
  availabilityTitle.textContent = "Available times";
  availability.appendChild(availabilityTitle);

  const slots = Array.isArray(doctor.availableTimes) ? doctor.availableTimes : [];
  const slotList = document.createElement("div");
  slotList.className = "slot-list";

  if (slots.length) {
    slots.forEach(slot => {
      const item = document.createElement("span");
      item.className = "time-slot";
      item.textContent = slot;
      slotList.appendChild(item);
    });
  } else {
    const item = document.createElement("span");
    item.className = "muted-text";
    item.textContent = "No availability published";
    slotList.appendChild(item);
  }

  availability.appendChild(slotList);
  info.appendChild(availability);
  card.appendChild(info);

  const role = localStorage.getItem("userRole");
  const actions = document.createElement("div");
  actions.className = "card-actions";

  if (role === "admin") {
    const removeButton = document.createElement("button");
    removeButton.className = "danger-button";
    removeButton.type = "button";
    removeButton.textContent = "Delete doctor";
    removeButton.addEventListener("click", async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        options.onError?.("Your admin session has expired.");
        return;
      }

      if (!window.confirm(`Delete ${doctor.name}?`)) return;

      removeButton.disabled = true;
      try {
        const result = await deleteDoctor(doctor.id, token);
        card.remove();
        options.onDeleted?.(doctor, result.message);
      } catch (error) {
        removeButton.disabled = false;
        options.onError?.(error.message);
      }
    });
    actions.appendChild(removeButton);
  } else {
    const bookButton = document.createElement("button");
    bookButton.className = "primary-button";
    bookButton.type = "button";
    bookButton.textContent = "Book appointment";
    bookButton.addEventListener("click", async () => {
      if (role !== "loggedPatient") {
        options.onError?.("Please log in as a patient to book an appointment.");
        return;
      }

      const token = localStorage.getItem("token");
      try {
        const patient = await getPatientData(token);
        options.onBook?.(doctor, patient);
      } catch (error) {
        options.onError?.(error.message);
      }
    });
    actions.appendChild(bookButton);
  }

  if (actions.childElementCount) card.appendChild(actions);
  return card;
}
