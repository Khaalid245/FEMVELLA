import { useState, useEffect, useRef, useCallback, memo } from "react";
import {
  useAdminOrders,
  useUpdateOrderStatus,
  useBulkUpdateStatus,
  useOrderHistory,
  type AdminOrder,
  type OrderFilters,
  type OrderHistoryEntry,
} from "@/api/admin";
import { useToastStore } from "@/store/toastStore";

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const PAGE_SIZE = 15;
const ALL_STATUSES = ["pending", "paid", "confirmed", "shipped", "delivered", "cancelled", "failed"];
const STATUS_COLORS: Record<string, string> = {
  pending: "#F59E0B", paid: "#10B981", confirmed: "#3B82F6",
  shipped: "#8B5CF6", delivered: "#059669", cancelled: "#EF4444", failed: "#DC2626",
};

// ─────────────────────────────────────────────
// Shared components
// ─────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  return (
    <span style={{
      fontFamily: "'Inter', sans-serif", fontSize: "10px", letterSpacing: "0.1em",
      textTransform: "uppercase", padding: "3px 8px", borderRadius: "3px",
      background: `${STATUS_COLORS[status] ?? "#9E8E88"}18`,
      color: STATUS_COLORS[status] ?? "#9E8E88", fontWeight: 500, whiteSpace: "nowrap",
    }}>
      {status}
    </span>
  );
}

// ─────────────────────────────────────────────
// Audit log timeline
// ─────────────────────────────────────────────
function AuditTimeline({ orderId }: { orderId: number }) {
  const { data, isLoading } = useOrderHistory(orderId);

  if (isLoading) return (
    <div className="animate-pulse space-y-2 py-2">
      {[0, 1, 2].map((i) => <div key={i} style={{ height: "14px", background: "#EDE8E3", borderRadius: "4px", width: "80%" }} />)}
    </div>
  );

  if (!data?.length) return (
    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#9E8E88" }}>No history yet.</p>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {data.map((entry: OrderHistoryEntry) => (
        <div key={entry.id} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: STATUS_COLORS[entry.new_status] ?? "#9E8E88", marginTop: "5px", flexShrink: 0 }} />
          <div>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#2C2420" }}>
              <StatusBadge status={entry.old_status} />
              <span style={{ margin: "0 6px", color: "#9E8E88" }}>→</span>
              <StatusBadge status={entry.new_status} />
            </p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", color: "#9E8E88", marginTop: "3px" }}>
              {entry.changed_by_email ?? "System"} · {new Date(entry.timestamp).toLocaleString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// Order row (memoized)
// ─────────────────────────────────────────────
const OrderRow = memo(function OrderRow({
  order,
  isSelected,
  isExpanded,
  isHistoryOpen,
  isUpdating,
  onSelect,
  onExpand,
  onHistoryToggle,
  onStatusChange,
}: {
  order: AdminOrder;
  isSelected: boolean;
  isExpanded: boolean;
  isHistoryOpen: boolean;
  isUpdating: boolean;
  onSelect: (id: number) => void;
  onExpand: (id: number) => void;
  onHistoryToggle: (id: number) => void;
  onStatusChange: (id: number, status: string) => void;
}) {
  return (
    <>
      <tr
        style={{ borderBottom: isExpanded ? "none" : "1px solid #F5F0EB", background: isSelected ? "#FBF8F5" : "#fff" }}
      >
        {/* Checkbox */}
        <td style={{ padding: "12px 8px 12px 16px" }} onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(order.id)}
            style={{ accentColor: "#2C2420", width: "14px", height: "14px", cursor: "pointer" }}
          />
        </td>

        {/* Order ID — click to expand */}
        <td
          style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#2C2420", padding: "12px 16px", fontWeight: 500, cursor: "pointer" }}
          onClick={() => onExpand(order.id)}
        >
          #{order.id}
        </td>

        <td style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#6B5B55", padding: "12px 16px", maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {order.user_email}
        </td>

        <td style={{ padding: "12px 16px" }}>
          <StatusBadge status={order.status} />
        </td>

        <td style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#2C2420", padding: "12px 16px", whiteSpace: "nowrap" }}>
          ${order.total_price}
        </td>

        <td style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "#9E8E88", padding: "12px 16px", whiteSpace: "nowrap" }}>
          {new Date(order.created_at).toLocaleDateString()}
        </td>

        {/* Status select */}
        <td style={{ padding: "12px 16px" }} onClick={(e) => e.stopPropagation()}>
          <select
            value={order.status}
            onChange={(e) => onStatusChange(order.id, e.target.value)}
            disabled={isUpdating}
            style={{
              fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "#2C2420",
              border: "1px solid #DDD5CE", background: "transparent", padding: "5px 8px",
              cursor: isUpdating ? "not-allowed" : "pointer", outline: "none", borderRadius: "3px",
              opacity: isUpdating ? 0.5 : 1,
            }}
          >
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </td>

        {/* History toggle */}
        <td style={{ padding: "12px 16px" }} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onHistoryToggle(order.id)}
            style={{
              fontFamily: "'Inter', sans-serif", fontSize: "10px", letterSpacing: "0.1em",
              textTransform: "uppercase", color: isHistoryOpen ? "#2C2420" : "#C4985A",
              background: "none", border: "none", cursor: "pointer", padding: 0,
            }}
          >
            {isHistoryOpen ? "Close" : "History"}
          </button>
        </td>
      </tr>

      {/* Expanded: items + address */}
      {isExpanded && (
        <tr style={{ borderBottom: isHistoryOpen ? "none" : "1px solid #F5F0EB" }}>
          <td colSpan={8} style={{ padding: "0 16px 14px 52px", background: "#FAF7F4" }}>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#9E8E88", marginBottom: "8px", paddingTop: "12px" }}>Items</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {order.items.map((item) => (
                <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#6B5B55", maxWidth: "400px" }}>
                  <span>{item.product_name} × {item.quantity}</span>
                  <span>${item.unit_price}</span>
                </div>
              ))}
            </div>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "#9E8E88", marginTop: "8px" }}>
              Ship to: {order.shipping_address}
            </p>
          </td>
        </tr>
      )}

      {/* Audit timeline */}
      {isHistoryOpen && (
        <tr style={{ borderBottom: "1px solid #F5F0EB" }}>
          <td colSpan={8} style={{ padding: "0 16px 16px 52px", background: "#FAF7F4" }}>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#9E8E88", marginBottom: "10px", paddingTop: "12px" }}>Status History</p>
            <AuditTimeline orderId={order.id} />
          </td>
        </tr>
      )}
    </>
  );
});

// ─────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────
export default function AdminOrdersPage() {
  const toast = useToastStore((s) => s.add);

  // Filters state
  const [page, setPage]           = useState(1);
  const [statusFilter, setStatus] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch]       = useState("");
  const [dateFrom, setDateFrom]   = useState("");
  const [dateTo, setDateTo]       = useState("");

  // UI state
  const [expandedId, setExpandedId]   = useState<number | null>(null);
  const [historyId, setHistoryId]     = useState<number | null>(null);
  const [selected, setSelected]       = useState<Set<number>>(new Set());
  const [bulkStatus, setBulkStatus]   = useState("shipped");
  const [confirmBulk, setConfirmBulk] = useState(false);

  // Debounce search
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setSearch(searchInput); setPage(1); }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchInput]);

  const filters: OrderFilters = { page, status: statusFilter, search, date_from: dateFrom, date_to: dateTo };

  const { data, isLoading, isError, refetch } = useAdminOrders(filters);
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateOrderStatus(filters);
  const { mutate: bulkUpdate, isPending: isBulking } = useBulkUpdateStatus();

  const orders = data?.results ?? [];
  const totalCount = data?.count ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const startItem = (page - 1) * PAGE_SIZE + 1;
  const endItem   = Math.min(page * PAGE_SIZE, totalCount);

  // Selection helpers
  const allSelected = orders.length > 0 && orders.every((o) => selected.has(o.id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(orders.map((o) => o.id)));
  const toggleOne = useCallback((id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const handleBulkConfirm = () => {
    bulkUpdate(
      { order_ids: Array.from(selected), status: bulkStatus },
      { onSuccess: () => { setSelected(new Set()); setConfirmBulk(false); } }
    );
  };

  const handleStatusChange = useCallback((id: number, status: string) => {
    updateStatus({ id, status });
  }, [updateStatus]);

  const handleExpand = useCallback((id: number) => {
    setExpandedId((prev) => prev === id ? null : id);
  }, []);

  const handleHistoryToggle = useCallback((id: number) => {
    setHistoryId((prev) => prev === id ? null : id);
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#C4985A", marginBottom: "6px" }}>Management</p>
        <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "32px", fontWeight: 400, color: "#2C2420" }}>Orders</h1>
      </div>

      {/* Error banner */}
      {isError && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "6px", padding: "12px 16px", marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "#DC2626" }}>Failed to load orders.</span>
          <button onClick={() => refetch()} style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "#DC2626", background: "none", border: "1px solid #FECACA", padding: "4px 12px", cursor: "pointer", borderRadius: "3px" }}>Retry</button>
        </div>
      )}

      {/* Filters row */}
      <div className="flex flex-wrap gap-3 mb-4">
        {/* Search */}
        <input
          type="text"
          placeholder="Search by order ID or email…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#2C2420", border: "1px solid #DDD5CE", padding: "7px 12px", outline: "none", borderRadius: "3px", width: "240px" }}
        />

        {/* Date from */}
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
          style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#2C2420", border: "1px solid #DDD5CE", padding: "7px 10px", outline: "none", borderRadius: "3px" }}
        />

        {/* Date to */}
        <input
          type="date"
          value={dateTo}
          onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
          style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#2C2420", border: "1px solid #DDD5CE", padding: "7px 10px", outline: "none", borderRadius: "3px" }}
        />

        {(search || dateFrom || dateTo) && (
          <button
            onClick={() => { setSearchInput(""); setSearch(""); setDateFrom(""); setDateTo(""); setPage(1); }}
            style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "#9E8E88", background: "none", border: "1px solid #DDD5CE", padding: "7px 12px", cursor: "pointer", borderRadius: "3px" }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Status chips */}
      <div className="flex flex-wrap gap-2 mb-5">
        {["", ...ALL_STATUSES].map((s) => (
          <button
            key={s || "all"}
            onClick={() => { setStatus(s); setPage(1); }}
            style={{
              fontFamily: "'Inter', sans-serif", fontSize: "10px", letterSpacing: "0.1em",
              textTransform: "uppercase", padding: "5px 12px", border: "1px solid",
              borderColor: statusFilter === s ? "#2C2420" : "#DDD5CE",
              background: statusFilter === s ? "#2C2420" : "transparent",
              color: statusFilter === s ? "#fff" : "#6B5B55",
              cursor: "pointer", borderRadius: "3px", transition: "all 0.15s",
            }}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div style={{ background: "#2C2420", borderRadius: "6px", padding: "10px 16px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#E8D5B4" }}>
            {selected.size} selected
          </span>
          <select
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value)}
            style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "#2C2420", background: "#E8D5B4", border: "none", padding: "5px 10px", borderRadius: "3px", cursor: "pointer" }}
          >
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          {!confirmBulk ? (
            <button
              onClick={() => setConfirmBulk(true)}
              style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#2C2420", background: "#C4985A", border: "none", padding: "6px 14px", cursor: "pointer", borderRadius: "3px" }}
            >
              Apply
            </button>
          ) : (
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#E8D5B4" }}>Confirm?</span>
              <button onClick={handleBulkConfirm} disabled={isBulking} style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "#2C2420", background: "#10B981", border: "none", padding: "5px 12px", cursor: "pointer", borderRadius: "3px" }}>Yes</button>
              <button onClick={() => setConfirmBulk(false)} style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "#E8D5B4", background: "none", border: "1px solid rgba(232,213,180,0.3)", padding: "5px 12px", cursor: "pointer", borderRadius: "3px" }}>Cancel</button>
            </div>
          )}
          <button onClick={() => setSelected(new Set())} style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "rgba(232,213,180,0.5)", background: "none", border: "none", cursor: "pointer", marginLeft: "auto" }}>Clear selection</button>
        </div>
      )}

      {/* Table */}
      <div style={{ background: "#fff", border: "1px solid #EDE8E3", borderRadius: "8px", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #EDE8E3", background: "#FAF7F4" }}>
                <th style={{ padding: "12px 8px 12px 16px" }}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    style={{ accentColor: "#2C2420", width: "14px", height: "14px", cursor: "pointer" }}
                  />
                </th>
                {["Order", "Customer", "Status", "Total", "Date", "Update", ""].map((h) => (
                  <th key={h} style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#9E8E88", textAlign: "left", padding: "12px 16px", fontWeight: 500, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #F5F0EB" }}>
                      {Array.from({ length: 8 }).map((__, j) => (
                        <td key={j} style={{ padding: "14px 16px" }}>
                          <div className="animate-pulse" style={{ height: "13px", background: "#EDE8E3", borderRadius: "4px", width: "75%" }} />
                        </td>
                      ))}
                    </tr>
                  ))
                : orders.length === 0
                ? (
                    <tr>
                      <td colSpan={8} style={{ padding: "48px 16px", textAlign: "center", fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "#9E8E88" }}>
                        No orders found. Try adjusting your filters.
                      </td>
                    </tr>
                  )
                : orders.map((order) => (
                    <OrderRow
                      key={order.id}
                      order={order}
                      isSelected={selected.has(order.id)}
                      isExpanded={expandedId === order.id}
                      isHistoryOpen={historyId === order.id}
                      isUpdating={isUpdating}
                      onSelect={toggleOne}
                      onExpand={handleExpand}
                      onHistoryToggle={handleHistoryToggle}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalCount > 0 && (
        <div className="flex items-center justify-between mt-5">
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#9E8E88" }}>
            {isLoading ? "Loading…" : `Showing ${startItem}–${endItem} of ${totalCount} orders`}
          </span>

          <div className="flex gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{ width: "32px", height: "32px", fontFamily: "'Inter', sans-serif", fontSize: "13px", border: "1px solid #DDD5CE", background: "transparent", color: page === 1 ? "#C8BDB8" : "#2C2420", cursor: page === 1 ? "not-allowed" : "pointer", borderRadius: "3px" }}
            >
              ←
            </button>

            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const p = totalPages <= 7 ? i + 1
                : page <= 4 ? i + 1
                : page >= totalPages - 3 ? totalPages - 6 + i
                : page - 3 + i;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{ width: "32px", height: "32px", fontFamily: "'Inter', sans-serif", fontSize: "12px", border: "1px solid", borderColor: page === p ? "#2C2420" : "#DDD5CE", background: page === p ? "#2C2420" : "transparent", color: page === p ? "#fff" : "#2C2420", cursor: "pointer", borderRadius: "3px" }}
                >
                  {p}
                </button>
              );
            })}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{ width: "32px", height: "32px", fontFamily: "'Inter', sans-serif", fontSize: "13px", border: "1px solid #DDD5CE", background: "transparent", color: page === totalPages ? "#C8BDB8" : "#2C2420", cursor: page === totalPages ? "not-allowed" : "pointer", borderRadius: "3px" }}
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
