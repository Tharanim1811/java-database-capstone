(function () {
  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    window.location.href = "/";
  }

  function renderHeader() {
    const mount = document.getElementById("header");
    if (!mount) return;

    const role = localStorage.getItem("userRole");
    const token = localStorage.getItem("token");
    const authenticatedRole = ["admin", "doctor", "loggedPatient"].includes(role);

    if (authenticatedRole && !token) {
      localStorage.removeItem("userRole");
      window.location.href = "/";
      return;
    }

    const header = document.createElement("header");
    header.className = "site-header";

    const brand = document.createElement("a");
    brand.className = "brand";
    brand.href = role === "loggedPatient" ? "/pages/loggedPatientDashboard.html" : "#";

    const logo = document.createElement("img");
    logo.src = "/assets/images/logo/logo.png";
    logo.alt = "Clinic CMS";

    const brandText = document.createElement("span");
    brandText.innerHTML = "<strong>Clinic</strong><small>Management System</small>";
    brand.append(logo, brandText);

    const navigation = document.createElement("nav");
    navigation.className = "role-navigation";
    navigation.setAttribute("aria-label", "Role navigation");

    if (role === "admin") {
      const addButton = document.createElement("button");
      addButton.type = "button";
      addButton.className = "nav-button";
      addButton.textContent = "Add doctor";
      addButton.addEventListener("click", () => {
        document.getElementById("addDoctorButton")?.click();
      });
      navigation.appendChild(addButton);
    }

    if (role === "doctor") {
      const dashboardLabel = document.createElement("span");
      dashboardLabel.className = "role-label";
      dashboardLabel.textContent = "Doctor workspace";
      navigation.appendChild(dashboardLabel);
    }

    if (role === "loggedPatient") {
      const appointmentsLink = document.createElement("a");
      appointmentsLink.href = "/pages/patientAppointments.html";
      appointmentsLink.textContent = "My appointments";
      navigation.appendChild(appointmentsLink);
    }

    if (authenticatedRole) {
      const logoutButton = document.createElement("button");
      logoutButton.type = "button";
      logoutButton.className = "nav-button nav-button-quiet";
      logoutButton.textContent = "Log out";
      logoutButton.addEventListener("click", logout);
      navigation.appendChild(logoutButton);
    }

    header.append(brand, navigation);
    mount.replaceChildren(header);
  }

  window.renderHeader = renderHeader;
  window.logout = logout;
  document.addEventListener("DOMContentLoaded", renderHeader);
})();
