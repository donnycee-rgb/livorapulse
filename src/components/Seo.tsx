import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

import { getTitleForPath, routes } from '../routes/routeMeta'

// Live site address — used for canonical URLs. Keep in sync with
// public/sitemap.xml, public/robots.txt and index.html.
export const SITE_URL = 'https://livorapulse.netlify.app'

const DEFAULT_DESCRIPTION =
  'LivoraPulse is a free wellness tracker built for Kenya and Africa. Track activity, Kenyan food and nutrition, screen time, focus, mood and eco habits in one LifePulse Score.'

type PageSeo = { title: string; description: string; index: boolean }

// Public pages that search engines should index
const publicPages: Record<string, PageSeo> = {
  '/': {
    title: 'LivoraPulse — Wellness Tracker Built for Kenya & Africa',
    description: DEFAULT_DESCRIPTION,
    index: true,
  },
  '/login': {
    title: 'Sign In or Create an Account | LivoraPulse',
    description:
      'Sign in to LivoraPulse or create a free account to start tracking your physical, nutritional, digital, productivity, mood and eco wellness.',
    index: true,
  },
}

function seoForPath(pathname: string): PageSeo {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
  if (publicPages[path]) return publicPages[path]

  // Signed-in app pages and unknown URLs stay out of search results
  const isAppPage = routes.some((r) => path === r.path) || path === '/nutrition'
  return {
    title: isAppPage ? `${getTitleForPath(path)} | LivoraPulse` : 'Page Not Found | LivoraPulse',
    description: DEFAULT_DESCRIPTION,
    index: false,
  }
}

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.content = content
}

function setCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.rel = 'canonical'
    document.head.appendChild(el)
  }
  el.href = href
}

export default function Seo() {
  const { pathname } = useLocation()

  useEffect(() => {
    const seo = seoForPath(pathname)
    const url = `${SITE_URL}${pathname === '/' ? '/' : pathname.replace(/\/+$/, '')}`

    document.title = seo.title
    setMeta('name', 'description', seo.description)
    setMeta('name', 'robots', seo.index ? 'index, follow' : 'noindex, nofollow')
    setMeta('property', 'og:title', seo.title)
    setMeta('property', 'og:description', seo.description)
    setMeta('property', 'og:url', url)
    setMeta('name', 'twitter:title', seo.title)
    setMeta('name', 'twitter:description', seo.description)
    setCanonical(url)
  }, [pathname])

  return null
}
