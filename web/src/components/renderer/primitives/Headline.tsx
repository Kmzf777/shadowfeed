interface HeadlineProps {
  text: string;
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  color: string;
  align: 'left' | 'center' | 'right';
  accentColor?: string;
  isHook?: boolean;
}

export function Headline({ text, fontFamily, fontSize, fontWeight, color, align, accentColor, isHook = false }: HeadlineProps) {
  // Force Inter Bold + uppercase for all headlines
  const resolvedFont = 'Inter';
  const resolvedWeight = 700;

  const baseStyle: React.CSSProperties = {
    fontFamily: `"${resolvedFont}", sans-serif`,
    fontSize,
    fontWeight: resolvedWeight,
    color,
    textAlign: align,
    lineHeight: 1.15,
    margin: 0,
    wordWrap: 'break-word',
    textTransform: 'uppercase' as const,
  };

  // Parse **bold** into accent-colored OR black spans if text contains markdown bold
  if (text.includes('**')) {
    const htmlContent = text.replace(
      /\*\*(.*?)\*\*/g,
      (match, content) => {
        if (isHook) {
          // Hook slide: Keep original accent color behavior
          return `<span style="color: ${accentColor || color}; font-weight: 900;">${content}</span>`;
        } else {
          // Other slides: Black, Uppercase, Heavy
          return `<span style="color: #000000; font-weight: 900; text-transform: uppercase;">${content}</span>`;
        }
      }
    );

    return (
      <h1
        style={baseStyle}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    );
  }

  return (
    <h1 style={baseStyle}>
      {text}
    </h1>
  );
}
