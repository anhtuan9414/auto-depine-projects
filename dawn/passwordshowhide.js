document.addEventListener("DOMContentLoaded", () => {
  const passwordField = document.getElementById("password");
  const togglePassword = document.getElementById("togglePassword");

  togglePassword.addEventListener("click", () => {
    const type =
      passwordField.getAttribute("type") === "password" ? "text" : "password";
    passwordField.setAttribute("type", type);
    const icon = togglePassword.querySelector("i");
    if (type === "password") {
      icon.classList.add("fa-eye-slash");
      icon.classList.remove("fa-eye");
    } else {
      icon.classList.add("fa-eye");
      icon.classList.remove("fa-eye-slash");
    }
  });

  const passwordField2 = document.getElementById("cnfpassword");
  const togglePassword2 = document.getElementById("togglePassword2");

  togglePassword2.addEventListener("click", () => {
    const type =
      passwordField2.getAttribute("type") === "password" ? "text" : "password";
    passwordField2.setAttribute("type", type);
    const icon = togglePassword2.querySelector("i");
    if (type === "password") {
      icon.classList.add("fa-eye-slash");
      icon.classList.remove("fa-eye");
    } else {
      icon.classList.add("fa-eye");
      icon.classList.remove("fa-eye-slash");
    }
  });
});
