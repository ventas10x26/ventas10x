import Link from 'next/link'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  href?: string
  dark?: boolean
}

export function Logo({ size = 'md', href = '/', dark = false }: LogoProps) {
  const sizes = { sm: 28, md: 36, lg: 52 }
  const textSizes = { sm: 'text-lg', md: 'text-xl', lg: 'text-3xl' }
  const s = sizes[size]

  const mark = (
    <svg width={s} height={s} viewBox="0 0 52 52" fill="none">
      <rect width="52" height="52" rx="13" fill="#FF6B2B"/>
      <rect x="8" y="32" width="7" height="12" rx="2" fill="rgba(255,255,255,0.4)"/>
      <rect x="18" y="24" width="7" height="20" rx="2" fill="rgba(255,255,255,0.65)"/>
      <rect x="28" y="16" width="7" height="28" rx="2" fill="white"/>
      <circle cx="41" cy="11" r="5" fill="rgba(255,255,255,0.2)"/>
      <path d="M38.5 13.5L43.5 8.5M43.5 8.5H40M43.5 8.5V12" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )

  const wordmark = (
    <span className={`font-display font-extrabold tracking-tight ${textSizes[size]} ${dark ? 'text-white' : 'text-gray-900'}`}>
      Ventas<span style={{ color: '#FF6B2B' }}>10x</span>
    </span>
  )

  const content = (
    <div className="flex items-center gap-2.5">
      {mark}
      {wordmark}
    </div>
  )

  if (href) return <Link href={href}>{content}</Link>
  return content
}
