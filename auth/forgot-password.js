const form = document.getElementById("resetForm");
const message = document.getElementById("message");

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = document.getElementById("email")?.value.trim().toLowerCase();
  if (!email) return (message.textContent = "Please enter your email address.");
  const accounts = JSON.parse(localStorage.getItem("umma_accounts") || "[]");
  if (!accounts.some((account) => account.role === "admin")) {
    accounts.push({ role: "admin", fullName: "Administrator", email: "admin@umma.edu", password: "admin123" });
    localStorage.setItem("umma_accounts", JSON.stringify(accounts));
  }
  if (!accounts.some((account) => account.email.toLowerCase() === email)) {
    message.textContent = "No local account was found for that email.";
    message.className = "error";
    return;
  }
  window.location.assign(`./reset-password.html?email=${encodeURIComponent(email)}`);
});
