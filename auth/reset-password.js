const form = document.getElementById("newPasswordForm");
const message = document.getElementById("message");

const email = new URLSearchParams(window.location.search).get("email")?.toLowerCase();
if (!email) {
  message.textContent = "Choose the account to reset from the forgot-password page.";
  message.className = "error";
  form.querySelectorAll("input, button").forEach((control) => (control.disabled = true));
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  message.textContent = "";
  const password = document.getElementById("newPassword").value;
  const confirmation = document.getElementById("confirmPassword").value;
  if (password.length < 8) return (message.textContent = "Use a password of at least 8 characters.");
  if (password !== confirmation) return (message.textContent = "The passwords do not match.");

  const accounts = JSON.parse(localStorage.getItem("umma_accounts") || "[]");
  const account = accounts.find((item) => item.email.toLowerCase() === email);
  if (!account) {
    message.textContent = "No local account was found for this reset request.";
    message.className = "error";
    return;
  }
  account.password = password;
  localStorage.setItem("umma_accounts", JSON.stringify(accounts));
  message.textContent = "Password updated. You can now sign in.";
  message.className = "success";
  form.reset();
  setTimeout(() => window.location.assign("./login.html"), 1200);
});
