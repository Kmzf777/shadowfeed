import type { CSSProperties } from 'react';

interface BodyTextProps {
  text: string;
  fontFamily: string;
  fontSize: string;
  color: string;
  align: 'left' | 'center' | 'right';
  isMarkdown?: boolean;
  accentColor?: string;
}

export function BodyText({ text, fontFamily, fontSize, color, align, isMarkdown, accentColor }: BodyTextProps) {
  // Pre-process: replace literal escaped \n (from LLM double-escaping) with real newlines
  const processedText = text.replace(/\\n/g, '\n');

  const style: CSSProperties = {
    fontFamily: fontFamily.includes(' ') ? `"${fontFamily}", sans-serif` : `${fontFamily}, sans-serif`,
    fontSize,
    fontWeight: 400,
    color,
    textAlign: align,
    lineHeight: 1.6,
    margin: 0,
    wordWrap: 'break-word',
    letterSpacing: '0.01em',
  };

  // Always detect **bold** patterns in text
  const hasBold = processedText.includes('**');
  const needsHtml = isMarkdown || hasBold;

  if (needsHtml) {
    const boldColor = accentColor || color;
    // Parse **bold** → strong with accent color, uppercase, heavy weight
    let htmlContent = processedText
      .replace(
        /\*\*(.*?)\*\*/g,
        `<strong style="color: ${boldColor}; font-weight: 800; text-transform: uppercase; letter-spacing: 0.02em;">$1</strong>`
      );

    // Additional markdown parsing (line breaks, italic, lists)
    if (isMarkdown) {
      htmlContent = htmlContent
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/^- (.*)$/gm, '<li>$1</li>');
    }

    // Always parse \n as <br>
    htmlContent = htmlContent.replace(/\n/g, '<br />');

    return (
      <div
        style={{ ...style, whiteSpace: 'normal' }}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    );
  }

  return (
    <p style={{ ...style, whiteSpace: 'pre-wrap' }}>
      {processedText}
    </p>
  );
}
