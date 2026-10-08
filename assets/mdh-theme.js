(() => {
  "use strict";

  const key = "miamiDraperyHardwareThemeV1";
  const choices = ["system", "light", "dark", "darkv2"];
  const root = document.documentElement;
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
  let preference = "system";

  function readPreference() {
    try {
      return localStorage.getItem(key) || "system";
    } catch {
      return "system";
    }
  }

  function applyTheme(value, save = false) {
    preference = choices.includes(value) ? value : "system";
    root.dataset.themePreference = preference;
    root.dataset.theme = preference === "system"
      ? (systemTheme.matches ? "dark" : "light")
      : (preference === "darkv2" ? "dark" : preference);
    if (preference === "darkv2") root.dataset.themeVariant = "v2";
    else delete root.dataset.themeVariant;

    const select = document.getElementById("adminTheme");
    if (select) select.value = preference;

    if (save) {
      try {
        if (preference === "system") localStorage.removeItem(key);
        else localStorage.setItem(key, preference);
      } catch {
        // Appearance still works when the browser blocks saved preferences.
      }
    }
  }

  // Run before styles and authentication to avoid flashing the wrong theme.
  applyTheme(readPreference());
  document.addEventListener("DOMContentLoaded", () => {
    const select = document.getElementById("adminTheme");
    if (!select) return;
    select.value = preference;
    select.addEventListener("change", () => applyTheme(select.value, true));
  });
  systemTheme.addEventListener("change", () => {
    if (preference === "system") applyTheme("system");
  });
  window.addEventListener("storage", event => {
    if (event.key === key || event.key === null) applyTheme(readPreference());
  });
})();
