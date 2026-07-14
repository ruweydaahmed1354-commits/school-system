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

  try {
    const client = await window.SchoolAuth.ready;
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const context = await window.SchoolAuth.sessionContext();
    if (!context?.profile) throw new Error("Your account profile is not ready. Please contact an administrator.");
    if (context.profile.role !== selectedPortal) {
      await client.auth.signOut();
      window.SchoolAuth.clearLegacySession();
      throw new Error(`This account belongs to the ${context.profile.role} portal.`);
    }
    window.SchoolAuth.cacheProfile(context.profile);
    window.location.assign(routes[selectedPortal]);
  } catch (error) {
    errorEl.textContent = error.message || "Unable to sign in. Please try again.";
  }
});

document.querySelector(".toggle-password")?.addEventListener("click", () => {
  const passwordInput = document.getElementById("password");
  passwordInput.type = passwordInput.type === "password" ? "text" : "password";
});
