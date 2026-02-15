import type { ReactNode } from 'react';

interface SlideFrameProps {
  bgColor: string;
  bgGradient: string | null;
  children: ReactNode;
  ready?: boolean;
  branding?: { name: string; handle: string } | null;
  accentColor?: string;
  textColor?: string;
  fontBody?: string;
  fontHeadline?: string;
  padding?: number;
  isHook?: boolean;
}

export function SlideFrame({
  bgColor,
  bgGradient,
  children,
  ready = true,
  branding,
  accentColor,
  textColor,
  fontBody,
  fontHeadline,
  padding = 60,
  isHook = false,
}: SlideFrameProps) {
  return (
    <div
      className="design-slide"
      data-slide-ready={ready ? 'true' : 'false'}
      style={{
        width: 1080,
        height: 1350,
        padding: padding,
        overflow: 'hidden',
        position: 'relative',
        background: bgGradient || bgColor,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Fixed Header: Start */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 24,
          pointerEvents: 'none',
          zIndex: 50,
          opacity: 0.6,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
        }}
      >
        {/* Repeated Handle */}
        {Array.from({ length: 12 }).map((_, i) => (
          <span
            key={i}
            style={{
              fontFamily: fontHeadline || '"Inter", sans-serif',
              fontSize: 12,
              fontWeight: 600,
              color: isHook ? '#FFFFFF' : (textColor ? textColor : '#F5F5F0'), // Hook is always White, others use contrast
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
          >
            {branding?.handle || '@shadowfeed.ai'}
          </span>
        ))}
      </div>

      {/* Fixed Header: End */}

      {/* Fixed Footer: Start (Hidden on Hook) */}
      {!isHook && (
        <div
          style={{
            position: 'absolute',
            bottom: 20,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 24,
            pointerEvents: 'none',
            zIndex: 50,
            opacity: 0.6,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
          }}
        >
          {/* Repeated Handle */}
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              style={{
                fontFamily: fontHeadline || '"Inter", sans-serif',
                fontSize: 12,
                fontWeight: 600,
                color: textColor ? textColor : '#F5F5F0',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}
            >
              {branding?.handle || '@shadowfeed.ai'}
            </span>
          ))}
        </div>
      )}
      {/* Fixed Footer: End */}

      {/* Slide Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {children}
      </div>
    </div >
  );
}
