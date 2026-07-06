import { MapPin } from "lucide-react";

const HQ_PIN_PERCENT = { x: 72, y: 29 };

export default function NeighborhoodMap() {
  return (
    <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border border-border-base/40 shadow-sm bg-bg-base">
      {" "}
      <img
        src="/maps/headquarters.webp"
        alt="Map of the neighborhood around the headquarters"
        className="brightness-98 w-full h-full object-cover object-[50%_75%] origin-[50%_75%] scale-[1.40]"
      />
      <div
        className="absolute flex flex-col items-center"
        style={{
          left: `${HQ_PIN_PERCENT.x}%`,
          top: `${HQ_PIN_PERCENT.y}%`,
          transform: "translate(-50%, -100%)",
        }}
      >
        <MapPin
          size={28}
          className="text-primary drop-shadow-sm"
          fill="var(--color-bg-surface)"
        />
      </div>
      <div className="absolute bottom-3 left-3 bg-bg-surface/90 backdrop-blur-sm rounded-full px-3 py-1 border border-border-base/20 shadow-sm">
        <span className="text-xs font-medium text-text-main">
          Headquarters – ul. Naukowa 13
        </span>
      </div>
    </div>
  );
}
