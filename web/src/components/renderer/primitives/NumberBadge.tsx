interface NumberBadgeProps {
  label: string;
  accentColor: string;
  fontFamily: string;
}

export function NumberBadge({ label, accentColor, fontFamily }: NumberBadgeProps) {
  return (
    <span
      style={{
        fontFamily: `"${fontFamily}", sans-serif`,
        fontSize: '96px',
        fontWeight: 800,
        color: accentColor,
        lineHeight: 1,
        display: 'block',
        marginBottom: 12,
      }}
    >
      {label}
    </span>
  );
}
