export function setThemeCookie(theme: string) {
  if (typeof document === "undefined") return;
  document.cookie = `harmony-theme=${theme}; path=/; max-age=${60 * 60 * 24 * 365}; sameSite=lax`;
}

export function applyTheme(theme: string) {
  if (typeof document === "undefined") return;
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
  setThemeCookie(theme);
}
