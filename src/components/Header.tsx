import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Menu, Search, Bell, ChevronDown, LogOut, User, FileText, UserCircle, History, Loader2, X, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { useSearch } from '@/contexts/SearchContext';
import { useDebounce } from '@/hooks/useDebounce';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';
import { saveQuery, loadQueries } from '@/lib/searchCache';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { highlight } from '@/lib/highlight';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Breadcrumbs from './Breadcrumbs';

type Props = { 
  onOpenMobile?: () => void;
  showSearch?: boolean;
};

interface SearchResult {
  id: string;
  name: string;
  type: 'patient' | 'referral';
  route: string;
  source_table: string;
}

const Header: React.FC<Props> = ({ onOpenMobile, showSearch = true }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const { term, setTerm } = useSearch();
  const debouncedTerm = useDebounce(term, 300);
  
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>(loadQueries());
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchRequestRef = useRef(0);
  useOnClickOutside(searchContainerRef, () => setShowResults(false));

  // Clear results dropdown on navigation, but keep the term
  useEffect(() => {
    setShowResults(false);
  }, [location]);

  // Perform search when debounced term changes
  useEffect(() => {
    const performSearch = async () => {
      if (debouncedTerm.trim().length < 2) {
        setResults([]);
        setIsSearching(false);
        return;
      }
      
      setIsSearching(true);
      const requestId = ++searchRequestRef.current;

      const { data, error } = await supabase.rpc('global_search', { p_search_term: debouncedTerm });
      
      if (searchRequestRef.current === requestId) {
        setIsSearching(false);
        if (error) {
          console.error('Global search error:', error);
          toast('Search failed. Please try again.', 'err');
          setResults([]);
        } else {
          const searchData = data || [];
          setResults(searchData);
          setActiveIndex(searchData.length > 0 ? 0 : -1);
        }
      }
    };
    performSearch();
  }, [debouncedTerm]);

  const handleClearSearch = useCallback(() => {
    setTerm('');
    setResults([]);
    setActiveIndex(-1);
    searchInputRef.current?.focus();
  }, [setTerm]);

  const handleResultClick = (result: SearchResult | string) => {
    const queryToSave = typeof result === 'string' ? result : term;
    saveQuery(queryToSave);
    setRecentSearches(loadQueries());

    setShowResults(false);
    searchInputRef.current?.blur();

    if (typeof result === 'string') {
        setTerm(result);
        setShowResults(true);
        setTimeout(() => searchInputRef.current?.focus(), 0);
    } else {
        if (result.route) {
            navigate(result.route);
        } else {
            toast('No navigation path found for this record type', 'err');
        }
    }
  };

  // Keyboard navigation for search results
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName.toUpperCase() !== 'INPUT' && document.activeElement?.tagName.toUpperCase() !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }

      if (showResults) {
        const currentList = term.trim() ? results : recentSearches;
        if (currentList.length === 0 && e.key !== 'Escape') return;

        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setActiveIndex(prev => (prev + 1) % currentList.length);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setActiveIndex(prev => (prev - 1 + currentList.length) % currentList.length);
        } else if (e.key === 'Enter' && activeIndex > -1) {
          e.preventDefault();
          if (activeIndex >= 0 && activeIndex < currentList.length) {
            handleResultClick(currentList[activeIndex]);
          }
        } else if (e.key === 'Escape') {
          e.preventDefault();
          handleClearSearch();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showResults, results, recentSearches, activeIndex, term, handleClearSearch]);

  const signOut = async () => { await supabase.auth.signOut(); };
  const displayList = term.trim() ? results : recentSearches;

  const groupedResults = useMemo(() => {
    if (!results) return {};
    return results.reduce((acc, result) => {
        let groupName: string;
        switch (result.type) {
            case 'patient': groupName = 'Patients'; break;
            case 'referral': groupName = 'Referrals'; break;
            default: groupName = 'Other';
        }

        if (!acc[groupName]) {
            acc[groupName] = [];
        }
        acc[groupName].push(result);
        return acc;
    }, {} as Record<string, SearchResult[]>);
  }, [results]);

  const getIconAndLabel = (result: SearchResult) => {
    switch (result.type) {
        case 'patient':
            return { Icon: UserCircle, label: 'Patient Record' };
        case 'referral':
            return { Icon: FileText, label: 'Referral - Received' };
        default:
            return { Icon: FileText, label: 'Record' };
    }
  };
  
  const avatarUrl = user?.user_metadata.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.user_metadata.full_name || user?.email}`;

  return (
    <header className="sticky top-0 z-30 bg-surface dark:bg-[#1e1e1e] border-b border-border-color">
      <div className="px-2 md:px-4 h-16 grid grid-cols-3 items-center">
        {/* Left Section */}
        <div className="flex items-center gap-2 justify-start">
          <button className="md:hidden p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800" onClick={onOpenMobile} aria-label="Open navigation menu">
            <Menu className="h-6 w-6 text-text" />
          </button>
          {showSearch && (
            <div className="hidden md:flex items-center" ref={searchContainerRef}>
              <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none z-10" />
                  <input 
                    ref={searchInputRef}
                    className="outline-none text-sm border bg-gray-50 dark:bg-[#2A2A2A] text-text dark:text-gray-200 border-transparent rounded-full pl-9 pr-9 py-2 focus:border-emerald-500 w-44 lg:w-64 transition-all" 
                    placeholder="Search... (press /)" 
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    onFocus={() => setShowResults(true)}
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                      {!isSearching && term && (
                      <button
                          type="button"
                          onClick={handleClearSearch}
                          className="p-1 text-muted hover:text-text rounded-full"
                          aria-label="Clear search"
                      >
                          <X className="h-4 w-4" />
                      </button>
                      )}
                      {isSearching && <Loader2 className="h-4 w-4 text-muted animate-spin" />}
                  </div>
              </div>
              {showResults && (
                <div className="absolute top-full mt-2 w-96 bg-surface dark:bg-zinc-900 border border-border-color rounded-2xl shadow-xl overflow-hidden z-50">
                  {isSearching && displayList.length === 0 ? (
                      <div className="p-3 text-sm text-muted text-center flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin"/>Searching...</div>
                  ) : term.trim() ? (
                      Object.keys(groupedResults).length > 0 ? (
                          <ul className="p-1.5 max-h-[70vh] overflow-y-auto">
                              {Object.entries(groupedResults).map(([groupName, items]) => (
                                  <React.Fragment key={groupName}>
                                      <li className="px-2 pt-2 pb-1 text-xs font-semibold text-muted uppercase tracking-wider">{groupName}</li>
                                      {items.map((item, i) => {
                                          const { Icon, label } = getIconAndLabel(item);
                                          const globalIndex = results.findIndex(r => r.id === item.id && r.type === item.type);
                                          return (
                                              <li key={`${item.type}-${item.id}`} onMouseEnter={() => setActiveIndex(globalIndex)}>
                                                  <button 
                                                      onClick={() => handleResultClick(item)} 
                                                      className={cn(
                                                          "w-full text-left px-2 py-1.5 flex items-center gap-2.5 text-sm rounded-lg cursor-pointer",
                                                          globalIndex === activeIndex ? 'bg-teal-50 dark:bg-teal-900/50' : 'hover:bg-gray-100 dark:hover:bg-zinc-800'
                                                      )}
                                                      title={label}
                                                  >
                                                      <Icon className="h-4 w-4 text-muted flex-shrink-0" />
                                                      <div>
                                                          <p className="font-medium text-text" dangerouslySetInnerHTML={{ __html: highlight(item.name, debouncedTerm) }} />
                                                          <p className="text-xs text-muted">{label}</p>
                                                      </div>
                                                  </button>
                                              </li>
                                          );
                                      })}
                                  </React.Fragment>
                              ))}
                          </ul>
                      ) : (
                          <div className="p-4 text-sm text-muted text-center">No records found for "{debouncedTerm}"</div>
                      )
                  ) : recentSearches.length > 0 ? (
                      <ul className="p-1.5">
                          <li className="px-2 pt-1 pb-2 text-xs font-semibold text-muted uppercase tracking-wider">Recent Searches</li>
                          {recentSearches.map((item, i) => (
                              <li key={item} onMouseEnter={() => setActiveIndex(i)}>
                                  <button
                                      onClick={() => handleResultClick(item)}
                                      className={cn(
                                          "w-full text-left px-2 py-1.5 flex items-center gap-2.5 text-sm rounded-lg cursor-pointer",
                                          i === activeIndex ? 'bg-teal-50 dark:bg-teal-900/50' : 'hover:bg-gray-100 dark:hover:bg-zinc-800'
                                      )}
                                  >
                                      <History className="h-4 w-4 text-muted flex-shrink-0" />
                                      <p className="font-medium text-text">{item}</p>
                                  </button>
                              </li>
                          ))}
                      </ul>
                  ) : (
                       <div className="p-4 text-sm text-muted text-center">Start typing to search.</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Center Section (Page Title) */}
        <div className="text-center min-w-0">
            <Breadcrumbs />
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-1 justify-end">
          <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800" aria-label="View notifications">
            <Bell className="h-5 w-5 text-muted opacity-80 dark:text-gray-300" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full p-1" aria-label="Open user menu">
                    <img className="h-8 w-8 rounded-full object-cover" src={avatarUrl} alt="User avatar" />
                    <ChevronDown className="h-4 w-4 text-muted opacity-80 dark:text-gray-300 hidden sm:block" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="profile-dropdown">
                <div className="px-3 py-2 border-b border-border-color">
                    <p className="text-sm font-semibold text-text truncate">{user?.user_metadata.full_name || user?.email}</p>
                    <p className="text-xs text-muted">{user?.user_metadata.role || 'User'}</p>
                </div>
                <div className="py-1">
                    <DropdownMenuItem onClick={() => navigate('/settings')}>
                        <Settings className="h-4 w-4 mr-2" /> Profile & Settings
                    </DropdownMenuItem>
                </div>
                <div className="py-1 border-t border-border-color">
                    <DropdownMenuItem onClick={signOut} className="text-red-600 dark:text-error">
                        <LogOut className="h-4 w-4 mr-2" /> Sign out
                    </DropdownMenuItem>
                </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
