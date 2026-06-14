import { getAllAppointments } from "./services/appointmentRecordService.js";

const elements = {};
let selectedDate = new Date().toISOString().slice(0, 10);
let requestId = 0;

function setStatus(message = "", type = "info") {
  elements.status.textContent = message;
  elements.status.className = `status-message status-${type}`;
}

function formatDateTime(value) {
  if (!value) return { date: "Not provided", time: "" };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: value, time: "" };

  return {
    date: new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric"
    }).format(date),
    time: new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit"
    }).format(date)
  };
}

function appointmentStatus(status) {
  return Number(status) === 1
    ? { label: "Completed", className: "status-completed" }
    : { label: "Scheduled", className: "status-scheduled" };
}

function createActionLink(label, href, className = "table-action") {
  const link = document.createElement("a");
  link.className = className;
  link.href = href;
  link.textContent = label;
  return link;
}

function createAppointmentRow(appointment) {
  const row = document.createElement("tr");
  const patient = appointment.patient || {};
  const patientId = appointment.patientId ?? patient.id;
  const patientName = appointment.patientName ?? patient.name ?? "Unknown patient";
  const patientEmail = appointment.patientEmail ?? patient.email ?? "No email";
  const patientPhone = appointment.patientPhone ?? patient.phone ?? "No phone";
  const doctorId = appointment.doctorId ?? appointment.doctor?.id ?? "";
  const appointmentId = appointment.id;
  const dateTime = formatDateTime(appointment.appointmentTime);
  const status = appointmentStatus(appointment.status);

  const patientCell = document.createElement("td");
  const patientStrong = document.createElement("strong");
  patientStrong.textContent = patientName;
  const patientMeta = document.createElement("span");
  patientMeta.className = "cell-meta";
  patientMeta.textContent = `Patient #${patientId ?? "-"}`;
  patientCell.append(patientStrong, patientMeta);

  const contactCell = document.createElement("td");
  contactCell.textContent = patientPhone;
  const email = document.createElement("span");
  email.className = "cell-meta";
  email.textContent = patientEmail;
  contactCell.appendChild(email);

  const appointmentCell = document.createElement("td");
  appointmentCell.textContent = dateTime.date;
  const time = document.createElement("span");
  time.className = "cell-meta";
  time.textContent = dateTime.time;
  appointmentCell.appendChild(time);

  const statusCell = document.createElement("td");
  const statusBadge = document.createElement("span");
  statusBadge.className = `appointment-status ${status.className}`;
  statusBadge.textContent = status.label;
  statusCell.appendChild(statusBadge);

  const actionCell = document.createElement("td");
  actionCell.className = "table-actions";
  actionCell.append(
    createActionLink(
      "History",
      `/pages/patientRecord.html?id=${encodeURIComponent(patientId)}&doctorId=${encodeURIComponent(doctorId)}`
    ),
    createActionLink(
      Number(appointment.status) === 1 ? "View prescription" : "Prescribe",
      `/pages/addPrescription.html?appointmentId=${encodeURIComponent(appointmentId)}` +
      `&patientName=${encodeURIComponent(patientName)}` +
      `${Number(appointment.status) === 1 ? "&mode=view" : ""}`,
      "table-action table-action-primary"
    )
  );

  row.append(patientCell, contactCell, appointmentCell, statusCell, actionCell);
  return row;
}

function renderAppointments(appointments) {
  elements.tableBody.replaceChildren();
  elements.count.textContent = appointments.length;

  if (!appointments.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 5;
    cell.className = "empty-table";
    cell.textContent = "No appointments match the selected date and patient name.";
    row.appendChild(cell);
    elements.tableBody.appendChild(row);
    return;
  }

  appointments.forEach(appointment => {
    elements.tableBody.appendChild(createAppointmentRow(appointment));
  });
}

async function loadAppointments() {
  const token = localStorage.getItem("token");
  if (!token) {
    setStatus("Your doctor session has expired.", "error");
    return;
  }

  const currentRequest = ++requestId;
  const patientName = elements.search.value.trim() || "null";
  setStatus("Loading appointments...", "info");

  try {
    const data = await getAllAppointments(selectedDate, patientName, token);
    if (currentRequest !== requestId) return;
    const appointments = Array.isArray(data) ? data : data.appointments || [];
    renderAppointments(appointments);
    setStatus("");
  } catch (error) {
    if (currentRequest !== requestId) return;
    renderAppointments([]);
    setStatus(error.message, "error");
  }
}

function debounce(callback, delay = 250) {
  let timeout;
  return () => {
    clearTimeout(timeout);
    timeout = setTimeout(callback, delay);
  };
}

document.addEventListener("DOMContentLoaded", () => {
  localStorage.setItem("userRole", "doctor");

  elements.search = document.getElementById("searchBar");
  elements.date = document.getElementById("datePicker");
  elements.status = document.getElementById("doctorStatus");
  elements.tableBody = document.getElementById("patientTableBody");
  elements.count = document.getElementById("appointmentCount");

  elements.date.value = selectedDate;
  elements.search.addEventListener("input", debounce(loadAppointments));
  elements.date.addEventListener("change", () => {
    selectedDate = elements.date.value || new Date().toISOString().slice(0, 10);
    loadAppointments();
  });
  document.getElementById("todayButton").addEventListener("click", () => {
    selectedDate = new Date().toISOString().slice(0, 10);
    elements.date.value = selectedDate;
    loadAppointments();
  });

  loadAppointments();
});
