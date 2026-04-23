import React from 'react'

export const metadata = {
  title: 'Auth',
  description: 'Auth pages',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
      <div className="w-full max-w-md p-6 rounded-2xl bg-[#111827] border border-white/10 shadow-xl">
        {children}
      </div>
    </div>
  )
}