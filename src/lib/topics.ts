export interface Topic {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export const COLOR_PRESETS = [
  'from-violet-500 to-purple-600',
  'from-emerald-500 to-teal-600',
  'from-blue-500 to-cyan-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-indigo-500 to-blue-600',
  'from-fuchsia-500 to-pink-600',
  'from-lime-500 to-green-600',
  'from-sky-500 to-blue-600',
  'from-red-500 to-rose-600',
  'from-teal-500 to-emerald-600',
  'from-orange-500 to-amber-600',
];

const STORAGE_KEY = 'tech-law-topics';

export const DEFAULT_TOPICS: Topic[] = [
  {
    id: 'ai-regulation',
    name: 'AI Regulation',
    color: COLOR_PRESETS[0],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tech-policy',
    name: 'Tech Policy',
    color: COLOR_PRESETS[1],
    createdAt: new Date().toISOString(),
  },
];

export function loadTopics(): Topic[] {
  if (typeof window === 'undefined') return DEFAULT_TOPICS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_TOPICS;
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_TOPICS;
  } catch {
    return DEFAULT_TOPICS;
  }
}

export function saveTopics(topics: Topic[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(topics));
}

export function getNextColor(existingTopics: Topic[]): string {
  const usedColors = new Set(existingTopics.map((t) => t.color));
  const available = COLOR_PRESETS.find((c) => !usedColors.has(c));
  return available ?? COLOR_PRESETS[existingTopics.length % COLOR_PRESETS.length];
}

export function createTopic(name: string, existingTopics: Topic[]): Topic {
  return {
    id: `topic-${Date.now()}`,
    name: name.trim(),
    color: getNextColor(existingTopics),
    createdAt: new Date().toISOString(),
  };
}

export function updateTopic(topics: Topic[], id: string, newName: string): Topic[] {
  return topics.map((t) => (t.id === id ? { ...t, name: newName.trim() } : t));
}

export function deleteTopic(topics: Topic[], id: string): Topic[] {
  return topics.filter((t) => t.id !== id);
}
