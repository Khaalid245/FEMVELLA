import React from "react";

/**
 * Returns a React node with the matched portion of `text` wrapped in a
 * <mark> element styled with the Femvelle gold colour.
 */
export function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query || query.length < 2) return text;

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);

  if (parts.length === 1) return text;

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            style={{
              background: "transparent",
              color: "#C4985A",
              fontWeight: 600,
            }}
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}
