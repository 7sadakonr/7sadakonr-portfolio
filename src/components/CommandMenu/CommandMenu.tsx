import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { NavLink } from 'react-router-dom'
import { pauseScroll, resumeScroll } from '../SmoothScroll/scrollController'
import './CommandMenu.css'

export interface CommandMenuItem { id: string; path: string; label: string; category: string; keywords: string; targetId?: string }
interface CommandMenuProps { isOpen: boolean; onClose: () => void; menuItems: readonly CommandMenuItem[] | CommandMenuItem[]; activePath: string; handleNavClick: (event: React.MouseEvent<HTMLAnchorElement>, path: string, targetId?: string) => void }
const SearchIcon = () => <svg aria-hidden="true" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
const CloseIcon = () => <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 6 12 12M18 6 6 18" /></svg>

const CommandMenu: React.FC<CommandMenuProps> = ({ isOpen, onClose, menuItems, activePath, handleNavClick }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const filteredItems = useMemo(() => { const term = searchTerm.toLowerCase(); return menuItems.filter(item => item.label.toLowerCase().includes(term) || item.keywords.toLowerCase().includes(term)) }, [menuItems, searchTerm])
  useEffect(() => {
    if (!isOpen) return
    pauseScroll(); setSearchTerm('')
    const index = menuItems.findIndex(item => item.path === activePath && item.category === 'Navigation')
    setSelectedIndex(index < 0 ? 0 : index)
    const focus = window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 80)
    return () => { clearTimeout(focus); resumeScroll() }
  }, [activePath, isOpen, menuItems])
  const selectItem = useCallback((event: React.MouseEvent<HTMLAnchorElement> | { preventDefault: () => void }, item: CommandMenuItem) => { event.preventDefault(); handleNavClick(event as React.MouseEvent<HTMLAnchorElement>, item.path, item.targetId); onClose() }, [handleNavClick, onClose])
  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose() }
      if (event.key === 'ArrowDown' && filteredItems.length) { event.preventDefault(); setSelectedIndex(index => (index + 1) % filteredItems.length) }
      if (event.key === 'ArrowUp' && filteredItems.length) { event.preventDefault(); setSelectedIndex(index => (index - 1 + filteredItems.length) % filteredItems.length) }
      if (event.key === 'Enter' && filteredItems[selectedIndex]) { event.preventDefault(); selectItem({ preventDefault: () => undefined }, filteredItems[selectedIndex]) }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [filteredItems, isOpen, onClose, selectItem, selectedIndex])
  if (!isOpen) return null
  return <section className="command-menu-island" role="dialog" aria-modal="true" aria-label="Command menu" data-lenis-prevent>
    <div className="command-search-row"><motion.span layoutId="navbar-search-icon"><SearchIcon /></motion.span><input ref={inputRef} type="text" className="command-search-input" placeholder="Search navigation and projects…" value={searchTerm} onChange={event => { setSearchTerm(event.target.value); setSelectedIndex(0) }} /><button className="command-close-btn" type="button" onClick={onClose} aria-label="Close menu"><CloseIcon /></button></div>
    <div className="command-menu-content-inner">{filteredItems.length ? (['Navigation', 'Content', 'Projects'] as const).map(category => { const items = filteredItems.filter(item => item.category === category); if (!items.length) return null; return <div className="command-group" key={category}><div className="command-group-heading">{category}</div><ul className="command-list">{items.map(item => { const index = filteredItems.findIndex(candidate => candidate.id === item.id); const selected = index === selectedIndex; return <li key={item.id}><NavLink to={item.path} className={`command-item${selected ? ' selected' : ''}${activePath === item.path && item.category === 'Navigation' ? ' active-path' : ''}`} onClick={event => selectItem(event, item)} onPointerEnter={event => event.pointerType === 'mouse' && setSelectedIndex(index)}><span>{item.category === 'Navigation' ? `Go to ${item.label}` : item.label}</span></NavLink></li> })}</ul></div> }) : <div className="command-empty">No results found.</div>}</div>
  </section>
}
export default CommandMenu
