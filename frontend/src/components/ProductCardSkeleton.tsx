export default function ProductCardSkeleton() {
  return (
    <div className="flex flex-col" aria-hidden="true">
      {/* Image — 3:4 aspect, same as card */}
      <div
        className="skeleton-shimmer aspect-[3/4]"
        style={{ borderRadius: "1px" }}
      />

      {/* Category pill */}
      <div
        className="skeleton-shimmer mt-3"
        style={{ height: "9px", width: "56px", borderRadius: "1px" }}
      />

      {/* Product name */}
      <div
        className="skeleton-shimmer mt-2.5"
        style={{ height: "14px", width: "75%", borderRadius: "1px" }}
      />

      {/* Second name line (long titles) */}
      <div
        className="skeleton-shimmer mt-1.5"
        style={{ height: "14px", width: "50%", borderRadius: "1px" }}
      />

      {/* Price */}
      <div
        className="skeleton-shimmer mt-2.5"
        style={{ height: "12px", width: "36px", borderRadius: "1px" }}
      />
    </div>
  );
}