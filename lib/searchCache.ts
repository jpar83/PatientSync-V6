export function saveQuery(q: string) {
  if (!q?.trim()) return;
  try {
    const prev = JSON.parse(localStorage.getItem("patientSync_recentSearches") || "[]");
    const list = [q, ...prev.filter((x: string) => x !== q)].slice(0, 10);
    localStorage.setItem("patientSync_recentSearches", JSON.stringify(list));
  } catch (error) {
    console.error("Failed to save recent searches:", error);
  }
}

export function loadQueries(): string[] {
  try {
    return JSON.parse(localStorage.getItem("patientSync_recentSearches") || "[]");
  } catch {
    localStorage.removeItem("patientSync_recentSearches");
    return [];
  }
}
