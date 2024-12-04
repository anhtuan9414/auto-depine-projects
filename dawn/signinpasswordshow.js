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

  });
  