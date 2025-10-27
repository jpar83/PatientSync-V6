import { useEffect } from "react";

type Theme = "light" | "dark";

export function useTheme() {
  const theme: Theme = "light";

  useEffect(() => {
    // Force light theme
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.classList.remove('dark');
    localStorage.setItem("theme", 'light');
  }, []);

  const toggleTheme = () => {
    // Do nothing, as theme is fixed to light
  };

  // Provide a dummy setTheme to avoid breaking components that might use it
  const setTheme = (value: Theme | ((val: Theme) => Theme)) => {};

  return { theme, setTheme, toggleTheme };
}
