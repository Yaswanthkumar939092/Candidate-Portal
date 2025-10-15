'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Search,
  MapPin,
  Building2,
  Briefcase,
  Clock,
  TrendingUp,
  History,
  X,
  Filter,
  Star,
  ChevronRight,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchSuggestion {
  id: string;
  type: 'job_title' | 'company' | 'location' | 'skill' | 'recent' | 'trending';
  text: string;
  subtitle?: string;
  count?: number;
  category?: string;
  trending?: boolean;
  recent?: boolean;
}

export interface SearchHistory {
  id: string;
  query: string;
  timestamp: string;
  resultCount: number;
  filters?: {
    location?: string;
    jobType?: string;
    salaryRange?: string;
  };
}

interface SearchAutocompleteProps {
  onSearch: (query: string, filters?: any) => void;
  onSuggestionClick: (suggestion: SearchSuggestion) => void;
  placeholder?: string;
  className?: string;
  showHistory?: boolean;
  showTrending?: boolean;
  showFilters?: boolean;
  initialValue?: string;
}

export function SearchAutocomplete({
  onSearch,
  onSuggestionClick,
  placeholder = "Search jobs, companies, or skills...",
  className,
  showHistory = true,
  showTrending = true,
  showFilters = false,
  initialValue = ''
}: SearchAutocompleteProps) {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilters, setActiveFilters] = useState<{
    location?: string;
    jobType?: string;
    salaryRange?: string;
    remote?: boolean;
  }>({});

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Sample trending searches
  const trendingSearches: SearchSuggestion[] = [
    { id: '1', type: 'trending', text: 'Frontend Developer', count: 1245, trending: true },
    { id: '2', type: 'trending', text: 'React', count: 892, trending: true },
    { id: '3', type: 'trending', text: 'Remote Work', count: 2134, trending: true },
    { id: '4', type: 'trending', text: 'Product Manager', count: 567, trending: true },
    { id: '5', type: 'trending', text: 'Data Scientist', count: 423, trending: true }
  ];

  // Sample search history
  const sampleHistory: SearchHistory[] = [
    {
      id: '1',
      query: 'Senior Frontend Developer',
      timestamp: '2024-01-20T10:30:00Z',
      resultCount: 23,
      filters: { location: 'San Francisco', jobType: 'Full-time' }
    },
    {
      id: '2',
      query: 'React Developer',
      timestamp: '2024-01-19T15:20:00Z',
      resultCount: 45
    },
    {
      id: '3',
      query: 'Product Manager',
      timestamp: '2024-01-18T09:15:00Z',
      resultCount: 12,
      filters: { location: 'Remote', salaryRange: '100k-150k' }
    }
  ];

  // Mock API function to fetch suggestions
  const fetchSuggestions = useCallback(async (searchQuery: string): Promise<SearchSuggestion[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));

    const mockSuggestions: SearchSuggestion[] = [
      // Job titles
      { id: 'jt1', type: 'job_title', text: 'Frontend Developer', subtitle: '1,234 jobs', count: 1234 },
      { id: 'jt2', type: 'job_title', text: 'Senior Frontend Developer', subtitle: '567 jobs', count: 567 },
      { id: 'jt3', type: 'job_title', text: 'React Developer', subtitle: '892 jobs', count: 892 },
      { id: 'jt4', type: 'job_title', text: 'Full Stack Developer', subtitle: '445 jobs', count: 445 },

      // Companies
      { id: 'c1', type: 'company', text: 'Google', subtitle: '23 open positions', count: 23 },
      { id: 'c2', type: 'company', text: 'Apple', subtitle: '15 open positions', count: 15 },
      { id: 'c3', type: 'company', text: 'Microsoft', subtitle: '31 open positions', count: 31 },

      // Locations
      { id: 'l1', type: 'location', text: 'San Francisco, CA', subtitle: '2,345 jobs', count: 2345 },
      { id: 'l2', type: 'location', text: 'New York, NY', subtitle: '1,892 jobs', count: 1892 },
      { id: 'l3', type: 'location', text: 'Remote', subtitle: '3,567 jobs', count: 3567 },

      // Skills
      { id: 's1', type: 'skill', text: 'React', subtitle: 'Popular skill', count: 1567 },
      { id: 's2', type: 'skill', text: 'TypeScript', subtitle: 'In demand', count: 1234 },
      { id: 's3', type: 'skill', text: 'Node.js', subtitle: 'Backend skill', count: 987 }
    ];

    return mockSuggestions.filter(suggestion =>
      suggestion.text.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 8);
  }, []);

  // Debounced suggestion fetching
  useEffect(() => {
    if (query.length >= 2) {
      setIsLoading(true);
      const timeoutId = setTimeout(async () => {
        const newSuggestions = await fetchSuggestions(query);
        setSuggestions(newSuggestions);
        setIsLoading(false);
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      setSuggestions([]);
      setIsLoading(false);
    }
  }, [query, fetchSuggestions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);
    setShowSuggestions(true);
  };

  const handleInputFocus = () => {
    setShowSuggestions(true);
    if (searchHistory.length === 0) {
      setSearchHistory(sampleHistory);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    const availableSuggestions = [
      ...(query.length >= 2 ? suggestions : []),
      ...(query.length < 2 && showHistory ? searchHistory.map(h => ({ ...h, type: 'recent' as const, text: h.query })) : []),
      ...(query.length < 2 && showTrending ? trendingSearches : [])
    ];

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, availableSuggestions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && availableSuggestions[selectedIndex]) {
          handleSuggestionSelect(availableSuggestions[selectedIndex]);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    const searchText = suggestion.type === 'recent' ? (suggestion as any).query : suggestion.text;
    setQuery(searchText);
    setShowSuggestions(false);
    onSuggestionClick(suggestion);
    onSearch(searchText, activeFilters);

    // Add to search history
    const newHistoryItem: SearchHistory = {
      id: Date.now().toString(),
      query: searchText,
      timestamp: new Date().toISOString(),
      resultCount: suggestion.count || 0,
      filters: Object.keys(activeFilters).length > 0 ? activeFilters : undefined
    };

    setSearchHistory(prev => [newHistoryItem, ...prev.filter(h => h.query !== searchText)].slice(0, 10));
  };

  const handleSearch = () => {
    if (query.trim()) {
      onSearch(query.trim(), activeFilters);
      setShowSuggestions(false);

      // Add to search history
      const newHistoryItem: SearchHistory = {
        id: Date.now().toString(),
        query: query.trim(),
        timestamp: new Date().toISOString(),
        resultCount: 0,
        filters: Object.keys(activeFilters).length > 0 ? activeFilters : undefined
      };

      setSearchHistory(prev => [newHistoryItem, ...prev.filter(h => h.query !== query.trim())].slice(0, 10));
    }
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
  };

  const removeHistoryItem = (historyId: string) => {
    setSearchHistory(prev => prev.filter(h => h.id !== historyId));
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'job_title':
        return <Briefcase className="w-4 h-4 text-gray-400" />;
      case 'company':
        return <Building2 className="w-4 h-4 text-gray-400" />;
      case 'location':
        return <MapPin className="w-4 h-4 text-gray-400" />;
      case 'skill':
        return <Star className="w-4 h-4 text-gray-400" />;
      case 'recent':
        return <History className="w-4 h-4 text-gray-400" />;
      case 'trending':
        return <TrendingUp className="w-4 h-4 text-orange-500" />;
      default:
        return <Search className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  const availableSuggestions = [
    ...(query.length >= 2 ? suggestions : []),
    ...(query.length < 2 && showHistory && searchHistory.length > 0 ? searchHistory.map(h => ({ ...h, type: 'recent' as const, text: h.query })) : []),
    ...(query.length < 2 && showTrending ? trendingSearches : [])
  ];

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pl-12 pr-12 h-12 text-base"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-12 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
            onClick={() => setQuery('')}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
        <Button
          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 px-3 bg-[#1993e5] hover:bg-[#1680cc]"
          onClick={handleSearch}
        >
          Search
        </Button>
      </div>

      {/* Active Filters */}
      {Object.keys(activeFilters).length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {Object.entries(activeFilters).map(([key, value]) => (
            value && (
              <Badge key={key} variant="secondary" className="text-xs">
                {key}: {value}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                  onClick={() => setActiveFilters(prev => ({ ...prev, [key]: undefined }))}
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            )
          ))}
        </div>
      )}

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 border-0 shadow-lg max-h-96 overflow-hidden">
          <CardContent className="p-0">
            {isLoading && query.length >= 2 ? (
              <div className="p-4 text-center">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-600">Searching...</p>
              </div>
            ) : availableSuggestions.length > 0 ? (
              <div className="max-h-96 overflow-y-auto">
                {/* Search Results */}
                {query.length >= 2 && suggestions.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-gray-50 border-b">
                      <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        Search Results
                      </p>
                    </div>
                    {suggestions.map((suggestion, index) => (
                      <div
                        key={suggestion.id}
                        className={cn(
                          "flex items-center space-x-3 px-4 py-3 cursor-pointer border-b border-gray-100 hover:bg-gray-50 transition-colors",
                          selectedIndex === index && "bg-blue-50"
                        )}
                        onClick={() => handleSuggestionSelect(suggestion)}
                      >
                        {getSuggestionIcon(suggestion.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {suggestion.text}
                            </p>
                            {suggestion.trending && (
                              <Badge className="bg-orange-100 text-orange-800 border-orange-200 text-xs">
                                Trending
                              </Badge>
                            )}
                          </div>
                          {suggestion.subtitle && (
                            <p className="text-xs text-gray-500">{suggestion.subtitle}</p>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Recent Searches */}
                {query.length < 2 && showHistory && searchHistory.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-gray-50 border-b flex items-center justify-between">
                      <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        Recent Searches
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearSearchHistory}
                        className="text-xs text-gray-500 h-auto p-1"
                      >
                        Clear All
                      </Button>
                    </div>
                    {searchHistory.slice(0, 5).map((item, index) => {
                      const adjustedIndex = query.length >= 2 ? suggestions.length + index : index;
                      return (
                        <div
                          key={item.id}
                          className={cn(
                            "flex items-center space-x-3 px-4 py-3 cursor-pointer border-b border-gray-100 hover:bg-gray-50 transition-colors group",
                            selectedIndex === adjustedIndex && "bg-blue-50"
                          )}
                          onClick={() => handleSuggestionSelect({ ...item, type: 'recent', text: item.query })}
                        >
                          <History className="w-4 h-4 text-gray-400" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {item.query}
                            </p>
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <span>{formatTimestamp(item.timestamp)}</span>
                              {item.resultCount > 0 && (
                                <span>• {item.resultCount} results</span>
                              )}
                              {item.filters && (
                                <span>• filtered</span>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeHistoryItem(item.id);
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Trending Searches */}
                {query.length < 2 && showTrending && (
                  <div>
                    <div className="px-4 py-2 bg-gray-50 border-b">
                      <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        Trending Searches
                      </p>
                    </div>
                    {trendingSearches.slice(0, 5).map((suggestion, index) => {
                      const adjustedIndex = (query.length >= 2 ? suggestions.length : 0) +
                                           (showHistory ? Math.min(searchHistory.length, 5) : 0) + index;
                      return (
                        <div
                          key={suggestion.id}
                          className={cn(
                            "flex items-center space-x-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors",
                            selectedIndex === adjustedIndex && "bg-blue-50"
                          )}
                          onClick={() => handleSuggestionSelect(suggestion)}
                        >
                          <TrendingUp className="w-4 h-4 text-orange-500" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {suggestion.text}
                              </p>
                              <Badge className="bg-orange-100 text-orange-800 border-orange-200 text-xs">
                                Hot
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-500">
                              {suggestion.count?.toLocaleString()} searches
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : query.length >= 2 ? (
              <div className="p-8 text-center">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No suggestions found</h3>
                <p className="text-gray-600">
                  Try searching for job titles, companies, or skills.
                </p>
              </div>
            ) : (
              <div className="p-8 text-center">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Start typing to search</h3>
                <p className="text-gray-600">
                  Search for jobs, companies, locations, or skills.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Example usage component
export function SearchAutocompleteExample() {
  const handleSearch = (query: string, filters?: any) => {
    console.log('Search:', { query, filters });
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    console.log('Suggestion clicked:', suggestion);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Smart Search Autocomplete</h2>
      <div className="max-w-2xl">
        <SearchAutocomplete
          onSearch={handleSearch}
          onSuggestionClick={handleSuggestionClick}
          showHistory={true}
          showTrending={true}
          placeholder="Search for your dream job..."
        />
      </div>
    </div>
  );
}