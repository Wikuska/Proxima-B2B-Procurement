import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ProductListOut } from "../../api/catalog";
import ProductCard from "./ProductCard";

interface ProductRailProps {
  title: string;
  products: ProductListOut[];
}

const SCROLL_STEP = 640;

export default function ProductRail({ title, products }: ProductRailProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  if (products.length === 0) return null;

  const scrollBy = (delta: number) => {
    scrollerRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  };

  return (
    <section className="border-t border-border-base/10 pt-8 mt-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-text-primary">{title}</h2>
        <div className="hidden sm:flex gap-2">
          <button
            type="button"
            onClick={() => scrollBy(-SCROLL_STEP)}
            aria-label="Scroll left"
            className="w-9 h-9 flex items-center justify-center rounded-full border border-border-base/30 text-text-muted hover:text-accent hover:border-accent transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(SCROLL_STEP)}
            aria-label="Scroll right"
            className="w-9 h-9 flex items-center justify-center rounded-full border border-border-base/30 text-text-muted hover:text-accent hover:border-accent transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden [&>*>*]:!shadow-sm [&>*>*]:hover:!shadow-md"
      >
        {products.map((product) => (
          <div
            key={product.id}
            className="w-[42%] sm:w-[28%] md:w-[190px] shrink-0 snap-start"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
