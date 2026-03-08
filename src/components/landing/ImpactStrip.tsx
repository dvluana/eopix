"use client";

import { useEffect, useRef, useState } from "react";

interface CounterConfig {
  target: number;
  decimals: number;
  prefix: string;
  suffix: string;
  separator: string;
  animated: boolean;
}

const COUNTERS: CounterConfig[] = [
  { target: 8.9, decimals: 1, prefix: "", suffix: "M", separator: ",", animated: true },
  { target: 29.9, decimals: 2, prefix: "R$ ", suffix: "", separator: ",", animated: false },
  { target: 3, decimals: 0, prefix: "", suffix: " min", separator: "", animated: true },
];

const TEXTS = [
  "de empresas inadimplentes no Brasil. A sua próxima parceria é uma delas?",
  "custa uma consulta. Um processo custa quanto mesmo?",
  "pra consultar. 3 anos pra se arrepender.",
];

const DURATION = 2000;

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

function formatNumber(value: number, config: CounterConfig): string {
  const fixed = value.toFixed(config.decimals);
  const formatted = config.separator
    ? fixed.replace(".", config.separator)
    : fixed;
  return `${config.prefix}${formatted}${config.suffix}`;
}

export default function ImpactStrip() {
  const stripRef = useRef<HTMLElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [values, setValues] = useState<string[]>(
    COUNTERS.map((c) => c.animated ? formatNumber(0, c).replace(/./g, " ") : formatNumber(c.target, c))
  );

  useEffect(() => {
    const el = stripRef.current;
    if (!el || hasAnimated) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        setHasAnimated(true);

        const start = performance.now();

        function tick(now: number) {
          const elapsed = now - start;
          const progress = Math.min(elapsed / DURATION, 1);
          const eased = easeOutExpo(progress);

          setValues(
            COUNTERS.map((c) =>
              c.animated
                ? formatNumber(eased * c.target, c)
                : formatNumber(c.target, c)
            )
          );

          if (progress < 1) {
            requestAnimationFrame(tick);
          }
        }

        requestAnimationFrame(tick);
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasAnimated]);

  return (
    <aside className="impact" ref={stripRef} aria-label="Dados de impacto">
      <div className="impact__inner">
        {COUNTERS.map((config, i) => (
          <div className="impact__item" key={i}>
            <div
              className={`impact__num${hasAnimated && config.animated ? " impact__num--counting" : ""}`}
              aria-label={formatNumber(config.target, config)}
            >
              {values[i]}
            </div>
            <p className="impact__text">{TEXTS[i]}</p>
          </div>
        ))}
      </div>
    </aside>
  );
}
