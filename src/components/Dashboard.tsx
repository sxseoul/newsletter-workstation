'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw,
  Newspaper,
  BookOpen,
  Scale,
  AlertCircle,
  Sparkles,
  PenLine,
  X,
  Save,
  FileText,
} from 'lucide-react';
import NewsCard from './NewsCard';
import CategoryFilter from './CategoryFilter';
import SearchBar from './SearchBar';
import StatsCard from './StatsCard';
import { NewsItem, DEFAULT_CATEGORIES, SelectedNews, NewsInsight } from '@/types';

interface NewsResults {
  [keyword: string]: NewsItem[];
}

export default function Dashboard() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    DEFAULT_CATEGORIES.map((c) => c.id)
  );
  const [customKeywords, setCustomKeywords] = useState<string[]>([]);
  const [newsResults, setNewsResults] = useState<NewsResults>({});
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Insight management state
  const [selectedNews, setSelectedNews] = useState<SelectedNews | null>(null);
  const [insights, setInsights] = useState<Record<string, NewsInsight>>({});
  const [currentInsight, setCurrentInsight] = useState('');

  const getActiveKeywords = useCallback(() => {
    const categoryKeywords = DEFAULT_CATEGORIES.filter((c) =>
      selectedCategories.includes(c.id)
    ).flatMap((c) => c.keywords[0]);
    return [...categoryKeywords, ...customKeywords];
  }, [selectedCategories, customKeywords]);

  const fetchNews = useCallback(async () => {
    const keywords = getActiveKeywords();
    if (keywords.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch news');
      }

      const data = await response.json();
      setNewsResults(data.results);
      setLastUpdated(new Date(data.searchedAt));
      setIsDemo(data.isDemo);
    } catch (err) {
      setError('Failed to fetch news. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [getActiveKeywords]);

  useEffect(() => {
    fetchNews();
  }, []);

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleAddKeyword = (keyword: string) => {
    if (!customKeywords.includes(keyword)) {
      setCustomKeywords((prev) => [...prev, keyword]);
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setCustomKeywords((prev) => prev.filter((k) => k !== keyword));
  };

  // Handle news selection
  const handleSelectNews = (newsId: string, news: NewsItem, category: string, color: string) => {
    setSelectedNews({ id: newsId, news, category, color });
    // Load existing insight if available
    setCurrentInsight(insights[newsId]?.insight || '');
  };

  // Handle insight save
  const handleSaveInsight = () => {
    if (!selectedNews) return;

    setInsights((prev) => ({
      ...prev,
      [selectedNews.id]: {
        newsId: selectedNews.id,
        insight: currentInsight,
        updatedAt: new Date(),
      },
    }));
  };

  // Close insight panel
  const handleClosePanel = () => {
    if (selectedNews && currentInsight !== (insights[selectedNews.id]?.insight || '')) {
      handleSaveInsight();
    }
    setSelectedNews(null);
    setCurrentInsight('');
  };

  const allNews: { id: string; news: NewsItem; category: string; color: string }[] = [];
  Object.entries(newsResults).forEach(([keyword, items]) => {
    const category = DEFAULT_CATEGORIES.find((c) =>
      c.keywords.some((k) => k.toLowerCase() === keyword.toLowerCase())
    );
    items.forEach((item, index) => {
      // Create a unique ID using URL hash for consistency
      const newsId = `${keyword}-${index}-${btoa(item.url).slice(0, 8)}`;
      allNews.push({
        id: newsId,
        news: item,
        category: category?.name || keyword,
        color: category?.color || 'gray',
      });
    });
  });

  const sortedNews = allNews.sort((a, b) => b.news.score - a.news.score);
  const totalArticles = sortedNews.length;
  const uniqueSources = new Set(sortedNews.map((n) => n.news.source)).size;

  // Extract keywords from news title and content
  const extractKeywords = (news: NewsItem): string[] => {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
      'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has',
      'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
      'must', 'that', 'this', 'these', 'those', 'it', 'its', 'as', 'if', 'not', 'no',
      'can', 'than', 'into', 'about', 'over', 'such', 'their', 'they', 'which', 'what',
      'how', 'when', 'where', 'who', 'new', 'says', 'said', 'also', 'more', 'after',
    ]);

    const text = `${news.title} ${news.content}`.toLowerCase();
    const words = text.match(/\b[a-z]{3,}\b/g) || [];

    const wordCount: Record<string, number> = {};
    words.forEach((word) => {
      if (!stopWords.has(word)) {
        wordCount[word] = (wordCount[word] || 0) + 1;
      }
    });

    return Object.entries(wordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl">
                <Scale className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Tech Law Newsletter
                </h1>
                <p className="text-xs text-gray-500">AI & Technology Legal News Curation</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {lastUpdated && (
                <span className="text-sm text-gray-500">
                  Updated: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
              <button
                onClick={fetchNews}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors font-medium"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Demo Mode Banner */}
        {isDemo && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <Sparkles className="w-5 h-5 text-amber-600" />
            <div>
              <p className="text-sm font-medium text-amber-800">Demo Mode Active</p>
              <p className="text-xs text-amber-600">
                Displaying sample data. Add TAVILY_API_KEY to .env.local for live news.
              </p>
            </div>
          </div>
        )}

        {/* Stats Section */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard
            title="Total Articles"
            value={totalArticles}
            icon={Newspaper}
            trend="From today's search"
          />
          <StatsCard
            title="Active Categories"
            value={selectedCategories.length}
            icon={BookOpen}
          />
          <StatsCard
            title="Sources"
            value={uniqueSources}
            icon={Scale}
          />
          <StatsCard
            title="Keywords"
            value={getActiveKeywords().length}
            icon={AlertCircle}
          />
        </section>

        {/* Filters Section */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Filter by Category
          </h2>
          <CategoryFilter
            categories={DEFAULT_CATEGORIES}
            selectedCategories={selectedCategories}
            onToggle={handleCategoryToggle}
          />

          <div className="mt-6 pt-6 border-t border-gray-100">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Add Custom Keywords
            </h3>
            <SearchBar
              onAddKeyword={handleAddKeyword}
              customKeywords={customKeywords}
              onRemoveKeyword={handleRemoveKeyword}
            />
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={fetchNews}
              disabled={isLoading || getActiveKeywords().length === 0}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 transition-all font-medium shadow-sm"
            >
              Search News
            </button>
          </div>
        </section>

        {/* Error State */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* News Grid with Insight Panel */}
        <section className="flex gap-6">
          {/* News List */}
          <div className="flex-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Latest News</h2>
              <span className="text-sm text-gray-500">{totalArticles} articles found</span>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-full mb-4" />
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                  </div>
                ))}
              </div>
            ) : sortedNews.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sortedNews.map((item) => (
                  <NewsCard
                    key={item.id}
                    news={item.news}
                    category={item.category}
                    categoryColor={item.color}
                    isSelected={selectedNews?.id === item.id}
                    onClick={() => handleSelectNews(item.id, item.news, item.category, item.color)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Newspaper className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  No news articles found
                </h3>
                <p className="text-sm text-gray-500">
                  Select categories or add keywords to search for news.
                </p>
              </div>
            )}
          </div>

          {/* Insight Panel - Always visible */}
          <div className="hidden lg:block w-[400px] flex-shrink-0">
            <div className="sticky top-24 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
              {/* Panel Header */}
              <div className={`px-6 py-4 ${selectedNews ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : 'bg-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div className={`flex items-center gap-2 ${selectedNews ? 'text-white' : 'text-gray-500'}`}>
                    <PenLine className="w-5 h-5" />
                    <h3 className="font-semibold">Insight Editor</h3>
                  </div>
                  {selectedNews && (
                    <button
                      onClick={handleClosePanel}
                      className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-white" />
                    </button>
                  )}
                </div>
              </div>

              {/* Analyzing Badge */}
              {selectedNews ? (
                <div className="px-6 py-3 bg-blue-50 border-b border-blue-100">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-600 text-white text-xs font-medium rounded-full">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                      Analyzing
                    </span>
                    <h4 className="text-sm font-medium text-blue-900 line-clamp-1 flex-1">
                      {selectedNews.news.title}
                    </h4>
                  </div>
                </div>
              ) : (
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
                  <p className="text-sm text-gray-400 text-center">
                    Select a news article to start analyzing
                  </p>
                </div>
              )}

              {/* Keywords Section */}
              {selectedNews && (
                <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-gray-50">
                  <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider font-medium flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Key Topics
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {extractKeywords(selectedNews.news).map((keyword, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-white border border-gray-200 text-gray-700 text-xs rounded-md hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors cursor-default"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Insight Textarea */}
              <div className="p-6">
                <label className={`block text-sm font-medium mb-2 ${selectedNews ? 'text-gray-700' : 'text-gray-400'}`}>
                  Your Analysis & Insights
                </label>
                <textarea
                  value={currentInsight}
                  onChange={(e) => setCurrentInsight(e.target.value)}
                  disabled={!selectedNews}
                  placeholder={selectedNews
                    ? "Write your professional insight about this news article...\n\n• Key legal implications\n• Regulatory impact analysis\n• Strategic recommendations\n• Action items for clients"
                    : "Select a news article from the list to begin writing your insight..."
                  }
                  className={`w-full h-56 px-4 py-3 text-sm rounded-lg resize-none transition-all leading-relaxed ${
                    selectedNews
                      ? 'text-gray-900 bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400'
                      : 'text-gray-400 bg-gray-100 border border-gray-200 cursor-not-allowed placeholder:text-gray-300'
                  }`}
                />

                {/* Character count */}
                <div className="flex items-center justify-between mt-2">
                  <span className={`text-xs ${selectedNews ? 'text-gray-400' : 'text-gray-300'}`}>
                    {currentInsight.length} characters
                  </span>
                  {selectedNews && insights[selectedNews.id] && (
                    <span className="text-xs text-gray-400">
                      Last saved: {insights[selectedNews.id].updatedAt.toLocaleTimeString()}
                    </span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleSaveInsight}
                    disabled={!selectedNews || !currentInsight.trim()}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all font-medium text-sm"
                  >
                    <Save className="w-4 h-4" />
                    Save Insight
                  </button>
                </div>

                {/* Saved insights count */}
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-gray-500">
                    <FileText className="w-4 h-4" />
                    <span className="text-xs">
                      {Object.keys(insights).length} insight{Object.keys(insights).length !== 1 ? 's' : ''} saved this session
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-500">
                Tech Law Newsletter Workstation
              </span>
            </div>
            <p className="text-sm text-gray-400">
              Built for Tech Lawyers and Legal Professionals
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
