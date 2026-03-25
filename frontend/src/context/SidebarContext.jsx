/**
 * SidebarContext – global sidebar open/collapsed state
 */
import { createContext, useContext, useState, useEffect } from 'react';

const SidebarContext = createContext(null);

export function SidebarProvider({ children }) {
  // Default: collapsed on small screens, expanded on large
  const [collapsed, setCollapsed] = useState(() => window.innerWidth < 1024);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Track viewport resize
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth < 768) {
        setCollapsed(false);   // mobile uses slide in/out, not icon mode
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const toggle = () => {
    if (window.innerWidth < 768) {
      setMobileOpen(o => !o);
    } else {
      setCollapsed(c => !c);
    }
  };

  return (
    <SidebarContext.Provider value={{ collapsed, mobileOpen, toggle, setMobileOpen }}>
      {children}
    </SidebarContext.Provider>
  );
}

export const useSidebar = () => useContext(SidebarContext);
