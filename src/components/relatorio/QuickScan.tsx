"use client";

interface QuickScanItem {
  label: string;
  detail: string;
  status: "ok" | "warning";
}

interface QuickScanProps {
  items: QuickScanItem[];
}

const DOT_LEADERS = "\u00B7".repeat(100);

export default function QuickScan({ items }: QuickScanProps) {
  return (
    <div className="rel__scan">
      {items.map((item, i) => (
        <div key={i}>
          <div
            className={`rel__scan-row ${
              item.status === "ok" ? "rel__scan-row--ok" : "rel__scan-row--warning"
            }`}
          >
            <span className="rel__scan-label">{item.label}</span>
            <span className="rel__scan-dots" aria-hidden="true">
              {DOT_LEADERS}
            </span>
            <span className="rel__scan-status">
              {item.status === "ok" ? "OK" : "ATENCAO"}
            </span>
          </div>
          {item.status === "warning" && item.detail && (
            <div className="rel__scan-detail">{item.detail}</div>
          )}
        </div>
      ))}
    </div>
  );
}
