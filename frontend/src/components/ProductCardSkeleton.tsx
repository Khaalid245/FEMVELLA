export default function ProductCardSkeleton() {
  return (
    <div className="flex flex-col animate-pulse">
      {/* Image */}
      <div className="aspect-[3/4] rounded-none" style={{ background: "#EDE8E3" }} />
      {/* Category */}
      <div className="mt-3 h-2.5 w-16 rounded" style={{ background: "#E5DDD8" }} />
      {/* Name */}
      <div className="mt-2 h-4 w-3/4 rounded" style={{ background: "#EDE8E3" }} />
      {/* Price */}
      <div className="mt-2 h-3.5 w-1/3 rounded" style={{ background: "#E5DDD8" }} />
    </div>
  );
}
