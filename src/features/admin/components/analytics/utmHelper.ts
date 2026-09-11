export interface UtmTheme {
  key: string
  label: string
  channelName: string
  cardClass: string
  bannerClass: string
  badgeClass: string
  iconBoxClass: string
  icon?: string
  color: string
}

export function getUtmSourceInfo(
  utmSource?: string | null,
  utmCampaign?: string | null,
  referrerHost?: string | null
): {
  theme: UtmTheme
  originLabel: string
  originHeading: string
  hasUtm: boolean
} {
  const source = (utmSource || '').toLowerCase().trim()
  const referrer = (referrerHost || '').toLowerCase().trim()
  const combined = `${source} ${referrer}`

  let theme: UtmTheme

  if (combined.includes('instagram') || source === 'ig' || combined.includes('l.instagram')) {
    theme = {
      key: 'instagram',
      label: 'Instagram',
      channelName: 'Instagram Inbound',
      cardClass: 'utm-card--instagram',
      bannerClass: 'utm-banner--instagram',
      badgeClass: 'bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 text-white font-bold border-none shadow-sm',
      iconBoxClass: 'bg-gradient-to-br from-pink-500 via-rose-500 to-purple-600 text-white shadow-md',
      color: '#ec4899',
    }
  } else if (combined.includes('linkedin') || combined.includes('lnkd')) {
    theme = {
      key: 'linkedin',
      label: 'LinkedIn',
      channelName: 'LinkedIn Profile / Post',
      cardClass: 'utm-card--linkedin',
      bannerClass: 'utm-banner--linkedin',
      badgeClass: 'bg-[#0a66c2]/25 text-[#38bdf8] border border-[#0a66c2]/60 font-semibold',
      iconBoxClass: 'bg-[#0a66c2]/30 text-[#38bdf8] border border-[#0a66c2]/70',
      color: '#0a66c2',
    }
  } else if (
    combined.includes('github') ||
    source === 'gh' ||
    source.startsWith('gh_') ||
    source === 'git' ||
    combined.includes('github.com')
  ) {
    theme = {
      key: 'github',
      label: 'GitHub',
      channelName: 'GitHub Repository / Bio',
      cardClass: 'utm-card--github',
      bannerClass: 'utm-banner--github',
      badgeClass: 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/50 font-semibold',
      iconBoxClass: 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/60',
      color: '#2ea043',
    }
  } else if (combined.includes('twitter') || combined.includes('t.co') || source === 'x' || combined.includes('x.com')) {
    theme = {
      key: 'twitter',
      label: 'X (Twitter)',
      channelName: 'X (Twitter) Feed / Bio',
      cardClass: 'utm-card--twitter',
      bannerClass: 'utm-banner--twitter',
      badgeClass: 'bg-sky-950/60 text-sky-300 border border-sky-500/50 font-semibold',
      iconBoxClass: 'bg-sky-950/70 text-sky-300 border border-sky-500/60',
      color: '#38bdf8',
    }
  } else if (combined.includes('facebook') || source === 'fb') {
    theme = {
      key: 'facebook',
      label: 'Facebook',
      channelName: 'Facebook Feed / Group',
      cardClass: 'utm-card--facebook',
      bannerClass: 'utm-banner--facebook',
      badgeClass: 'bg-blue-950/60 text-blue-300 border border-blue-500/50 font-semibold',
      iconBoxClass: 'bg-blue-950/70 text-blue-300 border border-blue-500/60',
      color: '#1877f2',
    }
  } else if (combined.includes('youtube') || combined.includes('youtu.be')) {
    theme = {
      key: 'youtube',
      label: 'YouTube',
      channelName: 'YouTube Description',
      cardClass: 'utm-card--youtube',
      bannerClass: 'utm-banner--youtube',
      badgeClass: 'bg-red-950/60 text-red-300 border border-red-500/50 font-semibold',
      iconBoxClass: 'bg-red-950/70 text-red-300 border border-red-500/60',
      color: '#ef4444',
    }
  } else if (combined.includes('tiktok')) {
    theme = {
      key: 'tiktok',
      label: 'TikTok',
      channelName: 'TikTok Profile / Video',
      cardClass: 'utm-card--tiktok',
      bannerClass: 'utm-banner--tiktok',
      badgeClass: 'bg-gradient-to-r from-cyan-500 to-pink-500 text-white font-bold border-none shadow-sm',
      iconBoxClass: 'bg-gradient-to-br from-cyan-500 to-pink-500 text-white shadow-md',
      color: '#fe0979',
    }
  } else if (combined.includes('google')) {
    theme = {
      key: 'google',
      label: 'Google',
      channelName: 'Google Search Organic',
      cardClass: 'utm-card--google',
      bannerClass: 'utm-banner--google',
      badgeClass: 'bg-blue-950/60 text-blue-200 border border-blue-400/50 font-semibold',
      iconBoxClass: 'bg-blue-950/70 text-blue-300 border border-blue-400/60',
      color: '#4285f4',
    }
  } else if (source) {
    const prettySource = source.charAt(0).toUpperCase() + source.slice(1)
    theme = {
      key: 'custom',
      label: prettySource,
      channelName: `${prettySource} Campaign`,
      cardClass: 'utm-card--generic',
      bannerClass: 'utm-banner--generic',
      badgeClass: 'bg-violet-950/60 text-violet-300 border border-violet-500/50 font-semibold',
      iconBoxClass: 'bg-violet-950/70 text-violet-300 border border-violet-500/60',
      color: '#8a38f5',
    }
  } else if (referrer) {
    theme = {
      key: 'referrer',
      label: referrer,
      channelName: `Referral from ${referrer}`,
      cardClass: 'utm-card--generic',
      bannerClass: 'utm-banner--generic',
      badgeClass: 'bg-zinc-800 text-zinc-300 border border-zinc-700 font-semibold',
      iconBoxClass: 'bg-zinc-800 text-zinc-300 border border-zinc-700',
      color: '#a1a1aa',
    }
  } else {
    theme = {
      key: 'direct',
      label: 'Direct Visit',
      channelName: 'Direct / Bookmarked',
      cardClass: 'utm-card--direct',
      bannerClass: 'utm-banner--direct',
      badgeClass: 'bg-zinc-800/90 text-zinc-400 border border-zinc-700/60 font-medium',
      iconBoxClass: 'bg-zinc-800 text-zinc-400 border border-zinc-700/80',
      color: '#71717a',
    }
  }

  const hasUtm = Boolean(utmSource)
  const isDirect = theme.key === 'direct'
  const originHeading = !isDirect ? `From ${theme.label}` : 'Direct Inbound Visit'

  const originLabel = utmCampaign
    ? `${theme.label} (${utmCampaign})`
    : theme.label

  return {
    theme,
    originLabel,
    originHeading,
    hasUtm,
  }
}

export interface EventNarrative {
  headline: string
  subtext?: string
  badge: string
  badgeClass: string
  dotColor: string
}

export function getEventNarrative(evt: {
  event_name: string
  page?: string | null
  section?: string | null
  target_label?: string | null
  project_slug?: string | null
}): EventNarrative {
  const name = evt.event_name
  const target = evt.target_label || ''
  const project = evt.project_slug || ''

  switch (name) {
    case 'page_view':
      return {
        headline: evt.page && evt.page !== '/' ? `Opened "${evt.page}" page` : 'Landed on Portfolio Homepage',
        subtext: 'Session entry & initial layout render',
        badge: 'Page View',
        badgeClass: 'bg-violet-950/50 text-violet-300 border border-violet-800/40',
        dotColor: 'bg-violet-400',
      }
    case 'section_view': {
      const sec = target || evt.section || 'section'
      return {
        headline: `Scrolled to "${sec}" section`,
        subtext: `Browsed and viewed the ${sec} showcase area`,
        badge: 'Section View',
        badgeClass: 'bg-indigo-950/50 text-indigo-300 border border-indigo-800/40',
        dotColor: 'bg-indigo-400',
      }
    }
    case 'scroll_depth':
      return {
        headline: `Read ${target || 'page'} of the content`,
        subtext: target === '100%' ? 'Scrolled through to the bottom of the page' : `Browsed past the ${target} scroll milestone`,
        badge: `Scroll ${target}`,
        badgeClass: 'bg-cyan-950/50 text-cyan-300 border border-cyan-800/40',
        dotColor: 'bg-cyan-400',
      }
    case 'resume_download':
      return {
        headline: `Downloaded Resume (${target || 'PDF'})`,
        subtext: 'High-intent recruiter / hiring evaluation action',
        badge: 'Conversion Goal',
        badgeClass: 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/50 font-bold shadow-xs',
        dotColor: 'bg-emerald-400',
      }
    case 'github_click':
      return {
        headline: project ? `Inspected GitHub code for "${project}"` : 'Clicked GitHub repository link',
        subtext: 'Navigated to public source code repository',
        badge: 'Code Inspection',
        badgeClass: 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/50 font-semibold',
        dotColor: 'bg-emerald-400',
      }
    case 'demo_click':
      return {
        headline: project ? `Launched Live Demo for "${project}"` : 'Launched Live Project Demo',
        subtext: 'Opened external production deployment',
        badge: 'Live Demo',
        badgeClass: 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/50 font-semibold',
        dotColor: 'bg-emerald-400',
      }
    case 'contact_open':
    case 'contact_submit':
      return {
        headline: target ? `Clicked contact via ${target}` : 'Engaged with Contact channel',
        subtext: 'Direct communication / outreach intent',
        badge: 'Contact Intent',
        badgeClass: 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/50 font-semibold',
        dotColor: 'bg-emerald-400',
      }
    case 'project_open':
      return {
        headline: project ? `Inspected project "${project}"` : 'Opened project details',
        subtext: 'Inspected project stack, architecture, and preview gallery',
        badge: 'Project Inspect',
        badgeClass: 'bg-amber-950/50 text-amber-300 border border-amber-800/40 font-semibold',
        dotColor: 'bg-amber-400',
      }
    case 'heartbeat':
      return {
        headline: 'Active browsing & exploring',
        subtext: 'Visitor actively focused on the portfolio tab',
        badge: 'Active Pulse',
        badgeClass: 'bg-zinc-800 text-zinc-400 border border-zinc-700/60',
        dotColor: 'bg-zinc-500',
      }
    default:
      return {
        headline: name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        subtext: target ? `Target: ${target}` : undefined,
        badge: 'Activity',
        badgeClass: 'bg-zinc-800 text-zinc-300 border border-zinc-700/60',
        dotColor: 'bg-violet-400',
      }
  }
}

