import { API_BASE_URL } from "../config/config.js";

const DOCTOR_API = `${API_BASE_URL}/doctor`;

async function readJson(response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

async function request(url, options = {}) {
  try {
    const response = await fetch(url, options);
    const data = await readJson(response);

    if (!response.ok) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("The clinic service is unavailable. Please try again later.");
    }
    throw error;
  }
}

export async function getDoctors() {
  const data = await request(DOCTOR_API);
  return Array.isArray(data) ? data : data.doctors || [];
}

export async function saveDoctor(doctor, token) {
  const data = await request(`${DOCTOR_API}/${encodeURIComponent(token)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(doctor)
  });

  return { success: true, message: data.message || "Doctor added successfully." };
}

export async function deleteDoctor(id, token) {
  const data = await request(
    `${DOCTOR_API}/${encodeURIComponent(id)}/${encodeURIComponent(token)}`,
    { method: "DELETE" }
  );

  return { success: true, message: data.message || "Doctor deleted successfully." };
}

export async function filterDoctors(name, time, specialty) {
  const values = [name, time, specialty].map(value =>
    encodeURIComponent(value && value.trim() ? value.trim() : "null")
  );
  const data = await request(`${DOCTOR_API}/filter/${values.join("/")}`);
  return Array.isArray(data) ? data : data.doctors || [];
}
