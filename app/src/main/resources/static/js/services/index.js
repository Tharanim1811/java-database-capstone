import { API_BASE_URL } from "../config/config.js";
import { openModal, closeModal } from "../components/modals.js";

const endpoints = {
  admin: `${API_BASE_URL}/admin`,
  doctor: `${API_BASE_URL}/doctor/login`
};

async function login(role, credentials) {
  const response = await fetch(endpoints[role], {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials)
  });

  const text = await response.text();
  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!response.ok || !data.token) {
    throw new Error(data.message || "Invalid login credentials.");
  }

  if (window.setSession) window.setSession(role, data.token);
  else {
    localStorage.setItem("token", data.token);
    localStorage.setItem("userRole", role);
  }
  return data;
}

function showModalStatus(message, type = "error") {
  const status = document.getElementById("modalStatus");
  if (!status) return;
  status.textContent = message;
  status.className = `status-message status-${type}`;
}

function openLogin(role) {
  openModal(`${role}Login`, {
    onSubmit: async () => {
      const credentials = role === "admin"
        ? {
            username: document.getElementById("username").value.trim(),
            password: document.getElementById("password").value
          }
        : {
            email: document.getElementById("email").value.trim(),
            password: document.getElementById("password").value
          };

      try {
        showModalStatus("Signing in...", "info");
        await login(role, credentials);
        closeModal();
        window.location.href = `/${role}Dashboard/${localStorage.getItem("token")}`;
      } catch (error) {
        showModalStatus(error.message);
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("adminLogin")?.addEventListener("click", () => openLogin("admin"));
  document.getElementById("doctorLogin")?.addEventListener("click", () => openLogin("doctor"));

  document.getElementById("patientRole")?.addEventListener("click", () => {
    localStorage.setItem("userRole", "patient");
    window.location.href = "/pages/patientDashboard.html";
  });
});

window.adminLoginHandler = () => openLogin("admin");
window.doctorLoginHandler = () => openLogin("doctor");
