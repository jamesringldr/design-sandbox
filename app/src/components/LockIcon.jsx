export default function LockIcon({ locked }) {
  if (locked) {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
          d="M5 7.5V5.5a3 3 0 1 1 6 0v2"
          stroke="currentColor"
          strokeWidth="1.4"
        />
        <rect x="3.25" y="7.25" width="9.5" height="6.5" rx="1.4" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M5 7.5V5.2a3 3 0 0 1 5.7-1.3"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <rect x="3.25" y="7.25" width="9.5" height="6.5" rx="1.4" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
