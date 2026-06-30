import { ImageOff } from "lucide-react";

interface ProductImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  compact?: boolean;
}

export default function ProductImage({
  src,
  alt,
  className = "",
  compact = false,
}: ProductImageProps) {
  return (
    <div
      className={`relative aspect-square flex items-center justify-center overflow-hidden rounded-lg transition-colors ${
        src
          ? "bg-bg-surface border border-border-base/20"
          : "bg-bg-base border border-dashed border-border-base/40"
      } ${className}`}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          // Dynamiczny padding: mały odstęp dla koszyka, duży dla katalogu
          className={`w-full h-full object-contain mix-blend-multiply ${
            compact ? "p-1" : "p-3"
          }`}
        />
      ) : (
        <div className="flex flex-col items-center justify-center gap-1 text-text-muted">
          {!compact && <ImageOff size={24} strokeWidth={1.5} />}
          <span
            className={`${
              compact ? "text-[10px]" : "text-xs"
            } font-medium leading-tight text-center px-1`}
          >
            No image
          </span>
        </div>
      )}
    </div>
  );
}
