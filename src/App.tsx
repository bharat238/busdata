import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase, supabaseConfigured, type BusReport } from './lib/supabase'
import { Bus, Check, ChevronDown, ChevronUp, MapPin, Send, Sparkles } from "lucide-react";
import logoImage from './imports/image_8d0608d.png'

// ─── Demo data shown when Supabase is not connected ───────────────────────────
const DEMO_REPORTS: BusReport[] = [
  {
    id: '1',
    from_place: 'Bhatkal',
    to_place: 'Honnavar',
    bus_name: 'KSRTC Express',
    arrival_time: '15:20',
    departure_time: '16:30',
    note: 'it has only stops in murudeshwar and manki · Departure: 04:30 PM',
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    from_place: 'Karwar',
    to_place: 'Mangalore',
    bus_name: 'KTC Sleeper',
    arrival_time: '06:10',
    departure_time: null,
    note: null,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
]

// ─── Utilities ─────────────────────────────────────────────────────────────────
function nowMinutes(): number {
  const now = new Date()
  return now.getHours() * 60 + now.getMinutes()
}

function minutesToHHMM(total: number): string {
  const h = Math.floor(((total % 1440) + 1440) % 1440 / 60)
  const m = ((total % 1440) + 1440) % 1440 % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function minutesTo12h(total: number): string {
  const norm = ((total % 1440) + 1440) % 1440
  const h = Math.floor(norm / 60)
  const m = norm % 60
  const ampm = h < 12 ? 'AM' : 'PM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`
}

function hhmm24ToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

function formatTime(hhmm: string): string {
  return minutesTo12h(hhmm24ToMinutes(hhmm))
}

function formatTimeAgo(isoString: string): string {
  const now = new Date()
  const created = new Date(isoString)
  const diffMs = now.getTime() - created.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

// ─── Icons ─────────────────────────────────────────────────────────────────────
function BusIcon({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <rect x="1" y="5" width="22" height="11" rx="2.5" fill={color} />
      <rect x="3.5" y="7" width="4.5" height="3.5" rx="0.7" fill="white" />
      <rect x="9.5" y="7" width="4.5" height="3.5" rx="0.7" fill="white" />
      <rect x="15.5" y="7" width="4.5" height="3.5" rx="0.7" fill="white" />
      <circle cx="6.5" cy="16" r="2.5" fill={color} />
      <circle cx="6.5" cy="16" r="1" fill="white" />
      <circle cx="17.5" cy="16" r="2.5" fill={color} />
      <circle cx="17.5" cy="16" r="1" fill="white" />
    </svg>
  )
}

function PinIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function ChevronUp({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m18 15-6-6-6 6" />
    </svg>
  )
}

function ChevronDown({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

function SparkleIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z" />
    </svg>
  )
}

function PaperPlane({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  )
}

function CheckIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

function ClockIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function CurrentTimeClock() {
  const [time, setTime] = useState(() => new Date())

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const timeString = time.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  })

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      background: 'rgba(255, 255, 255, 0.08)',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      borderRadius: '9999px',
      padding: '6px 12px',
      color: '#ffffff',
      fontSize: '12px',
      fontWeight: 600,
      fontFamily: 'monospace, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, sans-serif',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      userSelect: 'none',
      whiteSpace: 'nowrap',
    }}>
      <span style={{ display: 'flex', alignItems: 'center', color: '#F59E0B' }}>
        <ClockIcon size={13} />
      </span>
      <span style={{ fontVariantNumeric: 'tabular-nums' }}>
        {timeString}
      </span>
    </div>
  )
}

// ─── TimeStepper ───────────────────────────────────────────────────────────────
function TimeStepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const norm = ((value % 1440) + 1440) % 1440
  const hr = Math.floor(norm / 60)
  const mn = norm % 60

  const adjust = (delta: number) => onChange(value + delta)
  const setNow = () => onChange(nowMinutes())

  const nudges1 = [-15, -5, -1, 1, 5]
  const nudges2 = [15]

  return (
    <div style={{ background: '#F3F4F6', borderRadius: 12, padding: '14px 14px 12px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Main stepper row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        {/* HR column */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 52 }}>
          <button onClick={() => adjust(60)} style={chevBtn}>
            <ChevronUp size={14} />
          </button>
          <span style={digitStyle}>{String(hr).padStart(2, '0')}</span>
          <button onClick={() => adjust(-60)} style={chevBtn}>
            <ChevronDown size={14} />
          </button>
          <span style={unitLabel}>HR</span>
        </div>

        {/* Colon */}
        <span style={{ fontSize: 28, fontWeight: 600, color: '#111', paddingBottom: 14, paddingLeft: 2, paddingRight: 2, fontVariantNumeric: 'tabular-nums' }}>:</span>

        {/* MIN column */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 52 }}>
          <button onClick={() => adjust(1)} style={chevBtn}>
            <ChevronUp size={14} />
          </button>
          <span style={digitStyle}>{String(mn).padStart(2, '0')}</span>
          <button onClick={() => adjust(-1)} style={chevBtn}>
            <ChevronDown size={14} />
          </button>
          <span style={unitLabel}>MIN</span>
        </div>

        {/* SHOWN AS display */}
        <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', paddingBottom: 14 }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: '#111', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.5px' }}>
            {minutesTo12h(norm)}
          </span>
          <span style={{ fontSize: 10, color: '#9CA3AF', letterSpacing: '0.08em', fontWeight: 500, marginTop: 1 }}>SHOWN AS</span>
        </div>
      </div>

      {/* Nudge row 1 */}
      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
        {nudges1.map(n => (
          <button key={n} onClick={() => adjust(n)} style={nudgeBtn}>
            {n > 0 ? `+${n}m` : `${n}m`}
          </button>
        ))}
      </div>

      {/* Nudge row 2 */}
      <div style={{ display: 'flex', gap: 6, marginTop: 6, alignItems: 'center' }}>
        {nudges2.map(n => (
          <button key={n} onClick={() => adjust(n)} style={nudgeBtn}>
            +{n}m
          </button>
        ))}
        <button onClick={setNow} style={{ ...nudgeBtn, marginLeft: 'auto', background: '#374151', color: '#fff', borderColor: '#374151' }}>
          Set to now
        </button>
      </div>
    </div>
  )
}

const chevBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  width: 28, height: 24, borderRadius: 6, border: 'none',
  background: 'transparent', cursor: 'pointer', color: '#6B7280',
  transition: 'background 0.15s',
}

const digitStyle: React.CSSProperties = {
  fontSize: 32, fontWeight: 700, color: '#111', lineHeight: 1,
  fontVariantNumeric: 'tabular-nums', letterSpacing: '-1px',
  minWidth: 44, textAlign: 'center',
}

const unitLabel: React.CSSProperties = {
  fontSize: 10, color: '#9CA3AF', letterSpacing: '0.1em', fontWeight: 500, marginTop: 2,
}

const nudgeBtn: React.CSSProperties = {
  padding: '5px 10px', borderRadius: 20, border: '1px solid #E5E7EB',
  background: '#fff', fontSize: 12, fontWeight: 500, color: '#374151',
  cursor: 'pointer', transition: 'background 0.15s',
}

// ─── Autocomplete Input ────────────────────────────────────────────────────────
function AutocompleteInput({
  label,
  placeholder,
  value,
  onChange,
  suggestions,
  icon,
}: {
  label: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  suggestions: string[]
  icon: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const filtered = suggestions.filter(s =>
    s.toLowerCase().includes(value.toLowerCase()) && s.toLowerCase() !== value.toLowerCase()
  ).slice(0, 6)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div ref={ref} style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }}>
          {icon}
        </div>
        <input
          value={value}
          onChange={e => { onChange(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          style={inputStyle}
        />
        {open && filtered.length > 0 && (
          <div style={dropdownStyle}>
            {filtered.map(s => (
              <div
                key={s}
                onMouseDown={() => { onChange(s); setOpen(false) }}
                style={dropdownItem}
              >
                {s}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 13, fontWeight: 600, color: '#1F2937', marginBottom: 6,
}

const inputStyle: React.CSSProperties = {
  width: '100%', paddingLeft: 38, paddingRight: 14, paddingTop: 11, paddingBottom: 11,
  borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 14, color: '#111',
  outline: 'none', background: '#fff', boxSizing: 'border-box',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  transition: 'border-color 0.15s',
}

const dropdownStyle: React.CSSProperties = {
  position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
  background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 10,
  boxShadow: '0 8px 24px rgba(0,0,0,0.10)', zIndex: 100, overflow: 'hidden',
}

const dropdownItem: React.CSSProperties = {
  padding: '10px 14px', fontSize: 14, color: '#1F2937', cursor: 'pointer',
  transition: 'background 0.1s',
}

// ─── Report Card ───────────────────────────────────────────────────────────────
function ReportCard({ report }: { report: BusReport }) {
  const arrivalDisplay = formatTime(report.arrival_time)
  const departureDisplay = report.departure_time ? formatTime(report.departure_time) : null
  const timeAgo = formatTimeAgo(report.created_at)

  return (
    <div style={{
      background: '#fff', borderRadius: 16, border: '1px solid #E5E7EB',
      padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    }}>
      {/* Header row with bus icon, bus name pill, and time ago */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 12 }}>
        {/* Bus icon - separate element */}
        <div style={{
          width: 32, height: 32, borderRadius: 8, background: '#F3F4F6',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <BusIcon size={16} color="#6B7280" />
        </div>
        
        {/* Bus name pill badge - auto width, no truncation */}
        <div style={{
          display: 'flex', alignItems: 'center',
          background: '#F3F4F6', borderRadius: 999,
          padding: '6px 12px', flex: 1, minWidth: -0,
        }}>
          <span style={{
            fontSize: 14, fontWeight: 600, color: '#111',
            whiteSpace: 'normal', wordBreak: 'break-word',
          }}>
            {report.bus_name}
          </span>
        </div>
        
        {/* Time ago */}
        <div style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500, whiteSpace: 'nowrap' }}>
          {timeAgo}
        </div>
      </div>

      {/* Arrival and departure time */}
      <div style={{ fontSize: 16, fontWeight: 600, color: '#1F2937', marginBottom: 8 }}>
        Arrival {arrivalDisplay}
        {departureDisplay && <span> · Departure {departureDisplay}</span>}
      </div>

      {/* Route */}
      <div style={{ fontSize: 16, fontWeight: 600, color: '#1F2937', marginBottom: report.note ? 12 : 0 }}>
        {report.from_place} → {report.to_place}
      </div>

      {/* Note in distinct background box */}
      {report.note && (
        <div style={{
          background: '#F9FAFB', borderRadius: 10, border: '1px solid #E5E7EB',
          padding: '12px', marginTop: 8,
        }}>
          <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.5 }}>
            {report.note}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [reports, setReports] = useState<BusReport[]>(DEMO_REPORTS)
  const [fromSuggestions, setFromSuggestions] = useState<string[]>(['Bhatkal', 'Karwar', 'Udupi', 'Mangalore', 'Honnavar', 'Kumta'])
  const [toSuggestions, setToSuggestions] = useState<string[]>(['Honnavar', 'Mangalore', 'Bangalore', 'Karwar', 'Bhatkal', 'Udupi'])
  const [busSuggestions, setBusSuggestions] = useState<string[]>(['KSRTC Express', 'KTC Sleeper', 'Sharma Travels', 'Paulo Travels'])
  const [activePage, setActivePage] = useState<'home' | 'data'>('home')
  const [loading, setLoading] = useState(false)

  // Form state
  const [fromPlace, setFromPlace] = useState('')
  const [toPlace, setToPlace] = useState('')
  const [busName, setBusName] = useState('')
  const [arrivalMins, setArrivalMins] = useState(nowMinutes)
  const [hasDeparture, setHasDeparture] = useState(true)
  const [departureMins, setDepartureMins] = useState(() => nowMinutes())
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  // Load reports
  const loadReports = useCallback(async () => {
    if (!supabaseConfigured || !supabase) return
    setLoading(true)
    try {
      const { data } = await supabase
        .from('bus_reports')
        .select('*')
        .order('created_at', { ascending: false })
      if (data) {
        setReports(data as BusReport[])
        setFromSuggestions([...new Set(data.map((r: BusReport) => r.from_place))])
        setToSuggestions([...new Set(data.map((r: BusReport) => r.to_place))])
        setBusSuggestions([...new Set(data.map((r: BusReport) => r.bus_name))])
      }
    } catch (e) {
      console.error('Error loading reports:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadReports() }, [loadReports])

  // Refresh bus suggestions when from+to changes
  useEffect(() => {
    if (!supabaseConfigured || !supabase || !fromPlace || !toPlace) return
    supabase
      .from('bus_reports')
      .select('bus_name')
      .eq('from_place', fromPlace)
      .eq('to_place', toPlace)
      .then(({ data }) => {
        if (data) setBusSuggestions([...new Set(data.map((r: { bus_name: string }) => r.bus_name))])
      })
  }, [fromPlace, toPlace])

  const handleSubmit = async () => {
    if (!fromPlace || !toPlace || !busName) return
    setSubmitting(true)
    setSubmitError(null)
    const arrival_time = minutesToHHMM(arrivalMins)
    const departure_time = hasDeparture ? minutesToHHMM(departureMins) : null

    if (supabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('bus_reports').insert({
          from_place: fromPlace,
          to_place: toPlace,
          bus_name: busName,
          arrival_time,
          departure_time,
          note: note || null,
        }).select().single()
        if (error) {
          setSubmitError(error.message)
          setSubmitting(false)
          return
        }
        if (data) {
          setReports(prev => [data as BusReport, ...prev])
        }
      } catch (e) {
        setSubmitError('An unexpected error occurred')
        setSubmitting(false)
        return
      }
    } else {
      // Demo mode: add locally
      const newReport: BusReport = {
        id: String(Date.now()),
        from_place: fromPlace,
        to_place: toPlace,
        bus_name: busName,
        arrival_time,
        departure_time,
        note: note || null,
        created_at: new Date().toISOString(),
      }
      setReports(prev => [newReport, ...prev])
    }

    setSubmitting(false)
    setSubmitted(true)
    setFromPlace(''); setToPlace(''); setBusName(''); setNote('')
    setArrivalMins(nowMinutes()); setDepartureMins(nowMinutes())
    setHasDeparture(true)
    setTimeout(() => setSubmitted(false), 4000)
  }

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, "Helvetica Neue", sans-serif', background: '#F9FAFB', minHeight: '100vh', paddingBottom: 80 }}>

      {/* Home Page (Form) */}
      {activePage === 'home' && (
        <>
          {/* ─── Hero ─────────────────────────────────────────────────────────────── */}
          <div style={{
            background: 'radial-gradient(ellipse 80% 60% at 20% 0%, rgba(245,158,11,0.12) 0%, transparent 60%), linear-gradient(160deg, #0F172A 0%, #0B0F0E 100%)',
            paddingTop: 32,
            paddingBottom: 120,
            paddingLeft: 20,
            paddingRight: 20,
            position: 'relative',
          }}>
            {/* Real-time capsule clock */}
            <div style={{
              position: 'absolute',
              top: 8,
              right: 16,
              zIndex: 50,
            }}>
              <CurrentTimeClock />
            </div>
            {/* Logo row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, maxWidth: 520, margin: '0 auto 16px' }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', background: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                overflow: 'hidden',
              }}>
                <img src={logoImage} alt="BusData Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.3px' }}>
                <span style={{ color: '#fff' }}>Bus</span>
                <span style={{ color: '#F59E0B' }}>Data</span>
              </span>
            </div>

            {/* Headline */}
            <div style={{ maxWidth: 520, margin: '0 auto' }}>
              <h1 style={{
                fontSize: 'clamp(28px, 6vw, 40px)', fontWeight: 800, color: '#fff',
                lineHeight: 1.15, letterSpacing: '-0.5px', margin: '0 0 16px',
              }}>
                Share real bus arrival & departure times.
              </h1>
              <p style={{
                fontSize: 15, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7,
                maxWidth: 360, margin: 0,
              }}>
                Anyone can add a bus timing here. Every entry feeds the BusData app's database so everyone gets a more honest picture of when buses actually come and go.
              </p>
            </div>
          </div>

          {/* ─── Form card (overlaps hero) ─────────────────────────────────────────── */}
          <div style={{ maxWidth: 560, margin: '0 auto', padding: '0 16px' }}>
            <div style={{
              background: '#fff',
              borderRadius: '20px 20px 16px 16px',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.18), 0 4px 24px rgba(0,0,0,0.08)',
              padding: '24px 20px 28px',
              marginTop: -96,
              position: 'relative',
              zIndex: 10,
            }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111', margin: '0 0 4px' }}>Add a bus timing</h2>
              <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 20px' }}>
                Anyone can contribute to the BusData database. No name, no login.
              </p>

              {/* Success banner */}
              {submitted && (
                <div style={{
                  background: '#DCFCE7', border: '1px solid #BBF7D0', borderRadius: 10,
                  padding: '10px 14px', fontSize: 13, color: '#15803D', fontWeight: 500,
                  marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <CheckIcon size={13} /> Timing submitted — thank you for contributing!
                </div>
              )}

              {/* Error banner */}
              {submitError && (
                <div style={{
                  background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 10,
                  padding: '10px 14px', fontSize: 13, color: '#DC2626', fontWeight: 500,
                  marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <span>⚠️</span> {submitError}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* From */}
                <AutocompleteInput
                  label="From"
                  placeholder="Origin stop / place"
                  value={fromPlace}
                  onChange={setFromPlace}
                  suggestions={fromSuggestions}
                  icon={<PinIcon size={15} />}
                />

                {/* To */}
                <AutocompleteInput
                  label="To"
                  placeholder="Destination stop / place"
                  value={toPlace}
                  onChange={setToPlace}
                  suggestions={toSuggestions}
                  icon={<PinIcon size={15} />}
                />

                {/* Bus name */}
                <AutocompleteInput
                  label="Bus name"
                  placeholder="e.g. Express 12A"
                  value={busName}
                  onChange={setBusName}
                  suggestions={busSuggestions}
                  icon={<BusIcon size={15} />}
                />

                {/* Arrival time */}
                <div>
                  <label style={labelStyle}>Arrival time</label>
                  <TimeStepper value={arrivalMins} onChange={setArrivalMins} />
                </div>

                {/* Departure time */}
                <div>
                  <label style={labelStyle}>Departure time</label>
                  {hasDeparture ? (
                    <>
                      <TimeStepper value={departureMins} onChange={setDepartureMins} />
                      <button
                        onClick={() => setHasDeparture(false)}
                        style={{
                          marginTop: 8, background: 'none', border: 'none', padding: 0,
                          fontSize: 13, color: '#6B7280', cursor: 'pointer', textDecoration: 'underline',
                          textUnderlineOffset: 2,
                        }}
                      >
                        Remove departure time
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setHasDeparture(true)}
                      style={{
                        background: 'none', border: '1.5px dashed #D1D5DB', borderRadius: 10,
                        width: '100%', padding: '11px 14px', fontSize: 13, color: '#9CA3AF',
                        cursor: 'pointer', textAlign: 'left',
                      }}
                    >
                      + Add departure time
                    </button>
                  )}
                </div>

                {/* Note */}
                <div>
                  <label style={labelStyle}>Note <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(optional)</span></label>
                  <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="e.g. 10 minutes late, very crowded"
                    rows={3}
                    style={{
                      ...inputStyle,
                      paddingLeft: 14, resize: 'vertical', lineHeight: 1.5,
                      display: 'block', minHeight: 72,
                    }}
                  />
                </div>

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !fromPlace || !toPlace || !busName}
                  style={{
                    width: '100%', padding: '13px 0', borderRadius: 999,
                    background: (!fromPlace || !toPlace || !busName) ? '#CBD5E1' : '#64748B',
                    color: '#fff', border: 'none', fontSize: 15, fontWeight: 600,
                    cursor: (!fromPlace || !toPlace || !busName) ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'background 0.2s',
                  }}
                >
                  <PaperPlane size={15} />
                  {submitting ? 'Submitting…' : 'Submit timing'}
                </button>
              </div>
            </div>
          </div>

          {/* ─── Footer ───────────────────────────────────────────────────────────── */}
          <footer style={{ textAlign: 'center', padding: '32px 20px 48px', color: '#9CA3AF', fontSize: 13, lineHeight: 1.6 }}>
            No account needed. Every report you share powers the BusData app<br />
            so everyone gets more accurate bus timings.
          </footer>
        </>
      )}

      {/* Data Page (Reports List) */}
      {activePage === 'data' && (
        <div style={{
          background: 'radial-gradient(ellipse 80% 60% at 20% 0%, rgba(245,158,11,0.12) 0%, transparent 60%), linear-gradient(160deg, #0F172A 0%, #0B0F0E 100%)',
          minHeight: '100vh',
        }}>
          {/* Header with Logo */}
          <div style={{ padding: '32px 20px 24px', maxWidth: 560, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', background: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                overflow: 'hidden',
              }}>
                <img src={logoImage} alt="BusData Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.3px' }}>
                <span style={{ color: '#fff' }}>Bus</span>
                <span style={{ color: '#F59E0B' }}>Data</span>
              </span>
            </div>
            <h1 style={{
              fontSize: 24, fontWeight: 800, color: '#fff',
              lineHeight: 1.15, letterSpacing: '-0.5px', margin: '0 0 8px',
            }}>
              Recent Reports
            </h1>
            <p style={{
              fontSize: 15, color: 'rgba(255,255,255,0.6)',
              margin: 0,
            }}>
              Latest bus timings shared by the community.
            </p>
          </div>

          {/* Reports List Container */}
          <div style={{
            background: '#F9FAFB',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            minHeight: 'calc(100vh - 200px)',
            padding: '24px 16px',
          }}>
            <div style={{ maxWidth: 560, margin: '0 auto' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6B7280', fontSize: 14 }}>
                  Loading reports...
                </div>
              ) : reports.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {reports.map(report => (
                    <ReportCard key={report.id} report={report} />
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF', fontSize: 14 }}>
                  No reports yet — be the first to contribute!
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Tab Navigation */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: '#fff',
        borderTop: '1px solid #E5E7EB',
        display: 'flex',
        justifyContent: 'space-around',
        padding: '8px 0',
        paddingBottom: 'calc(8px + env(safe-area-inset-bottom))',
        zIndex: 1000,
      }}>
        {/* Home Tab */}
        <button
          onClick={() => setActivePage('home')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px 16px',
            borderRadius: 12,
            transition: 'all 0.2s',
          }}
        >
          <svg
            width={24}
            height={24}
            viewBox="0 0 24 24"
            fill={activePage === 'home' ? '#64748B' : '#9CA3AF'}
          >
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
          </svg>
          <span style={{
            fontSize: 12,
            fontWeight: activePage === 'home' ? 600 : 500,
            color: activePage === 'home' ? '#64748B' : '#9CA3AF',
          }}>
            Home
          </span>
        </button>

        {/* Data Tab */}
        <button
          onClick={() => setActivePage('data')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px 16px',
            borderRadius: 12,
            transition: 'all 0.2s',
          }}
        >
          <svg
            width={24}
            height={24}
            viewBox="0 0 24 24"
            fill={activePage === 'data' ? '#64748B' : '#9CA3AF'}
          >
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
          </svg>
          <span style={{
            fontSize: 12,
            fontWeight: activePage === 'data' ? 600 : 500,
            color: activePage === 'data' ? '#64748B' : '#9CA3AF',
          }}>
            Data
          </span>
        </button>
      </div>

    </div>
  )
}
