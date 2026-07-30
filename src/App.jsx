import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ChartCard from './components/ChartCard'
import Header from './components/Header'
import Stories from './components/Stories'
import { nationFlags } from './constants'
import { STORIES } from './stories'
import './App.css'

// Viewports at or below this width receive the "mobile" optimisations:
// reduced stroke widths, top-10 nation limit, and compressed X-axis spacing.
// 1024 px covers phones *and* all standard tablet sizes (iPad mini → iPad Pro 11").
const MOBILE_BREAKPOINT = 1023

const COLORS = [
  '#3b82f6',
  '#ef4444',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#06b6d4',
  '#f97316',
  '#22c55e',
  '#e11d48',
  '#6366f1',
  '#14b8a6',
  '#ec4899'
]

function App() {
  const [rows, setRows] = useState([])
  const [error, setError] = useState(null)
  const [hoveredNation, setHoveredNation] = useState(null)
  const [clickedNations, setClickedNations] = useState(new Set())
  const [selectedStory, setSelectedStory] = useState(null)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= MOBILE_BREAKPOINT)

  // Keep a ref to the debounce timer so the cleanup function inside the
  // effect can always reach the latest timer id without a stale closure.
  const resizeTimerRef = useRef(null)

  const handleResize = useCallback(() => {
    // Debounce: wait 150 ms after the last resize event before committing the
    // new breakpoint check.  This prevents dozens of redundant state updates
    // while the user is actively dragging the browser edge.
    clearTimeout(resizeTimerRef.current)
    resizeTimerRef.current = setTimeout(() => {
      setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT)
    }, 150)
  }, []) // no deps — MOBILE_BREAKPOINT is module-level, setIsMobile is stable

  useEffect(() => {
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      // Cancel any pending debounced call so it cannot fire after unmount.
      clearTimeout(resizeTimerRef.current)
    }
  }, [handleResize])

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch('/data/medals_year_total_nation.csv')
        if (!response.ok) {
          throw new Error(`Failed to load CSV (${response.status})`)
        }
        const text = await response.text()
        const [headerLine, ...lines] = text.trim().split('\n')
        const headers = headerLine.split(',').map((value) => value.trim())
        const parsed = lines
          .map((line) => line.split(','))
          .filter((fields) => fields.length >= 3)
          .map((fields) => {
            const record = Object.fromEntries(
              headers.map((header, index) => [header, fields[index]])
            )
            return {
              year: Number(record.Year),
              total: Number(record.Total),
              nation: record.Nation
            }
          })
          .filter((row) => Number.isFinite(row.year) && Number.isFinite(row.total))
        setRows(parsed)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
      }
    }

    load()
  }, [])

  const { data, nations, maxRank, yearCount, totalsByNation, totalMedalsCount } = useMemo(() => {
    if (!rows.length) {
      return { data: [], nations: [], maxRank: 0, yearCount: 0, totalsByNation: {}, totalMedalsCount: 0 }
    }

    const byYear = new Map()
    const totals = new Map()

    for (const row of rows) {
      if (!byYear.has(row.year)) {
        byYear.set(row.year, [])
      }
      byYear.get(row.year).push(row)
      totals.set(row.nation, (totals.get(row.nation) || 0) + row.total)
    }

    const MOBILE_EXCLUDED_NATIONS = new Set(['South Korea', 'China', 'Japan', 'Switzerland', 'Austria', 'France'])

    const topNations = [...totals.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([nation]) => nation)
      .filter((nation) => !isMobile || !MOBILE_EXCLUDED_NATIONS.has(nation))

    const years = [...byYear.keys()].sort((a, b) => a - b)

    let series;
    if (isMobile) {
      const numBuckets = 6
      const bucketSize = Math.ceil(years.length / numBuckets)
      series = []

      for (let i = 0; i < years.length; i += bucketSize) {
        const bucketYears = years.slice(i, i + bucketSize)
        const bucketLabel = bucketYears.length > 1
          ? `${bucketYears[0]}–${bucketYears[bucketYears.length - 1].toString().slice(-2)}`
          : `${bucketYears[0]}`

        // Aggregate totals for this bucket
        const bucketTotals = new Map()
        bucketYears.forEach((year) => {
          byYear.get(year).forEach((row) => {
            bucketTotals.set(row.nation, (bucketTotals.get(row.nation) || 0) + row.total)
          })
        })

        const entries = [...bucketTotals.entries()]
          .map(([nation, total]) => ({ nation, total }))
          .sort((a, b) => b.total - a.total || a.nation.localeCompare(b.nation))

        let denseRank = 0
        let previousTotal = null
        const ranks = new Map()

        entries.forEach((entry, index) => {
          if (entry.total !== previousTotal) {
            denseRank = index + 1
            previousTotal = entry.total
          }
          ranks.set(entry.nation, denseRank)
        })

        const point = { year: bucketLabel }
        topNations.forEach((nation) => {
          point[nation] = ranks.get(nation) ?? null
          point[`${nation}_medals`] = bucketTotals.get(nation) ?? 0
        })
        series.push(point)
      }
    } else {
      series = years.map((year) => {
        const entries = [...byYear.get(year)].sort(
          (a, b) => b.total - a.total || a.nation.localeCompare(b.nation)
        )
        let denseRank = 0
        let previousTotal = null
        const ranks = new Map()

        entries.forEach((entry, index) => {
          if (entry.total !== previousTotal) {
            denseRank = index + 1
            previousTotal = entry.total
          }
          ranks.set(entry.nation, denseRank)
        })

        const point = { year }
        topNations.forEach((nation) => {
          point[nation] = ranks.get(nation) ?? null
          // Find the specific entry for this nation to get medal count
          const entry = entries.find((e) => e.nation === nation)
          point[`${nation}_medals`] = entry ? entry.total : 0
        })
        return point
      })
    }

    let computedMaxRank = 0
    for (const point of series) {
      for (const nation of topNations) {
        const value = point[nation]
        if (value && value > computedMaxRank) {
          computedMaxRank = value
        }
      }
    }

    const totalMedalsCount = [...totals.values()].reduce((sum, v) => sum + v, 0)

    return {
      data: series,
      nations: topNations,
      maxRank: computedMaxRank,
      yearCount: years.length,
      totalsByNation: Object.fromEntries(totals),
      totalMedalsCount
    }
  }, [rows, isMobile])

  const handleNationClick = (nation) => {
    if (isMobile) {
      setClickedNations((prev) => {
        if (prev.size === 1 && prev.has(nation)) {
          return new Set()
        }
        return new Set([nation])
      })
    } else {
      setClickedNations((prev) => {
        const next = new Set(prev)
        if (next.has(nation)) {
          next.delete(nation)
        } else {
          next.add(nation)
        }
        return next
      })
    }
  }

  const handleClearSelection = () => {
    setClickedNations(new Set())
    setSelectedStory(null)
  }

  const handleStorySelect = (story) => {
    if (story && story.id !== selectedStory?.id) {
      setSelectedStory(story)
      setClickedNations(new Set(story.nations))
    } else {
      setSelectedStory(null)
      setClickedNations(new Set())
    }
  }

  const renderLineDot = (nation, color, isHovered, isDimmed) => (props) => {
    const { cx, cy, payload, value, index } = props
    // On mobile, the data is already bucketed to reduce visual density,
    // so we render all available dots.
    if (!Number.isFinite(cx) || !Number.isFinite(cy) || value == null) {
      return null
    }
    const medalCount = payload?.[`${nation}_medals`]
    const opacity = isDimmed ? 0.15 : 1
    const compact = isMobile && selectedStory != null
    const baseRadius = compact ? 1.25 : isMobile ? 1.75 : 3
    const hoverRadius = compact ? 2.75 : isMobile ? 3.5 : 5
    return (
      <g>
        <circle
          cx={cx}
          cy={cy}
          r={isHovered ? hoverRadius : baseRadius}
          stroke={color}
          fill={color}
          strokeOpacity={opacity}
          fillOpacity={opacity}
        />
        {isHovered && Number.isFinite(medalCount) ? (
          <text
            x={cx}
            y={cy - 8}
            fill="#e2e8f0"
            fontSize={14}
            textAnchor="middle"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {medalCount}
          </text>
        ) : null}
      </g>
    )
  }

  const renderTooltip = ({ active, label, payload }) => {
    if (!active || !payload?.length) {
      return null
    }

    const groups = new Map()

    payload.forEach((item) => {
      if (item == null || item.value == null) {
        return
      }
      const medalCount = item.payload?.[`${item.name}_medals`]
      if (!Number.isFinite(medalCount) || medalCount <= 0) {
        return
      }
      if (!groups.has(medalCount)) {
        groups.set(medalCount, [])
      }
      groups.get(medalCount).push(item.name)
    })

    if (!groups.size) {
      return null
    }

    const sortedGroups = [...groups.entries()].sort((a, b) => b[0] - a[0])

    return (
      <div
        style={{
          background: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '10px',
          padding: '0.75rem 0.9rem',
          color: '#e2e8f0',
          minWidth: '240px'
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: '0.4rem' }}>
          {isMobile ? 'Period' : 'Year'} {label}
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {sortedGroups.map(([medals, names], index) => {
              const sortedNames = [...names].sort((a, b) => a.localeCompare(b))
              return (
                <tr key={`${medals}-${index}`}>
                  <td
                    style={{
                      color: '#94a3b8',
                      padding: index === 0 ? '0' : '0.2rem 0 0',
                      whiteSpace: 'nowrap',
                      verticalAlign: 'middle',
                      fontVariantNumeric: 'tabular-nums',
                      width: '88px'
                    }}
                  >
                    <span style={{ display: 'inline-block', minWidth: '2ch', textAlign: 'right' }}>
                      {medals}
                    </span>{' '}
                    {medals === 1 ? 'medal' : 'medals'}
                  </td>
                  <td
                    style={{
                      padding: index === 0 ? '0 0 0 0.6rem' : '0.2rem 0 0 0.6rem',
                      verticalAlign: 'middle'
                    }}
                  >
                    {sortedNames.map((name) => (
                      <span
                        key={name}
                        title={name}
                        style={{
                          fontSize: '1.8rem',
                          marginRight: '0.25rem',
                          cursor: 'help'
                        }}
                      >
                      {(() => {
                        const flag = nationFlags[name]
                        if (flag) {
                          return (
                            <img
                              src={flag}
                              alt={name}
                              style={{
                                width: '2.2rem',
                                height: '1.8rem',
                                objectFit: 'contain',
                                display: 'inline-block',
                                verticalAlign: 'middle'
                              }}
                            />
                          )
                        }
                        return name
                      })()}
                      </span>
                    ))}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="app">
      <Header
        yearCount={yearCount}
        nationsCount={nations.length}
        maxRank={maxRank}
        totalMedalsCount={totalMedalsCount}
      />

      {isMobile && (
        <p className="text-center text-slate-600 text-[10px] uppercase tracking-[0.2em] font-bold px-4 pb-3">
          Additional stories &amp; nations available on desktop
        </p>
      )}

      <Stories
        stories={isMobile ? STORIES.filter((s) => s.id !== 'asian-rise' && s.id !== 'infrastructure-barrier') : STORIES}
        selectedStory={selectedStory}
        onStorySelect={handleStorySelect}
        onClearSelection={handleClearSelection}
      />

      <ChartCard
        error={error}
        data={data}
        maxRank={maxRank}
        nations={nations}
        totalsByNation={totalsByNation}
        clickedNations={clickedNations}
        hoveredNation={hoveredNation}
        setHoveredNation={setHoveredNation}
        colors={COLORS}
        renderTooltip={renderTooltip}
        renderLineDot={renderLineDot}
        onNationClick={handleNationClick}
        onClearSelection={handleClearSelection}
        highlightYears={selectedStory?.highlightYears}
        selectedStory={selectedStory}
        isMobile={isMobile}
      />

      <footer className="max-w-7xl mx-auto mt-auto pt-6 border-t border-slate-900 text-center text-slate-600 text-[10px] uppercase tracking-[0.2em] font-bold">
        Medal Ranking Dashboard • 2026{' '}
        <a
          href="https://orange-goose.com"
          target="_blank"
          rel="noopener noreferrer"
          className="footer-link"
        >
          Orange Goose Analytics
        </a>
        {' '}• All rights reserved
      </footer>

    

    </div>
  )
}

export default App
