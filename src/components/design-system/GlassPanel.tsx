import React from 'react'

export function GlassPanel({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return (
    <div className={`glass-panel ${className}`}>
      {children}
    </div>
  )
}
