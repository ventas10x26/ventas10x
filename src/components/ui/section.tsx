'use client'

import clsx from 'clsx'

type Props = {
  children: React.ReactNode
  id?: string
  variant?: 'light' | 'dark' | 'gradient'
  className?: string
  contentClassName?: string
}

export default function Section({
  children,
  id,
  variant = 'light',
  className,
  contentClassName,
}: Props) {
  const bg =
    variant === 'dark'
      ? 'bg-[#0f0f0f] text-white'
      : variant === 'gradient'
      ? 'bg-gradient-to-b from-black to-[#0f172a] text-white'
      : 'bg-[var(--light-bg)] text-[var(--light-text)]'

  return (
    <section id={id} className={clsx('w-full', bg, className)}>
      <div className={clsx('max-w-6xl mx-auto px-6 py-24', contentClassName)}>
        {children}
      </div>
    </section>
  )
}