
import React, { createContext, useContext } from 'react';

// ThemeContext is marked as removed/hardcoded to dark mode in GlobalContext.
// This file provides a minimal, non-functional context provider to satisfy imports.
const ThemeContext = createContext<{} | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ThemeContext.Provider value={{}}>
      {children}
    </ThemeContext.Provider>
  );
};

// No useTheme hook is exported as per GlobalContext's indication that theme logic is hardcoded.
