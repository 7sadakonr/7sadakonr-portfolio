import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { NavLink } from 'react-router-dom'
import { pauseScroll, resumeScroll } from '../SmoothScroll/scrollController'
import { useSiteSettings } from '../../features/siteSettings/hooks/useSiteSettings'
import { contactDisplayText, visibleContactLinks } from '../../features/siteSettings/validation/contactLinks'
import type { ContactLink } from '../../features/siteSettings/types'
import { trackEvent } from '../../lib/analytics/trackEvent'
import './CommandMenu.css'

export interface CommandMenuItem { id: string; path: string; label: string; category: string; keywords: string; targetId?: string }
export interface CommandMenuConnectItem { id: string; label: string; category: 'Connect'; keywords: string; contact: ContactLink }
type CommandMenuEntry = CommandMenuItem | CommandMenuConnectItem
interface CommandMenuProps { isOpen: boolean; onClose: () => void; menuItems: readonly CommandMenuItem[] | CommandMenuItem[]; activePath: string; handleNavClick: (event: React.MouseEvent<HTMLAnchorElement>, path: string, targetId?: string) => void }

const SearchIcon = () => <svg aria-hidden="true" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
const CloseIcon = () => <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 6 12 12M18 6 6 18" /></svg>
const ExternalLinkIcon = () => <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3h7v7" /><path d="m10 14 11-11" /><path d="M21 14v6a1 1 0 0 1-1 1H4a1 1 0 0 1 1-1V4a1 1 0 0 1 1-1h6" /></svg>
const isConnectItem = (item: CommandMenuEntry): item is CommandMenuConnectItem => 'contact' in item
const displayLabel = (label: string) => label.split(' ').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')

const CommandItemIcon = ({ item }: { item: CommandMenuEntry }) => {
  const iconName = isConnectItem(item) ? item.contact.type : item.id.includes('home') ? 'home' : item.id.includes('about') ? 'user' : item.id.includes('project') ? 'folder' : item.id.includes('contact') ? 'phone' : item.id.includes('skill') ? 'list' : 'file'
  const icon = iconName === 'home' ? <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" /><path d="M9 21v-6h6v6" /></> : iconName === 'user' ? <><circle cx="12" cy="8" r="4" /><path d="M4 21c.8-4 3.5-6 8-6s7.2 2 8 6" /></> : iconName === 'folder' ? <><path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" /><path d="M3 10h18" /></> : iconName === 'phone' ? <path d="M7 3h3l1.4 4-2 1.6a15 15 0 0 0 6 6L17 13l4 1.4v3c0 1.1-.9 2-2 2C10.2 19.4 4.6 13.8 4.6 5c0-1.1.9-2 2-2Z" /> : iconName === 'list' ? <><path d="M9 6h11M9 12h11M9 18h11" /><path d="M4 6h.01M4 12h.01M4 18h.01" /></> : iconName === 'email' ? <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></> : iconName === 'github' ? <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.69c-2.78.61-3.37-1.18-3.37-1.18-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1.01.07 1.54 1.03 1.54 1.03.9 1.54 2.36 1.1 2.94.84.09-.65.35-1.1.63-1.35-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.6 9.6 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" /> : <><circle cx="12" cy="12" r="8" /><path d="M8 12h8M12 8v8" /></>
  return <span className="command-item-icon" aria-hidden="true"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{icon}</svg></span>
}

export const createConnectMenuItems = (links: ContactLink[]): CommandMenuConnectItem[] => visibleContactLinks(links).map((contact) => {
  const label = contactDisplayText(contact)
  return { id: `connect-${contact.id}`, label, category: 'Connect', keywords: `${contact.type} ${contact.label} ${contact.value} ${label}`.toLowerCase(), contact }
})

const trackContactSelection = (contact: ContactLink) => {
  const eventName = contact.type === 'email' ? 'email_click' : contact.type === 'linkedin' ? 'linkedin_click' : contact.type === 'github' ? 'github_profile_click' : 'contact_click'
  let host: string | undefined
  try { if (contact.url.startsWith('http')) host = new URL(contact.url).hostname } catch { /* Ignore URL parsing errors. */ }
  trackEvent(eventName, { target_id: contact.id, target_label: contactDisplayText(contact), target_type: contact.type, destination_host: host })
}

const CommandMenu: React.FC<CommandMenuProps> = ({ isOpen, onClose, menuItems, activePath, handleNavClick }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const settings = useSiteSettings()
  const allItems = useMemo<CommandMenuEntry[]>(() => [...menuItems, ...createConnectMenuItems(settings.contactLinks)], [menuItems, settings.contactLinks])
  const filteredItems = useMemo(() => { const term = searchTerm.toLowerCase(); return allItems.filter(item => item.label.toLowerCase().includes(term) || item.keywords.toLowerCase().includes(term)) }, [allItems, searchTerm])
  const pageItems = filteredItems.filter(item => !isConnectItem(item) && item.category !== 'Projects')
  const projectItems = filteredItems.filter(item => !isConnectItem(item) && item.category === 'Projects')
  const connectItems = filteredItems.filter(isConnectItem)

  useEffect(() => {
    if (!isOpen) return
    pauseScroll(); setSearchTerm('')
    const index = allItems.findIndex(item => !isConnectItem(item) && item.path === activePath && item.category === 'Navigation')
    setSelectedIndex(index < 0 ? 0 : index)
    const focus = window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 80)
    return () => { clearTimeout(focus); resumeScroll() }
  }, [activePath, allItems, isOpen])

  const selectItem = useCallback((event: React.MouseEvent<HTMLAnchorElement> | { preventDefault: () => void }, item: CommandMenuEntry) => {
    event.preventDefault()
    if (isConnectItem(item)) {
      trackContactSelection(item.contact)
      if (item.contact.url.startsWith('http')) window.open(item.contact.url, '_blank', 'noopener,noreferrer')
      else window.location.assign(item.contact.url)
      onClose()
      return
    }
    handleNavClick(event as React.MouseEvent<HTMLAnchorElement>, item.path, item.targetId)
    onClose()
  }, [handleNavClick, onClose])

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

  const renderItem = (item: CommandMenuEntry) => {
    const index = filteredItems.findIndex(candidate => candidate.id === item.id)
    const selected = index === selectedIndex
    const className = `command-item${selected ? ' selected' : ''}${!isConnectItem(item) && activePath === item.path && item.category === 'Navigation' ? ' active-path' : ''}${isConnectItem(item) ? ' command-item--external' : ''}`
    const pointerEnter = (event: React.PointerEvent<HTMLAnchorElement>) => event.pointerType === 'mouse' && setSelectedIndex(index)
    if (isConnectItem(item)) return <li key={item.id}><a href={item.contact.url} className={className} onClick={event => selectItem(event, item)} onPointerEnter={pointerEnter}><CommandItemIcon item={item} /><span className="command-item-label">{item.label}</span><span className="command-item-external-icon"><ExternalLinkIcon /></span></a></li>
    return <li key={item.id}><NavLink to={item.path} className={className} onClick={event => selectItem(event, item)} onPointerEnter={pointerEnter}><CommandItemIcon item={item} /><span className="command-item-label">{displayLabel(item.label)}</span></NavLink></li>
  }

  if (!isOpen) return null
  return <section className="command-menu-island" role="dialog" aria-modal="true" aria-label="Command menu" data-lenis-prevent>
    <div className="command-search-row"><motion.span layoutId="navbar-search-icon"><SearchIcon /></motion.span><input ref={inputRef} type="text" className="command-search-input" placeholder="Search navigation, projects and links…" value={searchTerm} onChange={event => { setSearchTerm(event.target.value); setSelectedIndex(0) }} /><button className="command-close-btn" type="button" onClick={onClose} aria-label="Close menu"><CloseIcon /></button></div>
    <div className="command-menu-content-inner">{filteredItems.length ? <>{pageItems.length > 0 && <div className="command-group"><div className="command-group-heading">Pages</div><ul className="command-list command-list--pages">{pageItems.map(renderItem)}</ul></div>}{projectItems.length > 0 && <div className="command-group"><div className="command-group-heading">Projects</div><ul className="command-list command-list--projects">{projectItems.map(renderItem)}</ul></div>}{connectItems.length > 0 && <div className="command-group"><div className="command-group-heading">Connect</div><ul className="command-list command-list--connect">{connectItems.map(renderItem)}</ul></div>}</> : <div className="command-empty">No results found.</div>}</div>
  </section>
}

export default CommandMenu
