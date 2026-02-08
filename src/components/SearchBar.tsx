'use client';

import { useState } from 'react';
import { Search, Plus, X } from 'lucide-react';

interface SearchBarProps {
  onAddKeyword: (keyword: string) => void;
  customKeywords: string[];
  onRemoveKeyword: (keyword: string) => void;
}

export default function SearchBar({
  onAddKeyword,
  customKeywords,
  onRemoveKeyword,
}: SearchBarProps) {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onAddKeyword(inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Add custom keyword (e.g., 'AI liability', 'data privacy')"
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-gray-900 placeholder-gray-500"
          />
        </div>
        <button
          type="submit"
          disabled={!inputValue.trim()}
          className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-medium"
        >
          <Plus className="w-5 h-5" />
          Add
        </button>
      </form>

      {customKeywords.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {customKeywords.map((keyword) => (
            <span
              key={keyword}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm"
            >
              {keyword}
              <button
                onClick={() => onRemoveKeyword(keyword)}
                className="p-0.5 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
