'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Scale,
  RefreshCw,
  ExternalLink,
  Clock,
  TrendingUp,
  Sparkles,
  FileText,
  Globe,
  ChevronRight,
  ChevronDown,
  Filter,
  CheckSquare,
  Square,
  PenLine,
  Loader2,
  Copy,
  Check,
  Trash2,
  Plus,
  Settings,
  X,
  Pencil,
  Tag,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import {
  Topic,
  loadTopics,
  saveTopics,
  createTopic,
  updateTopic as updateTopicUtil,
  deleteTopic as deleteTopicUtil,
} from '@/lib/topics';
import {
  NewsSource,
  loadSources,
  saveSources,
  addSource as addSourceUtil,
  deleteSource as deleteSourceUtil,
} from '@/lib/sources';

interface SearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
  publishedDate: string;
  source: string;
  category: string;
}

interface SelectedNewsItem {
  id: string;
  news: SearchResult;
}

function getCategoryStyle(name: string, topics: Topic[]) {
  const topic = topics.find((t) => t.name === name);
  const gradient = topic?.color ?? 'from-slate-500 to-slate-600';

  // Extract the primary color name from the gradient (e.g. "violet" from "from-violet-500 to-purple-600")
  const colorMatch = gradient.match(/from-(\w+)-/);
  const colorName = colorMatch?.[1] ?? 'slate';

  return {
    color: gradient,
    bg: `bg-${colorName}-50`,
    border: `border-${colorName}-200`,
    text: `text-${colorName}-700`,
    badge: `bg-${colorName}-100 text-${colorName}-800`,
  };
}

export default function Home() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [searchedAt, setSearchedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Newsletter state
  const [selectedNews, setSelectedNews] = useState<SelectedNewsItem[]>([]);
  const [newsletterContent, setNewsletterContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Topic management state
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicsPanelOpen, setTopicsPanelOpen] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [editingTopicName, setEditingTopicName] = useState('');

  // Source management state
  const [sources, setSources] = useState<NewsSource[]>([]);
  const [sourcesPanelOpen, setSourcesPanelOpen] = useState(false);
  const [newSourceDomain, setNewSourceDomain] = useState('');

  // Load topics and sources from localStorage on mount
  useEffect(() => {
    setTopics(loadTopics());
    setSources(loadSources());
  }, []);

  // Save topics to localStorage whenever they change
  useEffect(() => {
    if (topics.length > 0) {
      saveTopics(topics);
    }
  }, [topics]);

  // Save sources to localStorage whenever they change
  useEffect(() => {
    if (sources.length > 0) {
      saveSources(sources);
    }
  }, [sources]);

  const fetchResults = useCallback(async () => {
    if (topics.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const keywords = topics.map((t) => t.name);
      const domains = sources.map((s) => s.domain);
      const response = await fetch('/api/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords, domains }),
      });
      if (!response.ok) throw new Error('Failed to fetch');

      const data = await response.json();

      // The API returns { results: Record<string, NewsItem[]>, searchedAt, isDemo }
      // Transform into flat array with category
      const flatResults: SearchResult[] = [];
      const resultMap = data.results as Record<string, Array<{
        title: string;
        url: string;
        content: string;
        score: number;
        publishedDate?: string;
        published_date?: string;
        source?: string;
      }>>;

      for (const [keyword, items] of Object.entries(resultMap)) {
        if (Array.isArray(items)) {
          items.forEach((item) => {
            flatResults.push({
              title: item.title,
              url: item.url,
              content: item.content,
              score: item.score,
              publishedDate: item.publishedDate || item.published_date || new Date().toISOString(),
              source: item.source || new URL(item.url).hostname.replace('www.', ''),
              category: keyword,
            });
          });
        }
      }

      // Deduplicate by URL, keep highest score
      const seen = new Map<string, SearchResult>();
      flatResults.forEach((r) => {
        const existing = seen.get(r.url);
        if (!existing || r.score > existing.score) {
          seen.set(r.url, r);
        }
      });

      const deduped = Array.from(seen.values()).sort(
        (a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime()
      );

      setResults(deduped);
      setSearchedAt(new Date(data.searchedAt));
      setIsDemo(data.isDemo);
    } catch {
      setError('Failed to fetch news. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [topics, sources]);

  // Fetch when topics or sources change
  useEffect(() => {
    if (topics.length > 0) {
      fetchResults();
    }
  }, [fetchResults, topics.length, sources.length]);

  const filteredResults = selectedCategory
    ? results.filter((r) => r.category === selectedCategory)
    : results;

  const uniqueSources = new Set(results.map((r) => r.source)).size;

  // Topic management handlers
  const handleAddTopic = () => {
    const name = newTopicName.trim();
    if (!name) return;
    if (topics.some((t) => t.name.toLowerCase() === name.toLowerCase())) return;
    const newTopic = createTopic(name, topics);
    setTopics((prev) => [...prev, newTopic]);
    setNewTopicName('');
  };

  const handleStartEdit = (topic: Topic) => {
    setEditingTopicId(topic.id);
    setEditingTopicName(topic.name);
  };

  const handleSaveEdit = () => {
    if (!editingTopicId) return;
    const name = editingTopicName.trim();
    if (!name) return;
    // Update topic name in topics list
    setTopics((prev) => updateTopicUtil(prev, editingTopicId, name));
    // Also update category in existing results
    setResults((prev) =>
      prev.map((r) => {
        const oldTopic = topics.find((t) => t.id === editingTopicId);
        if (oldTopic && r.category === oldTopic.name) {
          return { ...r, category: name };
        }
        return r;
      })
    );
    setEditingTopicId(null);
    setEditingTopicName('');
  };

  const handleDeleteTopic = (id: string) => {
    const topic = topics.find((t) => t.id === id);
    setTopics((prev) => deleteTopicUtil(prev, id));
    if (topic) {
      setResults((prev) => prev.filter((r) => r.category !== topic.name));
      if (selectedCategory === topic.name) {
        setSelectedCategory(null);
      }
    }
  };

  // Source management handlers
  const handleAddSource = () => {
    const updated = addSourceUtil(sources, newSourceDomain);
    if (updated.length > sources.length) {
      setSources(updated);
      setNewSourceDomain('');
    }
  };

  const handleDeleteSource = (id: string) => {
    setSources((prev) => deleteSourceUtil(prev, id));
  };

  // Check if news is selected (by URL)
  const isNewsSelected = (url: string) => {
    return selectedNews.some((item) => item.id === url);
  };

  // Toggle news selection
  const toggleNewsSelection = (news: SearchResult) => {
    const id = news.url;
    setSelectedNews((prev) => {
      const exists = prev.some((item) => item.id === id);
      if (exists) {
        return prev.filter((item) => item.id !== id);
      } else {
        return [...prev, { id, news }];
      }
    });
  };

  // Clear all selections
  const clearSelections = () => {
    setSelectedNews([]);
    setNewsletterContent('');
  };

  // Generate newsletter
  const generateNewsletter = async () => {
    if (selectedNews.length === 0) return;

    setIsGenerating(true);
    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articles: selectedNews.map((item) => ({
            title: item.news.title,
            content: item.news.content,
            source: item.news.source,
            category: item.news.category,
            url: item.news.url,
          })),
        }),
      });

      if (!response.ok) throw new Error('Failed to generate');

      const data = await response.json();
      setNewsletterContent(data.newsletter);
    } catch {
      setNewsletterContent(generateFallbackNewsletter());
    } finally {
      setIsGenerating(false);
    }
  };

  // Fallback newsletter generation (without AI)
  const generateFallbackNewsletter = () => {
    const today = new Date().toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    let content = `# News Intelligence Weekly\n`;
    content += `${today}\n\n`;
    content += `---\n\n`;

    selectedNews.forEach((item, index) => {
      content += `## ${index + 1}. ${item.news.title}\n\n`;
      content += `**카테고리:** ${item.news.category} | **출처:** ${item.news.source}\n\n`;
      content += `${item.news.content}\n\n`;
      content += `[원문 보기](${item.news.url})\n\n`;
      if (index < selectedNews.length - 1) {
        content += `---\n\n`;
      }
    });

    return content;
  };

  // Copy to clipboard
  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(newsletterContent);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Ambient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 bg-slate-900/50 backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl blur-lg opacity-50" />
                <div className="relative p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl">
                  <Scale className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  News Intelligence
                </h1>
                <p className="text-sm text-slate-400">Custom Topic News Dashboard</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              {selectedNews.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-violet-500/20 border border-violet-500/30 rounded-lg">
                  <CheckSquare className="w-4 h-4 text-violet-400" />
                  <span className="text-sm text-violet-300 font-medium">
                    {selectedNews.length} selected
                  </span>
                </div>
              )}
              {searchedAt && (
                <div className="hidden sm:flex items-center gap-2 text-sm text-slate-400">
                  <Clock className="w-4 h-4" />
                  <span>Updated {formatDistanceToNow(searchedAt, { addSuffix: true })}</span>
                </div>
              )}
              <button
                onClick={fetchResults}
                disabled={isLoading}
                className="group flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all duration-300 text-white font-medium"
              >
                <RefreshCw className={`w-4 h-4 transition-transform duration-500 ${isLoading ? 'animate-spin' : 'group-hover:rotate-180'}`} />
                <span className="hidden sm:inline">{isLoading ? 'Loading...' : 'Refresh'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-10 flex">
        {/* Main Content */}
        <main className="flex-1 max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Demo Banner */}
          {isDemo && (
            <div className="mb-8 flex items-center gap-3 p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl backdrop-blur-sm">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-200">Demo Mode Active</p>
                <p className="text-xs text-amber-300/70">
                  Displaying curated sample data. Add TAVILY_API_KEY to enable live search.
                </p>
              </div>
            </div>
          )}

          {/* Topic Management Panel */}
          <div className="mb-8">
            <button
              onClick={() => setTopicsPanelOpen(!topicsPanelOpen)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium text-slate-300 transition-all duration-300"
            >
              <Settings className="w-4 h-4" />
              <span>Manage Topics ({topics.length})</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${topicsPanelOpen ? 'rotate-180' : ''}`} />
            </button>

            {topicsPanelOpen && (
              <div className="mt-3 p-5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
                {/* Topic chips */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {topics.map((topic) => {
                    const style = getCategoryStyle(topic.name, topics);
                    return (
                      <div
                        key={topic.id}
                        className="group flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg"
                      >
                        {editingTopicId === topic.id ? (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              handleSaveEdit();
                            }}
                            className="flex items-center gap-1"
                          >
                            <input
                              type="text"
                              value={editingTopicName}
                              onChange={(e) => setEditingTopicName(e.target.value)}
                              className="w-28 px-2 py-0.5 bg-white/10 border border-white/20 rounded text-sm text-white focus:outline-none focus:border-violet-500"
                              autoFocus
                              onBlur={handleSaveEdit}
                            />
                            <button type="submit" className="p-0.5 text-green-400 hover:text-green-300">
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </form>
                        ) : (
                          <>
                            <div className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${style.color}`} />
                            <span className="text-sm text-slate-200">{topic.name}</span>
                            <button
                              onClick={() => handleStartEdit(topic)}
                              className="p-0.5 text-slate-500 hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteTopic(topic.id)}
                              className="p-0.5 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Add new topic */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAddTopic();
                  }}
                  className="flex items-center gap-2"
                >
                  <Tag className="w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={newTopicName}
                    onChange={(e) => setNewTopicName(e.target.value)}
                    placeholder="Add new topic..."
                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!newTopicName.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 bg-violet-500/20 hover:bg-violet-500/30 disabled:opacity-30 border border-violet-500/30 rounded-lg text-sm font-medium text-violet-300 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Source Management Panel */}
          <div className="mb-8">
            <button
              onClick={() => setSourcesPanelOpen(!sourcesPanelOpen)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium text-slate-300 transition-all duration-300"
            >
              <Globe className="w-4 h-4" />
              <span>Manage Sources ({sources.length})</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${sourcesPanelOpen ? 'rotate-180' : ''}`} />
            </button>

            {sourcesPanelOpen && (
              <div className="mt-3 p-5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
                {/* Source chips */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {sources.map((source) => (
                    <div
                      key={source.id}
                      className="group flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg"
                    >
                      <Globe className="w-3 h-3 text-slate-400" />
                      <span className="text-sm text-slate-200">
                        {source.domain} <span className="text-slate-500">({source.name})</span>
                      </span>
                      <button
                        onClick={() => handleDeleteSource(source.id)}
                        className="p-0.5 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add new source */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAddSource();
                  }}
                  className="flex items-center gap-2"
                >
                  <Globe className="w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={newSourceDomain}
                    onChange={(e) => setNewSourceDomain(e.target.value)}
                    placeholder="Add domain (e.g. example.com)..."
                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!newSourceDomain.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 bg-violet-500/20 hover:bg-violet-500/30 disabled:opacity-30 border border-violet-500/30 rounded-lg text-sm font-medium text-violet-300 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Total articles stat */}
            <div className="group relative p-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all duration-300 hover:scale-[1.02] cursor-default">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300" />
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Total Articles</p>
                  <p className="text-3xl font-bold text-white">{results.length}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl opacity-80">
                  <FileText className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>

            {/* Dynamic topic stats - show first 2 topics */}
            {topics.slice(0, 2).map((topic) => {
              const count = results.filter((r) => r.category === topic.name).length;
              return (
                <div
                  key={topic.id}
                  className="group relative p-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all duration-300 hover:scale-[1.02] cursor-default"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${topic.color} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`} />
                  <div className="relative flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400 mb-1 truncate max-w-[120px]">{topic.name}</p>
                      <p className="text-3xl font-bold text-white">{count}</p>
                    </div>
                    <div className={`p-3 bg-gradient-to-br ${topic.color} rounded-xl opacity-80`}>
                      <Tag className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Sources stat */}
            <div className="group relative p-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all duration-300 hover:scale-[1.02] cursor-default">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-rose-500 opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300" />
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Sources</p>
                  <p className="text-3xl font-bold text-white">{uniqueSources}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-orange-500 to-rose-500 rounded-xl opacity-80">
                  <Globe className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Filter Section */}
          <div className="flex flex-wrap items-center gap-3 mb-8">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Filter className="w-4 h-4" />
              <span>Filter:</span>
            </div>
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                selectedCategory === null
                  ? 'bg-white text-slate-900'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
              }`}
            >
              All
            </button>
            {topics.map((topic) => (
              <button
                key={topic.id}
                onClick={() => setSelectedCategory(selectedCategory === topic.name ? null : topic.name)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                  selectedCategory === topic.name
                    ? `bg-gradient-to-r ${topic.color} text-white`
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                }`}
              >
                <Tag className="w-4 h-4" />
                {topic.name}
              </button>
            ))}
          </div>

          {/* Error State */}
          {error && (
            <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* News Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="p-6 bg-white/5 border border-white/10 rounded-2xl animate-pulse">
                  <div className="h-6 bg-white/10 rounded-lg w-24 mb-4" />
                  <div className="h-5 bg-white/10 rounded-lg w-full mb-2" />
                  <div className="h-5 bg-white/10 rounded-lg w-3/4 mb-4" />
                  <div className="h-4 bg-white/10 rounded-lg w-full mb-2" />
                  <div className="h-4 bg-white/10 rounded-lg w-5/6" />
                </div>
              ))}
            </div>
          ) : filteredResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredResults.map((result) => {
                const style = getCategoryStyle(result.category, topics);
                const isSelected = isNewsSelected(result.url);

                return (
                  <article
                    key={result.url}
                    onClick={() => toggleNewsSelection(result)}
                    className={`group relative flex flex-col p-6 rounded-2xl transition-all duration-300 cursor-pointer ${
                      isSelected
                        ? 'bg-violet-500/20 border-2 border-violet-500 scale-[1.02]'
                        : 'bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 hover:scale-[1.01]'
                    }`}
                  >
                    {/* Selection Checkbox */}
                    <div className="absolute top-4 right-4 z-10">
                      {isSelected ? (
                        <CheckSquare className="w-6 h-6 text-violet-400" />
                      ) : (
                        <Square className="w-6 h-6 text-slate-500 group-hover:text-slate-300 transition-colors" />
                      )}
                    </div>

                    {/* Glow Effect */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${style.color} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`} />

                    {/* Category Badge */}
                    <div className="relative flex items-center mb-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r ${style.color} text-white`}>
                        <Tag className="w-3.5 h-3.5" />
                        {result.category}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="relative text-lg font-semibold text-white mb-3 line-clamp-2 pr-8">
                      {result.title}
                    </h3>

                    {/* Content */}
                    <p className="relative text-sm text-slate-400 line-clamp-3 mb-4 flex-1">
                      {result.content}
                    </p>

                    {/* Meta */}
                    <div className="relative flex items-center justify-between pt-4 border-t border-white/5">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-slate-300">{result.source}</span>
                        <span className="text-xs text-slate-500">
                          {formatDistanceToNow(new Date(result.publishedDate), { addSuffix: true })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>{Math.round(result.score * 100)}%</span>
                      </div>
                    </div>

                    {/* Read More Link */}
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="relative mt-4 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium bg-white/5 text-slate-300 hover:bg-white/10 transition-all duration-300"
                    >
                      Read Full Article
                      <ExternalLink className="w-4 h-4" />
                      <ChevronRight className="w-4 h-4" />
                    </a>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/5 rounded-2xl mb-6">
                <FileText className="w-10 h-10 text-slate-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No articles found</h3>
              <p className="text-slate-400">Try adjusting your filters or refresh to fetch new results.</p>
            </div>
          )}
        </main>

        {/* Newsletter Panel - Right Side */}
        <aside className="hidden lg:block w-[450px] border-l border-white/10 bg-slate-900/80 backdrop-blur-xl min-h-screen sticky top-0">
          <div className="p-6 h-screen overflow-y-auto">
            {/* Panel Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg">
                  <PenLine className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-white">Newsletter Editor</h2>
              </div>
              {selectedNews.length > 0 && (
                <button
                  onClick={clearSelections}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Selected News List */}
            {selectedNews.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white/5 rounded-2xl mb-4">
                  <Square className="w-8 h-8 text-slate-500" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">No articles selected</h3>
                <p className="text-sm text-slate-400">
                  Click on news articles to select them for your newsletter
                </p>
              </div>
            ) : (
              <>
                {/* Selected Articles Preview */}
                <div className="mb-6">
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-3">
                    Selected Articles ({selectedNews.length})
                  </p>
                  <div className="space-y-2">
                    {selectedNews.map((item, index) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/10"
                      >
                        <span className="flex-shrink-0 w-6 h-6 bg-violet-500/20 text-violet-400 rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-medium line-clamp-2">{item.news.title}</p>
                          <p className="text-xs text-slate-500 mt-1">{item.news.source}</p>
                        </div>
                        <button
                          onClick={() => toggleNewsSelection(item.news)}
                          className="flex-shrink-0 p-1 text-slate-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Generate Button */}
                <button
                  onClick={generateNewsletter}
                  disabled={isGenerating}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold rounded-xl transition-all duration-300 mb-6"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate Newsletter
                    </>
                  )}
                </button>

                {/* Newsletter Output */}
                {newsletterContent && (
                  <div className="relative">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">
                        Generated Newsletter
                      </p>
                      <button
                        onClick={copyToClipboard}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-green-400" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                    <div className="p-5 bg-white/5 border border-white/10 rounded-xl prose prose-invert prose-sm max-w-none prose-headings:text-white prose-h1:text-xl prose-h1:font-bold prose-h1:mb-2 prose-h2:text-base prose-h2:font-semibold prose-h2:mt-5 prose-h2:mb-2 prose-p:text-slate-300 prose-p:leading-relaxed prose-p:my-2 prose-strong:text-white prose-blockquote:border-violet-500 prose-blockquote:bg-violet-500/10 prose-blockquote:rounded-lg prose-blockquote:py-1 prose-blockquote:px-3 prose-blockquote:not-italic prose-blockquote:text-slate-200 prose-a:text-violet-400 prose-a:no-underline hover:prose-a:underline prose-hr:border-white/10 prose-li:text-slate-300 prose-em:text-slate-200">
                      <ReactMarkdown>{newsletterContent}</ReactMarkdown>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </aside>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-slate-900/50 backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-violet-500/20 to-purple-600/20 rounded-xl">
                <Scale className="w-5 h-5 text-violet-400" />
              </div>
              <span className="text-sm text-slate-400">News Intelligence Dashboard</span>
            </div>
            <p className="text-sm text-slate-500">
              Custom Topic News Intelligence Tool
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
