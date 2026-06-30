const KEY = 'workpro_dark';

export function isDark(): boolean {
  return localStorage.getItem(KEY) === 'true';
}

export function applyTheme() {
  if (isDark()) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

export function toggleTheme() {
  const next = !isDark();
  localStorage.setItem(KEY, String(next));
  applyTheme();
  return next;
}
