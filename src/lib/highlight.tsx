export function highlight(text: string, term: string) {
  if (!term?.trim()) {
    return text;
  }
  const regex = new RegExp(`(${term.trim()})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}
