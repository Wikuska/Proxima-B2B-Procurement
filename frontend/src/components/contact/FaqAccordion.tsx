import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { FaqItem } from "../../config/faq";

interface FaqAccordionProps {
  items: FaqItem[];
}

export default function FaqAccordion({ items }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex((current) => (current === index ? null : index));
  };

  return (
    <div className="flex flex-col divide-y divide-border-base/20 border border-border-base/20 rounded-xl bg-bg-surface overflow-hidden">
      {items.map((item, index) => {
        const isOpen = openIndex === index;

        return (
          <div key={item.question}>
            <button
              type="button"
              onClick={() => toggle(index)}
              aria-expanded={isOpen}
              className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
            >
              <span className="text-sm font-medium text-text-main">{item.question}</span>
              <ChevronDown
                size={18}
                className={`text-text-muted shrink-0 transition-transform duration-200 ${
                  isOpen ? "rotate-180 text-accent" : ""
                }`}
              />
            </button>
            {isOpen && (
              <div className="px-5 pb-4">
                <p className="text-sm text-text-muted leading-relaxed">{item.answer}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
