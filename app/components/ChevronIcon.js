export default function ChevronIcon({ direction = 'right', size = 14 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ transform: direction === 'left' ? 'rotate(180deg)' : 'none', flexShrink: 0 }}
    >
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
