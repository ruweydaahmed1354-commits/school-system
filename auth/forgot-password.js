const form = document.getElementById("resetForm");
const message = document.getElementById("message");

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = document.getElementById("email")?.value.trim().toLowerCase();
  if (!email) return (message.textContent = "Please enter your email address.");
  try {
    const client = await window.SchoolAuth.ready;
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/login.html?portal=student`,
    });
    if (error) throw error;
    message.textContent = "If an account exists for this email, a password-reset link has been sent.";
    message.className = "success";
  } catch (error) {
    message.textContent = error.message || "Unable to request a password reset.";
    message.className = "error";
  }
});
