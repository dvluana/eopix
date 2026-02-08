/**
 * ColorSwatch — Color token display card
 * Usado para showcase de paleta de cores
 */

interface ColorSwatchProps {
  name: string;
  hex: string;
  token: string;
  bg?: string;
  border?: boolean;
}

export function ColorSwatch({ name, hex, token, bg, border }: ColorSwatchProps) {
  return (
    <div className="card">
      <div 
        className={`h-64 rounded-top-sm mb-3 ${border ? 'border-gray-200' : ''}`}
        style={{ background: bg || hex }}
      />
      <div className="micro font-bold mb-1">{name}</div>
      <div className="micro text-muted">{hex}</div>
      <div className="micro text-muted mt-1 break-all">{token}</div>
    </div>
  );
}
