import React, { useEffect, useState, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import './CommandMenu.css';

interface CommandMenuProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: { path: string; label: string }[];
  activePath: string;
  handleNavClick: (e: React.MouseEvent<HTMLAnchorElement>, path: string) => void;
}

const CommandMenu: React.FC<CommandMenuProps> = ({
  isOpen,
  onClose,
  menuItems,
  activePath,
  handleNavClick
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter items based on search term
  const filteredItems = menuItems.filter(item => 
    item.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setSelectedIndex(0);
      // Focus input after animation
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle keyboard navigation inside the menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems.length > 0) {
          // Create a synthetic event object for handleNavClick
          const item = filteredItems[selectedIndex];
          if (item) {
             const synthEvent = { preventDefault: () => {} } as React.MouseEvent<HTMLAnchorElement>;
             handleNavClick(synthEvent, item.path);
             onClose();
          }
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, handleNavClick, onClose]);

  if (!isOpen) return null;

  return (
    <div className={`command-menu-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}>
      <div 
        className="command-menu-modal" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="command-search-wrapper">
          <svg className="command-search-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input 
            ref={inputRef}
            type="text" 
            className="command-search-input" 
            placeholder="Type a command or search..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setSelectedIndex(0);
            }}
          />
          <div className="command-shortcut-badge">ESC</div>
        </div>

        <div className="command-menu-content">
          {filteredItems.length > 0 ? (
            <div className="command-group">
              <div className="command-group-heading">Navigation</div>
              <ul className="command-list">
                {filteredItems.map((item, index) => {
                  const isActivePath = activePath === item.path;
                  const isSelected = index === selectedIndex;
                  // Example shortcuts: H for Home, A for About, etc.
                  const shortcut = item.label.charAt(0).toUpperCase();

                  return (
                    <li key={item.path} className="command-item-wrapper">
                      <NavLink
                        to={item.path}
                        className={`command-item ${isSelected ? 'selected' : ''} ${isActivePath ? 'active-path' : ''}`}
                        onClick={(e) => {
                          handleNavClick(e, item.path);
                          onClose();
                        }}
                        onMouseEnter={() => setSelectedIndex(index)}
                      >
                        <div className="command-item-left">
                          {item.label === 'HOME' && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>}
                          {item.label === 'ABOUT' && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>}
                          {item.label === 'PROJECT' && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>}
                          {item.label === 'CONTACT' && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>}
                          
                          <span className="command-item-label">Go to {item.label}</span>
                        </div>
                        
                        <div className="command-item-right">
                           <span className="command-shortcut-hint">
                              <span className="cmd-icon">⌘</span> {shortcut}
                           </span>
                        </div>
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <div className="command-empty">
              No results found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommandMenu;
