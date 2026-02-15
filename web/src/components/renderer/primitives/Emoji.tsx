interface EmojiProps {
  emoji: string;
  size?: number;
}

export function Emoji({ emoji, size = 48 }: EmojiProps) {
  return (
    <span
      style={{
        fontSize: size,
        lineHeight: 1,
        display: 'inline-block',
        marginBottom: 16,
      }}
    >
      {emoji}
    </span>
  );
}
