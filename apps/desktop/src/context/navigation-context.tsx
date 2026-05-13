import { createContext, useContext } from 'react';

export type NavEntry = {
  type: 'route' | 'file';
  path: string;
  metadata?: any;
};

export interface NavigationState {
  history: NavEntry[];
  currentIndex: number;
}

export interface NavigationContextType extends NavigationState {
  push: (entry: NavEntry, replace?: boolean) => void;
  goBack: () => void;
  goForward: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
}

export const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}
