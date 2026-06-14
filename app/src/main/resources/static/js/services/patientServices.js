import { API_BASE_URL } from "../config/config.js";

const PATIENT_API = `${API_BASE_URL}/patient`;

async function parseResponse(response) {
  const text = await response.text();
  let data = {};

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
}

export async function patientSignup(patient) {
  try {
    const response = await fetch(PATIENT_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patient)
    });
    const data = await parseResponse(response);
    return { success: true, message: data.message || "Patient account created." };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

export async function patientLogin(credentials) {
  const response = await fetch(`${PATIENT_API}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials)
  });
  return parseResponse(response);
}

export async function getPatientData(token) {
  const response = await fetch(`${PATIENT_API}/${encodeURIComponent(token)}`);
  const data = await parseResponse(response);
  return data.patient || data;
}

export async function getPatientAppointments(id, token, user) {
  const response = await fetch(
    `${PATIENT_API}/${encodeURIComponent(id)}/${encodeURIComponent(user)}/${encodeURIComponent(token)}`
  );
  const data = await parseResponse(response);
  return data.appointments || [];
}

export async function filterAppointments(condition, name, token) {
  const response = await fetch(
    `${PATIENT_API}/filter/${encodeURIComponent(condition || "null")}/` +
    `${encodeURIComponent(name || "null")}/${encodeURIComponent(token)}`
  );
  const data = await parseResponse(response);
  return data.appointments || [];
}
