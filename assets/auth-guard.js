/* Keeps the legacy pages compatible while enforcing Supabase sessions and roles. */
(function () {
  const role = document.documentElement.dataset.requiredRole;
  if (!role) return;

  window.SchoolAuth.sessionContext()
    .then((context) => {
      if (!context || context.profile.role !== role) {
        window.location.replace(`../auth/login.html?portal=${encodeURIComponent(role)}`);
        return;
      }
      window.SchoolAuth.cacheProfile(context.profile);
      document.documentElement.classList.add("authenticated");
    })
    .catch(() => window.location.replace(`../auth/login.html?portal=${encodeURIComponent(role)}`));
})();
