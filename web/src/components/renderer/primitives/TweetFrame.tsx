import type { ReactNode } from 'react';

interface TweetFrameProps {
  bgColor: string;
  children: ReactNode;
  ready?: boolean;
  isHook?: boolean;
  accentColor?: string;
  brandHandle?: string;
}

export function TweetFrame({
  bgColor,
  children,
  ready = true,
  isHook = false,
  brandHandle = '@shadowfeed.ai',
}: TweetFrameProps) {
  return (
    <div
      data-slide-ready={ready ? 'true' : 'false'}
      style={{
        width: 1080,
        height: 1350,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: bgColor,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Main content area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {children}
      </div>

      {/* Footer bar — handle repeated across bottom (hook only) */}
      {isHook && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 44,
            backgroundColor: '#000000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 32,
            zIndex: 20,
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <span
              key={i}
              style={{
                fontFamily: '"Inter", sans-serif',
                fontSize: 13,
                fontWeight: 600,
                color: '#FFFFFF',
                opacity: 0.7,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
              }}
            >
              {brandHandle}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
