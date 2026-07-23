const form = document.getElementById("loginForm");
const errorEl = document.getElementById("error");
const portalTitle = document.getElementById("portalTitle");
const registerLink = document.getElementById("registerLink");
const credentialLabel = document.getElementById("credentialLabel");
const credentialInput = document.getElementById("credential");

const labels = { admin: "Admin Portal", lecturer: "Lecturer/Staff Portal", student: "Student Portal" };
const routes = { admin: "../admin/dashboard.html", lecturer: "../lecturer/dashboard.html", student: "../student/dashboard.html" };
const params = new URLSearchParams(window.location.search);
const selectedPortal = labels[params.get("portal")] ? params.get("portal") : "student";

function localAccounts() {
  const accounts = JSON.parse(localStorage.getItem("umma_accounts") || "[]");
  if (!accounts.some((account) => account.role === "admin")) {
    accounts.push({ role: "admin", fullName: "Administrator", email: "admin@umma.edu", password: "admin123" });
  }
  if (!accounts.some((account) => account.role === "student")) {
    accounts.push({ role: "student", fullName: "Demo Student", email: "student@umma.edu", password: "student123" });
  }
  localStorage.setItem("umma_accounts", JSON.stringify(accounts));
  return accounts;
}

portalTitle.textContent = labels[selectedPortal];
registerLink.href = `./register.html?portal=${selectedPortal}`;
localStorage.setItem("umma_selected_portal", selectedPortal);
credentialLabel.textContent = "Email address";
credentialInput.type = "email";
credentialInput.placeholder = "name@alsuhaim.edu";

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  errorEl.textContent = "";
  const email = credentialInput.value.trim().toLowerCase();
  const password = document.getElementById("password").value;
  if (!email || !password) return (errorEl.textContent = "Please provide your email and password.");

  const account = localAccounts().find((item) => item.email.toLowerCase() === email && item.password === password);
  if (!account) {
    errorEl.textContent = "Incorrect email or password.";
    return;
  }
  if (account.role !== selectedPortal) {
    errorEl.textContent = `This account belongs to the ${account.role} portal.`;
    return;
  }
  localStorage.setItem("umma_user_role", account.role);
  localStorage.setItem("umma_user_name", account.email);
  localStorage.setItem("umma_user_profile", JSON.stringify(account));
  window.location.assign(routes[selectedPortal]);
});

document.querySelector(".toggle-password")?.addEventListener("click", () => {
  const passwordInput = document.getElementById("password");
  passwordInput.type = passwordInput.type === "password" ? "text" : "password";
});
