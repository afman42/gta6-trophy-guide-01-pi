const STORAGE_KEY = 'leonida-field-notes-progress-v1';
const PREFERENCE_KEY = 'leonida-field-notes-preferences-v1';

export function loadProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return new Set(Array.isArray(saved) ? saved.filter(item => typeof item === 'string') : []);
  } catch {
    return new Set();
  }
}

export function saveProgress(earned) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...earned]));
}

export function loadPreferences() {
  try {
    return JSON.parse(localStorage.getItem(PREFERENCE_KEY) || '{"spoilers":false,"view":"tracker"}');
  } catch {
    return { spoilers: false, view: 'tracker' };
  }
}

export function savePreferences(preferences) {
  localStorage.setItem(PREFERENCE_KEY, JSON.stringify(preferences));
}

export function readImport(text, validNames) {
  const parsed = JSON.parse(text);
  const names = Array.isArray(parsed) ? parsed : parsed?.earned;
  if (!Array.isArray(names) || names.some(name => typeof name !== 'string')) {
    throw new Error('Choose a progress export containing trophy names.');
  }
  const known = new Set(validNames);
  return new Set(names.filter(name => known.has(name)));
}

export function exportProgress(earned) {
  return JSON.stringify({ format: 'leonida-progress/v1', earned: [...earned], exportedAt: new Date().toISOString() }, null, 2);
}
