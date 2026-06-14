import { API_BASE_URL } from "../config/config.js";

const PRESCRIPTION_API = `${API_BASE_URL}/prescription`;

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

export async function savePrescription(prescription, token) {
  try {
    const response = await fetch(`${PRESCRIPTION_API}/${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prescription)
    });
    const data = await parseResponse(response);
    return { success: true, message: data.message || "Prescription saved successfully." };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

export async function getPrescription(appointmentId, token) {
  const response = await fetch(
    `${PRESCRIPTION_API}/${encodeURIComponent(appointmentId)}/${encodeURIComponent(token)}`,
    { headers: { "Content-Type": "application/json" } }
  );
  return parseResponse(response);
}
