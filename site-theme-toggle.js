(function () {
  var root = document.documentElement;
  var stored = null;
  try { stored = localStorage.getItem("rbx-theme"); } catch (error) {}

  var media = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  function setTheme(theme, persist) {
    var next = theme === "dark" ? "dark" : "light";
    root.dataset.theme = next;
    if (persist) {
      try { localStorage.setItem("rbx-theme", next); } catch (error) {}
    }
    if (button) {
      var dark = next === "dark";
      button.setAttribute("aria-label", dark ? "Use light mode" : "Use dark mode");
      button.setAttribute("aria-pressed", String(dark));
      button.innerHTML = dark ? "☼ <span>Light mode</span>" : "☾ <span>Dark mode</span>";
    }
  }

  var button = null;
  setTheme(stored === "dark" || stored === "light" ? stored : (media && media.matches ? "dark" : "light"), false);

  if (document.querySelector("[data-theme-option], .theme-toggle, .site-theme-toggle")) return;

  button = document.createElement("button");
  button.type = "button";
  button.className = "site-theme-toggle";
  button.addEventListener("click", function () {
    setTheme(root.dataset.theme === "dark" ? "light" : "dark", true);
  });

  var target = document.querySelector(".site-nav, .ng-site-nav, .ng-nav, .rbx-site-nav, .options-header, .nav, .topbar");
  if (target) {
    target.appendChild(button);
  } else if (document.body) {
    document.body.appendChild(button);
  } else {
    return;
  }
  setTheme(root.dataset.theme, false);

  if (media && media.addEventListener) {
    media.addEventListener("change", function (event) {
      var hasChoice = false;
      try { hasChoice = !!localStorage.getItem("rbx-theme"); } catch (error) {}
      if (!hasChoice) setTheme(event.matches ? "dark" : "light", false);
    });
  }
}());
