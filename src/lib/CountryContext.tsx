"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Country = 'egypt';

interface CountryContextType {
  country: Country;
  setCountry: (country: Country) => void;
  isHydrated: boolean;
}

const CountryContext = createContext<CountryContextType | undefined>(undefined);

export function CountryProvider({ children }: { children: React.ReactNode }) {
  const [country] = useState<Country>('egypt');
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const changeCountry = (_newCountry: Country) => {
    // Egypt-only — no country switching
  }

  return (
    <CountryContext.Provider value={{ country, setCountry: changeCountry, isHydrated }}>
      {children}
    </CountryContext.Provider>
  );
}

export function useCountry() {
  const context = useContext(CountryContext);
  if (context === undefined) {
    throw new Error('useCountry must be used within a CountryProvider');
  }
  return context;
}
