interface DividerProps {
  color: string;
  width?: string;
}

export function Divider({ color, width = '60px' }: DividerProps) {
  return (
    <div
      style={{
        width,
        height: 3,
        backgroundColor: color,
        margin: '20px 0',
        borderRadius: 2,
      }}
    />
  );
}
