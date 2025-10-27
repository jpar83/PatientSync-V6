import React, { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction } from 'react';

interface SearchContextType {
  term: string;
  setTerm: Dispatch<SetStateAction<string>>;
}

const SearchContext = createContext<SearchContextType | null>(null);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [term, setTerm] = useState('');
  return (
    <SearchContext.Provider value={{ term, setTerm }}>
      {children}
    </SearchContext.Provider>
  );
}

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};
