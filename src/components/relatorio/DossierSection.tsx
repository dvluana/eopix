"use client";

import { useId, useState, useEffect } from "react";

interface DossierSectionProps {
  num: string;
  title: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}

export default function DossierSection({
  num,
  title,
  defaultExpanded = false,
  children,
}: DossierSectionProps) {
  const id = useId();
  const contentId = `section-content-${id}`;
  const triggerId = `section-trigger-${id}`;

  const [expanded, setExpanded] = useState(defaultExpanded);

  // On mobile (<768px), start collapsed regardless of defaultExpanded
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setExpanded(false);
    }
  }, []);

  return (
    <div className="rel__section" data-expanded={expanded ? "true" : "false"}>
      <button
        id={triggerId}
        className="rel__section-trigger"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        aria-controls={contentId}
        type="button"
      >
        <span className="rel__section-badge">{num}</span>
        <span className="rel__section-title">{title}</span>
        <svg
          className="rel__section-chevron"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      <div
        id={contentId}
        className="rel__section-content"
        role="region"
        aria-labelledby={triggerId}
      >
        {children}
      </div>
    </div>
  );
}
