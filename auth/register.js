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

if (selectedPortal !== "student") {
  form.hidden = true;
  msg.textContent = "Staff and administrator accounts are created by an administrator. Please contact ICT support for an invitation.";
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  msg.textContent = "";
  const fullName = document.getElementById("fullName").value.trim();
  const email = identityInput.value.trim().toLowerCase();
  const password = document.getElementById("regPassword").value;
  if (!fullName || !email || !password) return (msg.textContent = "Please fill all required fields.");
  if (password.length < 8) return (msg.textContent = "Use a password of at least 8 characters.");

  try {
    const client = await window.SchoolAuth.ready;
    const { error } = await client.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role: "student" }, emailRedirectTo: `${window.location.origin}/auth/login.html?portal=student` },
    });
    if (error) throw error;
    form.reset();
    msg.textContent = "Account created. Check your email to confirm your account, then sign in.";
  } catch (error) {
    msg.textContent = error.message || "Unable to create your account.";
  }
});

document.querySelector(".toggle-password")?.addEventListener("click", () => {
  const passwordInput = document.getElementById("regPassword");
  passwordInput.type = passwordInput.type === "password" ? "text" : "password";
});
