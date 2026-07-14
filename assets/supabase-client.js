/* Global Supabase bootstrap. The anonymous key is intentionally public; never put
   a service-role key in this application or in Vercel's public environment. */
(function () {
  const configUrl = "/api/config";

  async function loadConfig() {
    const response = await fetch(configUrl, { cache: "no-store" });
    if (!response.ok) throw new Error("Unable to load the application configuration.");
    const config = await response.json();
    if (!config.url || !config.anonKey) throw new Error("Supabase is not configured yet.");
    return config;
  }

  const ready = (async () => {
    if (!window.supabase?.createClient) {
      throw new Error("The Supabase browser library did not load.");
    }
    const config = await loadConfig();
    const client = window.supabase.createClient(config.url, config.anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
    window.SchoolSupabase = client;
    return client;
  })();

  async function profileForUser(client, user) {
    const { data, error } = await client.from("profiles").select("id, full_name, role, email, staff_number, student_number").eq("id", user.id).single();
    if (error) throw error;
    return data;
  }

  async function sessionContext() {
    const client = await ready;
    const { data: { session } } = await client.auth.getSession();
    if (!session?.user) return null;
    const profile = await profileForUser(client, session.user);
    return { client, session, user: session.user, profile };
  }

  function cacheProfile(profile) {
    localStorage.setItem("umma_user_role", profile.role);
    localStorage.setItem("umma_user_name", profile.email || "");
    localStorage.setItem("umma_user_profile", JSON.stringify(profile));
    if (profile.role === "lecturer") {
      localStorage.setItem("umma_lecturer_profile", JSON.stringify({
        fullName: profile.full_name,
        staffNo: profile.staff_number || "",
        email: profile.email,
      }));
    }
  }

  function clearLegacySession() {
    ["umma_user_role", "umma_user_name", "umma_user_profile", "umma_lecturer_profile"].forEach((key) => localStorage.removeItem(key));
  }

  window.SchoolAuth = {
    ready,
    sessionContext,
    cacheProfile,
    clearLegacySession,
    async signOut() {
      const client = await ready;
      await client.auth.signOut();
      clearLegacySession();
    },
  };
})();
