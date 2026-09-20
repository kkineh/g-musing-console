"use client";

export function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    const isDark =
      root.dataset.theme === "dark" ||
      (!root.dataset.theme &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    root.dataset.theme = isDark ? "light" : "dark";
    localStorage.setItem("theme", root.dataset.theme);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="테마 전환"
      className="grid size-[34px] place-items-center rounded-full bg-surface-3 text-text-2 hover:bg-line hover:text-text"
    >
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="size-4"
      >
        <circle cx="8" cy="8" r="3.2" />
        <path d="M8 1v1.6M8 13.4V15M15 8h-1.6M2.6 8H1M12.9 3.1l-1.1 1.1M4.2 11.8l-1.1 1.1M12.9 12.9l-1.1-1.1M4.2 4.2L3.1 3.1" />
      </svg>
    </button>
  );
}
