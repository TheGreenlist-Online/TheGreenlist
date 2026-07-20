'use client'

import { useEffect, useState, useMemo } from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

type DashboardLayout = 'compact' | 'standard' | 'expanded'

export default function DashboardPreferencesPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [layout, setLayout] = useState<DashboardLayout>('standard')
  const [theme, setTheme] = useState<'dark-green' | 'high-contrast' | 'low-glow'>('dark-green')
  const [visibleCards, setVisibleCards] = useState({
    reports: true,
    forums: true,
    content: true,
    activity: true,
    saved: true,
  })
  const [message, setMessage] = useState('')

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        redirect('/auth/signin?callbackUrl=/dashboard/preferences')
      }

      // Try to load preferences
      const { data } = await supabase
        .from('dashboard_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (data) {
        setLayout(data.layout || 'standard')
        setTheme(data.theme || 'dark-green')
        if (data.visible_cards) {
          setVisibleCards(data.visible_cards)
        }
      }

      setIsLoading(false)
    }

    checkAuth()
  }, [supabase])

  const handleSave = async () => {
    setIsSaving(true)
    setMessage('')

    try {
      const user = (await supabase.auth.getUser()).data.user

      if (!user) {
        setMessage('Not authenticated')
        return
      }

      // Save preferences to Supabase if table exists
      const { error } = await supabase.from('dashboard_preferences').upsert(
        {
          user_id: user.id,
          layout,
          theme,
          visible_cards: visibleCards,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      )

      if (error) {
        console.warn('Preferences table may not exist yet:', error)
        // Save to localStorage as fallback
        localStorage.setItem(
          'dashboard-preferences',
          JSON.stringify({
            layout,
            theme,
            visibleCards,
          }),
        )
        setMessage('✓ Preferences saved locally (database pending)')
      } else {
        setMessage('✓ Dashboard preferences updated')
      }
    } catch (error) {
      console.warn('Error saving preferences:', error)
      // Fallback to localStorage
      localStorage.setItem(
        'dashboard-preferences',
        JSON.stringify({
          layout,
          theme,
          visibleCards,
        }),
      )
      setMessage('✓ Preferences saved locally')
    } finally {
      setIsSaving(false)
    }
  }

  const toggleCard = (key: keyof typeof visibleCards) => {
    setVisibleCards((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen smoke-surface flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading preferences...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen smoke-surface flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-12">
        <section className="glow-border rounded-lg p-px mb-8">
          <div className="rounded-lg bg-card/90 p-6 backdrop-blur md:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-accent">Customization</p>
            <h1 className="mt-3 text-3xl font-bold">Dashboard Preferences</h1>
          </div>
        </section>

        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="border-primary/40">
            <CardHeader>
              <CardTitle>Dashboard Layout</CardTitle>
              <CardDescription>Choose how your dashboard displays</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(['compact', 'standard', 'expanded'] as const).map((option) => (
                <label key={option} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="layout"
                    value={option}
                    checked={layout === option}
                    onChange={(e) => setLayout(e.target.value as DashboardLayout)}
                    className="w-4 h-4 border-primary/40 text-accent accent-accent"
                  />
                  <div>
                    <span className="font-medium text-foreground capitalize">{option}</span>
                    <p className="text-xs text-muted-foreground">
                      {option === 'compact' && 'Minimal layout, focus on key cards'}
                      {option === 'standard' && 'Balanced view with all main features'}
                      {option === 'expanded' && 'Full layout with detailed sections'}
                    </p>
                  </div>
                </label>
              ))}
            </CardContent>
          </Card>

          <Card className="border-primary/40">
            <CardHeader>
              <CardTitle>Theme</CardTitle>
              <CardDescription>Visual appearance preference</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(['dark-green', 'high-contrast', 'low-glow'] as const).map((option) => (
                <label key={option} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="theme"
                    value={option}
                    checked={theme === option}
                    onChange={(e) => setTheme(e.target.value as 'dark-green' | 'high-contrast' | 'low-glow')}
                    className="w-4 h-4 border-primary/40 text-accent accent-accent"
                  />
                  <div>
                    <span className="font-medium text-foreground capitalize">{option.replace('-', ' ')}</span>
                    <p className="text-xs text-muted-foreground">
                      {option === 'dark-green' && 'Default dark theme with green accents'}
                      {option === 'high-contrast' && 'Enhanced contrast for accessibility'}
                      {option === 'low-glow' && 'Reduced neon glow for reduced motion'}
                    </p>
                  </div>
                </label>
              ))}
            </CardContent>
          </Card>

          <Card className="border-primary/40">
            <CardHeader>
              <CardTitle>Visible Cards</CardTitle>
              <CardDescription>Choose which dashboard sections to display</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(Object.entries(visibleCards) as [keyof typeof visibleCards, boolean][]).map(([key, value]) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={() => toggleCard(key)}
                    className="w-4 h-4 rounded border-primary/40 bg-card text-accent accent-accent"
                  />
                  <span className="font-medium text-foreground capitalize">{key}</span>
                </label>
              ))}
            </CardContent>
          </Card>

          {message && (
            <div className="p-4 rounded-lg bg-accent/10 border border-accent/30 text-accent text-sm">
              {message}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 px-6 py-3 bg-accent text-accent-foreground rounded-lg font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Preferences'}
            </button>
            <Link href="/dashboard" className="flex-1">
              <button className="w-full px-6 py-3 bg-muted text-muted-foreground rounded-lg font-semibold hover:bg-muted/80 transition-colors">
                Back to Dashboard
              </button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
