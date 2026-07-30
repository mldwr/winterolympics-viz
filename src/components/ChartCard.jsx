import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine
} from 'recharts'
import { nationFlags } from '../constants'
import { STORIES } from '../stories'

const STORY_NATIONS = new Set(STORIES.flatMap((story) => story.nations))

function ChartCard({
  error,
  data,
  maxRank,
  nations,
  totalsByNation,
  clickedNations,
  hoveredNation,
  setHoveredNation,
  colors,
  renderTooltip,
  renderLineDot,
  onNationClick,
  onClearSelection,
  highlightYears = [],
  selectedStory = null,
  isMobile = false
}) {
  const anyActive = clickedNations.size > 0 || hoveredNation != null
  const isNationActive = (nation) => clickedNations.has(nation) || hoveredNation === nation
  const mobileNationFilter = selectedStory
    ? new Set(selectedStory.nations)
    : STORY_NATIONS
  const visibleNations = isMobile
    ? [...nations]
        .filter((nation) => mobileNationFilter.has(nation))
        .sort((a, b) => (totalsByNation?.[b] ?? 0) - (totalsByNation?.[a] ?? 0))
    : nations
  const renderLegend = () => (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: isMobile ? '0.75rem 1.25rem' : '0.5rem 1rem',
        justifyContent: 'center',
        paddingTop: '0.35rem',
        color: '#e2e8f0',
        fontSize: isMobile ? '0.95rem' : '0.85rem'
      }}
    >
      {visibleNations.map((nation) => {
        const index = nations.indexOf(nation)
        const active = isNationActive(nation)
        const isDimmed = anyActive && !active
        const color = colors[index % colors.length]
        const flag = nationFlags[nation]
        return (
          <span
            key={nation}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: isMobile ? '0.5rem' : '0.4rem',
              opacity: isDimmed ? 0.35 : 1,
              cursor: 'pointer',
              minHeight: isMobile ? '2.5rem' : undefined,
              padding: isMobile ? '0.25rem 0' : undefined
            }}
            onMouseEnter={() => setHoveredNation(nation)}
            onMouseLeave={() => setHoveredNation(null)}
            onClick={(e) => { e.stopPropagation(); onNationClick?.(nation) }}
          >
            <span
              style={{
                width: isMobile ? 12 : 10,
                height: isMobile ? 12 : 10,
                borderRadius: 999,
                backgroundColor: color,
                boxShadow: `0 0 0 1px ${color}`,
                flexShrink: 0
              }}
            />
            {flag ? (
              <img
                src={flag}
                alt={nation}
                style={{
                  width: '1.25rem',
                  height: '1rem',
                  objectFit: 'contain',
                  display: 'inline-block'
                }}
              />
            ) : null}
            {nation}
            {totalsByNation && Number.isFinite(totalsByNation[nation]) ? (
              <span style={{ color: '#94a3b8', marginLeft: '0.2rem', fontVariantNumeric: 'tabular-nums' }}>
                {totalsByNation[nation].toLocaleString()}
              </span>
            ) : null}
          </span>
        )
      })}
    </div>
  )

  return (
    <section className="chart-card" onClick={onClearSelection}>
      {error ? (
        <div className="status">{error}</div>
      ) : !data.length ? (
        <div className="status">Loading data…</div>
      ) : (
        <>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={isMobile ? 420 : 720}>
              <LineChart 
                data={data} 
                margin={{ 
                  top: 20, 
                  right: isMobile ? 30 : 40, 
                  left: 0, 
                  bottom: 20 
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.35)" />
                <XAxis
                  dataKey="year"
                  tick={{ fill: '#e2e8f0', fontSize: isMobile ? 11 : 12 }}
                  interval={0}
                  minTickGap={isMobile ? 10 : 5}
                />
                <YAxis
                  reversed
                  allowDecimals={false}
                  domain={[1, Math.max(3, maxRank || 1)]}
                  tick={{ fill: '#e2e8f0', fontSize: isMobile ? 11 : 12 }}
                  width={isMobile ? 24 : 36}
                  label={isMobile ? undefined : {
                    value: 'Rank',
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#e2e8f0',
                    offset: -10,
                    style: { textAnchor: 'middle' }
                  }}
                />
                {highlightYears.map((year) => (
                  <ReferenceLine
                    key={year}
                    x={year}
                    stroke={selectedStory?.color || '#94a3b8'}
                    strokeDasharray="3 3"
                    strokeWidth={2}
                  />
                ))}
                <Tooltip
                  cursor={{ stroke: '#94a3b8', strokeDasharray: '4 4' }}
                  wrapperStyle={{ zIndex: 1000 }}
                  content={renderTooltip}
                  isAnimationActive={false}
                />
                {visibleNations.map((nation) => {
                  const index = nations.indexOf(nation)
                  const active = isNationActive(nation)
                  const isHovered = active
                  const isDimmed = anyActive && !active
                  const color = colors[index % colors.length]
                  const baseStrokeWidth = isMobile ? (selectedStory ? 1 : 1.25) : 2
                  const hoveredStrokeWidth = isMobile ? (selectedStory ? 2 : 2.5) : 4
                  return (
                    <Line
                      key={nation}
                      type="monotone"
                      dataKey={nation}
                      stroke={color}
                      strokeWidth={isHovered ? hoveredStrokeWidth : baseStrokeWidth}
                      strokeOpacity={isDimmed ? 0.15 : 1}
                      dot={renderLineDot(nation, color, isHovered, isDimmed)}
                      activeDot={{ r: isMobile ? 4 : 6 }}
                      connectNulls
                    />
                  )
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-footer">
            <span className="source-label">Source: Wikipedia</span>
          </div>
          {renderLegend()}
        </>
      )}
    </section>
  )
}

export default ChartCard
