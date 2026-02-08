'use client';

import { KeywordCategory } from '@/types';

interface CategoryFilterProps {
  categories: KeywordCategory[];
  selectedCategories: string[];
  onToggle: (categoryId: string) => void;
}

const colorClasses: Record<string, { active: string; inactive: string }> = {
  blue: {
    active: 'bg-blue-600 text-white border-blue-600',
    inactive: 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50',
  },
  indigo: {
    active: 'bg-indigo-600 text-white border-indigo-600',
    inactive: 'bg-white text-indigo-600 border-indigo-300 hover:bg-indigo-50',
  },
  purple: {
    active: 'bg-purple-600 text-white border-purple-600',
    inactive: 'bg-white text-purple-600 border-purple-300 hover:bg-purple-50',
  },
  emerald: {
    active: 'bg-emerald-600 text-white border-emerald-600',
    inactive: 'bg-white text-emerald-600 border-emerald-300 hover:bg-emerald-50',
  },
};

export default function CategoryFilter({
  categories,
  selectedCategories,
  onToggle,
}: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => {
        const isSelected = selectedCategories.includes(category.id);
        const colors = colorClasses[category.color] || colorClasses.blue;

        return (
          <button
            key={category.id}
            onClick={() => onToggle(category.id)}
            className={`px-4 py-2 rounded-lg border-2 font-medium text-sm transition-all duration-200 ${
              isSelected ? colors.active : colors.inactive
            }`}
          >
            {category.name}
          </button>
        );
      })}
    </div>
  );
}
