
import OlympicRings from './OlympicRings';

function Header({ yearCount, nationsCount, maxRank, totalMedalsCount }) {
  return (
    <header className="app-header">
      <div>
        <div className="eyebrow-row">
          <p className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            Winter Olympics
            <OlympicRings width={40} height={25} />
          </p>
          <div className="watermark">
            <a
              href="https://orange-goose.com"
              target="_blank"
              rel="noopener noreferrer"
              className="watermark-link"
            >
              <img
                src="/orange_goose_logo.png"
                alt="Orange Goose Analytics"
                className="watermark-logo"
              />
              <span className="watermark-text">Orange Goose Analytics</span>
            </a>
          </div>
        </div>
        <h1>Medal Rankings Bump Chart</h1>
        <p className="subtitle">
          Total medals won by all nations across {yearCount} games.
        </p>
      </div>
      <div className="summary">
        <div className="summary-item">
          <span className="summary-label">Years</span>
          <span className="summary-value">{yearCount || '—'}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Nations</span>
          <span className="summary-value">{nationsCount || '—'}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Max rank</span>
          <span className="summary-value">{maxRank || '—'}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Total medals</span>
          <span className="summary-value" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {totalMedalsCount ? totalMedalsCount.toLocaleString() : '—'}
          </span>
        </div>
      </div>
    </header>
  );
}

export default Header;
