const specialties = [
  "Cardiology",
  "Dermatology",
  "Neurology",
  "Pediatrics",
  "Orthopedics",
  "Dentistry",
  "General Physician"
];

function doctorForm() {
  const specialtyOptions = specialties
    .map(specialty => `<option value="${specialty}">${specialty}</option>`)
    .join("");

  return `
    <form id="addDoctorForm" class="modal-form">
      <p class="eyebrow">Administration</p>
      <h2 id="modalTitle">Add doctor</h2>
      <p class="muted-text">Create a profile and publish appointment availability.</p>
      <label class="field-group">
        <span>Full name</span>
        <input id="doctorName" name="name" type="text" minlength="3" required>
      </label>
      <div class="form-row">
        <label class="field-group">
          <span>Specialty</span>
          <select id="specialization" name="specialty" required>
            <option value="">Select specialty</option>
            ${specialtyOptions}
          </select>
        </label>
        <label class="field-group">
          <span>Phone</span>
          <input id="doctorPhone" name="phone" type="tel" pattern="[0-9]{10}" required>
        </label>
      </div>
      <label class="field-group">
        <span>Email</span>
        <input id="doctorEmail" name="email" type="email" required>
      </label>
      <label class="field-group">
        <span>Temporary password</span>
        <input id="doctorPassword" name="password" type="password" minlength="6" required>
      </label>
      <fieldset class="availability-fieldset">
        <legend>Available times</legend>
        <div class="checkbox-grid">
          <label><input type="checkbox" name="availability" value="09:00-10:00"> 9:00 - 10:00</label>
          <label><input type="checkbox" name="availability" value="10:00-11:00"> 10:00 - 11:00</label>
          <label><input type="checkbox" name="availability" value="11:00-12:00"> 11:00 - 12:00</label>
          <label><input type="checkbox" name="availability" value="14:00-15:00"> 14:00 - 15:00</label>
          <label><input type="checkbox" name="availability" value="15:00-16:00"> 15:00 - 16:00</label>
          <label><input type="checkbox" name="availability" value="16:00-17:00"> 16:00 - 17:00</label>
        </div>
      </fieldset>
      <div id="modalStatus" class="status-message" role="status"></div>
      <button id="saveDoctorBtn" class="primary-button full-width" type="submit">Save doctor</button>
    </form>`;
}

function loginForm(role) {
  const isAdmin = role === "admin";
  return `
    <form id="${role}LoginForm" class="modal-form">
      <h2 id="modalTitle">${isAdmin ? "Admin" : "Doctor"} login</h2>
      <label class="field-group">
        <span>${isAdmin ? "Username" : "Email"}</span>
        <input id="${isAdmin ? "username" : "email"}" type="${isAdmin ? "text" : "email"}" required>
      </label>
      <label class="field-group">
        <span>Password</span>
        <input id="password" type="password" required>
      </label>
      <div id="modalStatus" class="status-message" role="status"></div>
      <button class="primary-button full-width" type="submit">Login</button>
    </form>`;
}

function patientForm(type) {
  if (type === "patientLogin") {
    return `
      <form id="patientLoginForm" class="modal-form">
        <h2 id="modalTitle">Patient login</h2>
        <label class="field-group">
          <span>Email</span>
          <input id="email" type="email" required>
        </label>
        <label class="field-group">
          <span>Password</span>
          <input id="password" type="password" required>
        </label>
        <button id="loginBtn" class="primary-button full-width" type="submit">Login</button>
      </form>`;
  }

  return `
    <form id="patientSignupForm" class="modal-form">
      <h2 id="modalTitle">Patient signup</h2>
      <label class="field-group"><span>Name</span><input id="name" type="text" required></label>
      <label class="field-group"><span>Email</span><input id="email" type="email" required></label>
      <label class="field-group"><span>Password</span><input id="password" type="password" minlength="6" required></label>
      <label class="field-group"><span>Phone</span><input id="phone" type="tel" pattern="[0-9]{10}" required></label>
      <label class="field-group"><span>Address</span><input id="address" type="text" required></label>
      <button id="signupBtn" class="primary-button full-width" type="submit">Create account</button>
    </form>`;
}

export function closeModal() {
  const modal = document.getElementById("modal");
  if (!modal) return;
  modal.style.display = "none";
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

export function openModal(type, options = {}) {
  const modal = document.getElementById("modal");
  const body = document.getElementById("modal-body");
  const closeButton = document.getElementById("closeModal");
  if (!modal || !body) return;

  if (type === "addDoctor") body.innerHTML = doctorForm();
  if (type === "adminLogin") body.innerHTML = loginForm("admin");
  if (type === "doctorLogin") body.innerHTML = loginForm("doctor");
  if (type === "patientLogin" || type === "patientSignup") body.innerHTML = patientForm(type);

  modal.style.display = "grid";
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  closeButton?.focus();

  closeButton?.addEventListener("click", closeModal, { once: true });
  modal.addEventListener("click", event => {
    if (event.target === modal) closeModal();
  }, { once: true });

  if (type === "addDoctor") {
    document.getElementById("addDoctorForm")?.addEventListener("submit", event => {
      event.preventDefault();
      options.onSubmit?.(event.currentTarget);
    });
  }

  if (type.endsWith("Login")) {
    const role = type === "adminLogin" ? "admin" : type === "doctorLogin" ? "doctor" : "patient";
    document.getElementById(`${role}LoginForm`)?.addEventListener("submit", event => {
      event.preventDefault();
      if (options.onSubmit) options.onSubmit(event.currentTarget);
      else if (role === "patient") window.loginPatient?.();
    });
  }

  if (type === "patientSignup") {
    document.getElementById("patientSignupForm")?.addEventListener("submit", event => {
      event.preventDefault();
      if (options.onSubmit) options.onSubmit(event.currentTarget);
      else window.signupPatient?.();
    });
  }
}
