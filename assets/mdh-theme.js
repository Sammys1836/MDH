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

  const labels = {system:"System Default",light:"Light",dark:"Dark",darkv2:"Dark v2"};
  const icons = {system:"◐",light:"☀",dark:"☾",darkv2:"●"};

  function updateThemeButton() {
    const button = document.getElementById("themeButton");
    const label = document.getElementById("themeButtonText");
    const icon = document.getElementById("themeIcon");
    if (button) button.setAttribute("aria-label", "Appearance: " + labels[preference]);
    if (label) label.textContent = "Appearance: " + labels[preference];
    if (icon) icon.textContent = icons[preference];
    document.querySelectorAll(".theme-option").forEach(option => {
      const selected = option.dataset.themeChoice === preference;
      option.classList.toggle("active", selected);
      option.setAttribute("aria-pressed", String(selected));
    });
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
    updateThemeButton();

    if (save) {
      try {
        if (preference === "system") localStorage.removeItem(key);
        else localStorage.setItem(key, preference);
      } catch {
        // Appearance still works when the browser blocks saved preferences.
      }
    }
  }

  // Apply saved theme before page styles, avoiding a flash of another theme.
  applyTheme(readPreference());
  document.addEventListener("DOMContentLoaded", () => {
    const select = document.getElementById("adminTheme");
    if (select) {
      select.value = preference;
      select.addEventListener("change", () => applyTheme(select.value, true));
    }

    const button = document.getElementById("themeButton");
    const menu = document.getElementById("themeMenu");
    updateThemeButton();
    if (!button || !menu) return;

    function closeMenu(restoreFocus = false) {
      menu.hidden = true;
      button.setAttribute("aria-expanded", "false");
      if (restoreFocus) button.focus();
    }

    button.addEventListener("click", event => {
      event.stopPropagation();
      const willOpen = menu.hidden;
      menu.hidden = !willOpen;
      button.setAttribute("aria-expanded", String(willOpen));
    });

    menu.querySelectorAll("[data-theme-choice]").forEach(option => {
      option.addEventListener("click", () => {
        applyTheme(option.dataset.themeChoice, true);
        closeMenu(true);
      });
    });
    document.addEventListener("click", event => {
      if (!event.target.closest(".theme-picker")) closeMenu();
    });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && !menu.hidden) closeMenu(true);
    });
  });
  systemTheme.addEventListener("change", () => {
    if (preference === "system") applyTheme("system");
  });
  window.addEventListener("storage", event => {
    if (event.key === key || event.key === null) applyTheme(readPreference());
  });
})();
