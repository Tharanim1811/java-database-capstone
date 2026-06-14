(function () {
  function setRole(role) {
    localStorage.setItem("userRole", role);
  }

  function getRole() {
    return localStorage.getItem("userRole");
  }

  function getToken() {
    return localStorage.getItem("token");
  }

  function setSession(role, token) {
    setRole(role);
    localStorage.setItem("token", token);
  }

  function clearSession() {
    localStorage.removeItem("userRole");
    localStorage.removeItem("token");
  }

  function debounce(callback, delay = 250) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => callback.apply(this, args), delay);
    };
  }

  window.setRole = setRole;
  window.getRole = getRole;
  window.getToken = getToken;
  window.setSession = setSession;
  window.clearRole = () => localStorage.removeItem("userRole");
  window.clearSession = clearSession;
  window.debounce = debounce;
})();
