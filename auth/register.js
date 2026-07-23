const form = document.getElementById("registerForm");
const msg = document.getElementById("msg");
const portalTitle = document.getElementById("portalTitle");
const loginLink = document.getElementById("loginLink");
const identityLabel = document.getElementById("identityLabel");
const identityInput = document.getElementById("regEmail");
const labels = { admin: "Admin Portal", lecturer: "Lecturer/Staff Portal", student: "Student Portal" };
const params = new URLSearchParams(window.location.search);
const selectedPortal = labels[params.get("portal")] ? params.get("portal") : "student";

portalTitle.textContent = labels[selectedPortal];
loginLink.href = `./login.html?portal=${selectedPortal}`;
identityLabel.textContent = "Email address";
identityInput.type = "email";

form?.addEventListener("submit", (event) => {
  event.preventDefault();
  msg.textContent = "";
  const fullName = document.getElementById("fullName").value.trim();
  const email = identityInput.value.trim().toLowerCase();
  const password = document.getElementById("regPassword").value;
  if (!fullName || !email || !password) return (msg.textContent = "Please fill all required fields.");
  if (password.length < 8) return (msg.textContent = "Use a password of at least 8 characters.");

  const accounts = JSON.parse(localStorage.getItem("umma_accounts") || "[]");
  if (accounts.some((account) => account.email.toLowerCase() === email)) {
    msg.textContent = "An account already exists with that email address.";
    return;
  }
  const account = { role: selectedPortal, fullName, email, password };
  accounts.push(account);
  localStorage.setItem("umma_accounts", JSON.stringify(accounts));
  localStorage.setItem("umma_user_role", account.role);
  localStorage.setItem("umma_user_name", account.email);
  localStorage.setItem("umma_user_profile", JSON.stringify(account));
  window.location.assign(`../${selectedPortal}/dashboard.html`);
});

document.querySelector(".toggle-password")?.addEventListener("click", () => {
  const passwordInput = document.getElementById("regPassword");
  passwordInput.type = passwordInput.type === "password" ? "text" : "password";
});
