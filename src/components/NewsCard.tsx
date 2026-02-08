'use client';

import { ExternalLink, Clock, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { NewsItem } from '@/types';

interface NewsCardProps {
  news: NewsItem;
  category?: string;
  categoryColor?: string;
  isSelected?: boolean;
  onClick?: () => void;
}

const colorVariants: Record<string, { bg: string; text: string; border: string }> = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  gray: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
};

export default function NewsCard({ news, category, categoryColor = 'gray', isSelected, onClick }: NewsCardProps) {
  const colors = colorVariants[categoryColor] || colorVariants.gray;
  const relevanceScore = Math.round(news.score * 100);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Recent';
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Recent';
    }
  };

  return (
    <article
      onClick={onClick}
      className={`group relative bg-white rounded-xl border shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer ${
        isSelected
          ? 'border-blue-500 ring-2 ring-blue-200 shadow-lg'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-600 transition-opacity duration-300 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />

      <div className="p-6">
        <div className="flex items-start justify-between gap-4 mb-3">
          {category && (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text} ${colors.border} border`}>
              {category}
            </span>
          )}
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <TrendingUp className="w-3 h-3" />
            <span>{relevanceScore}% relevant</span>
          </div>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
          <a
            href={news.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            {news.title}
          </a>
        </h3>

        <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
          {news.content}
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="font-medium text-gray-700">{news.source}</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDate(news.publishedDate)}
            </span>
          </div>

          <a
            href={news.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            Read more
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </article>
  );
}
