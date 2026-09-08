import type { BrandKit } from "../core/brand-kit";
import "./brand-badge.css";

export function BrandBadge({ kit }: { kit: BrandKit }) {
  return (
    <span
      className="brand-kit-badge"
      style={{ background: kit.colors.background, color: kit.colors.text }}
    >
      {kit.logo ? (
        <img src={kit.logo} alt="" />
      ) : (
        <span>{kit.name.trim().slice(0, 1).toUpperCase()}</span>
      )}
    </span>
  );
}
