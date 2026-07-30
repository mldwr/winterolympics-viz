function OlympicRings({ className, width = 32, height = 20 }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 320 200" 
      width={width} 
      height={height}
      className={className}
      role="img"
      aria-label="Olympic Rings"
    >
      <circle cx="70" cy="70" r="50" fill="none" stroke="#0085C7" strokeWidth="12"/>
      <circle cx="160" cy="70" r="50" fill="none" stroke="#f7f3f3ff" strokeWidth="12"/>
      <circle cx="250" cy="70" r="50" fill="none" stroke="#DF0024" strokeWidth="12"/>
      <circle cx="115" cy="130" r="50" fill="none" stroke="#F4C300" strokeWidth="12"/>
      <circle cx="205" cy="130" r="50" fill="none" stroke="#009F3D" strokeWidth="12"/>
    </svg>
  );
}

export default OlympicRings;
