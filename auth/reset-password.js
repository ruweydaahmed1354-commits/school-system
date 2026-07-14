const form = document.getElementById("newPasswordForm");
const message = document.getElementById("message");

async function validateRecoverySession() {
  try {
    const client = await window.SchoolAuth.ready;
    const { data: { session } } = await client.auth.getSession();
    if (!session) throw new Error("This password-reset link is invalid or has expired. Request a new one.");
    return client;
  } catch (error) {
    message.textContent = error.message || "Unable to verify this password-reset link.";
    message.className = "error";
    form.querySelectorAll("input, button").forEach((control) => (control.disabled = true));
    return null;
  }
}

const clientPromise = validateRecoverySession();

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  message.textContent = "";
  const password = document.getElementById("newPassword").value;
  const confirmation = document.getElementById("confirmPassword").value;
  if (password.length < 8) return (message.textContent = "Use a password of at least 8 characters.");
  if (password !== confirmation) return (message.textContent = "The passwords do not match.");

  const client = await clientPromise;
  if (!client) return;
  const { error } = await client.auth.updateUser({ password });
  if (error) {
    message.textContent = error.message || "Unable to update your password.";
    message.className = "error";
    return;
  }
  message.textContent = "Password updated. You can now sign in.";
  message.className = "success";
  form.reset();
  setTimeout(() => window.location.assign("./login.html"), 1200);
});
