export default function XIcon({ size = 20 }: { size?: number }) {
  return (
    <svg viewBox="0 0 20 20" width={size} height={size}>
      <circle cx="10" cy="10" r="8" fill="#FFF0F0" stroke="#CC3333" strokeWidth="1.5"/>
      <line x1="6" y1="6" x2="14" y2="14" stroke="#CC3333" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="14" y1="6" x2="6" y2="14" stroke="#CC3333" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}
