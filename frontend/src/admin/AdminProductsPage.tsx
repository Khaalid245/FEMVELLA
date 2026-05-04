import { useState, useRef, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAdminProducts, useCreateProduct, useCategories } from "@/api/admin";

// ─────────────────────────────────────────────
// Add Product Modal
// ─────────────────────────────────────────────
function AddProductModal({ onClose }: { onClose: () => void }) {
  const { data: categoriesData } = useCategories();
  const categories = Array.isArray(categoriesData) ? categoriesData : (categoriesData?.results ?? []);
  const { mutate: createProduct, isPending } = useCreateProduct();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "", slug: "", description: "", price: "",
    sale_price: "", stock: "0", category_id: "",
    is_active: true, is_featured: false, is_new: false, is_bestseller: false,
    is_customizable: false,
  });

  const [variants, setVariants] = useState<Array<{
    size: string;
    color: string;
    stock: number;
    price_override: string;
  }>>([]);

  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const addVariant = () => {
    setVariants([...variants, { size: "", color: "", stock: 0, price_override: "" }]);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: string, value: string | number) => {
    setVariants(variants.map((v, i) => 
      i === index ? { ...v, [field]: value } : v
    ));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const fd = new FormData();

    // Text fields
    fd.append("name", form.name);
    fd.append("slug", form.slug);
    fd.append("description", form.description);
    fd.append("price", form.price);
    fd.append("stock", form.stock);
    fd.append("category_id", form.category_id);
    if (form.sale_price) fd.append("sale_price", form.sale_price);

    // Booleans must be strings for multipart/form-data
    fd.append("is_active",     form.is_active     ? "true" : "false");
    fd.append("is_featured",   form.is_featured   ? "true" : "false");
    fd.append("is_new",        form.is_new        ? "true" : "false");
    fd.append("is_bestseller", form.is_bestseller ? "true" : "false");
    fd.append("is_customizable", form.is_customizable ? "true" : "false");
    
    // Add variants data
    fd.append("variants", JSON.stringify(variants));

    // Image file
    const file = fileRef.current?.files?.[0];
    if (file) fd.append("upload_image", file);

    createProduct(fd, { onSuccess: onClose });
  };

  const inputStyle = {
    width: "100%", fontFamily: "'Inter', sans-serif", fontSize: "13px",
    color: "#2C2420", border: "1px solid #DDD5CE", padding: "8px 12px",
    outline: "none", borderRadius: "3px", background: "#fff",
  };

  const labelStyle = {
    fontFamily: "'Inter', sans-serif", fontSize: "10px",
    letterSpacing: "0.12em", textTransform: "uppercase" as const,
    color: "#9E8E88", display: "block", marginBottom: "5px",
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div style={{ position: "absolute", inset: 0, background: "rgba(44,36,32,0.45)" }} />

      {/* Modal */}
      <div
        style={{ position: "relative", background: "#fff", borderRadius: "8px", width: "100%", maxWidth: "560px", maxHeight: "90vh", overflowY: "auto", padding: "32px", margin: "16px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "24px", fontWeight: 400, color: "#2C2420" }}>
            Add Product
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px", color: "#9E8E88", lineHeight: 1 }}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label style={labelStyle}>Product Name *</label>
            <input
              required value={form.name}
              onChange={(e) => {
                set("name", e.target.value);
                set("slug", e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""));
              }}
              style={inputStyle} placeholder="e.g. Silk Abaya"
            />
          </div>

          {/* Slug */}
          <div>
            <label style={labelStyle}>Slug *</label>
            <input required value={form.slug} onChange={(e) => set("slug", e.target.value)} style={inputStyle} placeholder="silk-abaya" />
          </div>

          {/* Category */}
          <div>
            <label style={labelStyle}>Category *</label>
            <select required value={form.category_id} onChange={(e) => set("category_id", e.target.value)} style={inputStyle}>
              <option value="">Select category</option>
              {categories.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Price row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>Price *</label>
              <input required type="number" step="0.01" min="0" value={form.price} onChange={(e) => set("price", e.target.value)} style={inputStyle} placeholder="0.00" />
            </div>
            <div>
              <label style={labelStyle}>Sale Price</label>
              <input type="number" step="0.01" min="0" value={form.sale_price} onChange={(e) => set("sale_price", e.target.value)} style={inputStyle} placeholder="0.00" />
            </div>
          </div>

          {/* Stock */}
          <div>
            <label style={labelStyle}>Stock *</label>
            <input required type="number" min="0" value={form.stock} onChange={(e) => set("stock", e.target.value)} style={inputStyle} />
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Description</label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} style={{ ...inputStyle, resize: "vertical" }} placeholder="Product description..." />
          </div>

          {/* Image */}
          <div>
            <label style={labelStyle}>Product Image</label>
            <input
              ref={fileRef} type="file" accept="image/*"
              style={{ ...inputStyle, padding: "6px 12px" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setPreview(URL.createObjectURL(file));
                else setPreview(null);
              }}
            />
            {preview && (
              <img
                src={preview} alt="Preview"
                style={{ marginTop: "8px", width: "80px", height: "100px", objectFit: "cover", borderRadius: "3px", border: "1px solid #DDD5CE" }}
              />
            )}
          </div>

          {/* Customizable toggle */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_customizable}
                onChange={(e) => set("is_customizable", e.target.checked)}
                style={{ accentColor: "#2C2420", width: "14px", height: "14px" }}
              />
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#2C2420" }}>Customizable product</span>
            </label>
          </div>

          {/* Variants Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label style={labelStyle}>Product Variants</label>
              <button
                type="button"
                onClick={addVariant}
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "10px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#fff",
                  background: "#C4985A",
                  border: "none",
                  padding: "6px 12px",
                  cursor: "pointer",
                  borderRadius: "3px"
                }}
              >
                + Add Variant
              </button>
            </div>
            
            {variants.length === 0 ? (
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#9E8E88", fontStyle: "italic" }}>
                No variants added. Click "Add Variant" to create size options.
              </p>
            ) : (
              <div className="space-y-3">
                {variants.map((variant, index) => (
                  <div key={index} style={{ border: "1px solid #DDD5CE", padding: "12px", borderRadius: "3px", background: "#FEFEFE" }}>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label style={{ ...labelStyle, fontSize: "9px", marginBottom: "3px" }}>Size *</label>
                        <input
                          required
                          value={variant.size}
                          onChange={(e) => updateVariant(index, "size", e.target.value)}
                          placeholder="XS, S, M, L, XL"
                          style={{ ...inputStyle, fontSize: "12px", padding: "6px 8px" }}
                        />
                      </div>
                      <div>
                        <label style={{ ...labelStyle, fontSize: "9px", marginBottom: "3px" }}>Stock *</label>
                        <input
                          required
                          type="number"
                          min="0"
                          value={variant.stock}
                          onChange={(e) => updateVariant(index, "stock", parseInt(e.target.value) || 0)}
                          style={{ ...inputStyle, fontSize: "12px", padding: "6px 8px" }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label style={{ ...labelStyle, fontSize: "9px", marginBottom: "3px" }}>Color</label>
                        <input
                          value={variant.color}
                          onChange={(e) => updateVariant(index, "color", e.target.value)}
                          placeholder="Optional"
                          style={{ ...inputStyle, fontSize: "12px", padding: "6px 8px" }}
                        />
                      </div>
                      <div>
                        <label style={{ ...labelStyle, fontSize: "9px", marginBottom: "3px" }}>Price Override</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={variant.price_override}
                          onChange={(e) => updateVariant(index, "price_override", e.target.value)}
                          placeholder="Optional"
                          style={{ ...inputStyle, fontSize: "12px", padding: "6px 8px" }}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "9px",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "#E57373",
                        background: "transparent",
                        border: "1px solid #E57373",
                        padding: "4px 8px",
                        cursor: "pointer",
                        borderRadius: "2px"
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Flags */}
          <div className="grid grid-cols-2 gap-2">
            {([
              ["is_active", "Active"],
              ["is_featured", "Featured"],
              ["is_new", "New Arrival"],
              ["is_bestseller", "Bestseller"],
            ] as const).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form[key] as boolean}
                  onChange={(e) => set(key, e.target.checked)}
                  style={{ accentColor: "#2C2420", width: "14px", height: "14px" }}
                />
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#2C2420" }}>{label}</span>
              </label>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isPending}
              style={{ flex: 1, fontFamily: "'Inter', sans-serif", fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#fff", background: isPending ? "#9E8E88" : "#2C2420", border: "none", padding: "12px", cursor: isPending ? "not-allowed" : "pointer", borderRadius: "3px" }}
            >
              {isPending ? "Saving…" : "Create Product"}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#6B5B55", background: "transparent", border: "1px solid #DDD5CE", padding: "12px 20px", cursor: "pointer", borderRadius: "3px" }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function AdminProductsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [showModal, setShowModal] = useState(false);

  const { data, isLoading } = useAdminProducts(page, search);
  const products = data?.results ?? [];
  const totalPages = data ? Math.ceil(data.count / 15) : 1;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div>
      {/* Add Product Modal */}
      {showModal && <AddProductModal onClose={() => setShowModal(false)} />}

      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#C4985A", marginBottom: "6px" }}>Management</p>
          <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "32px", fontWeight: 400, color: "#2C2420" }}>Products</h1>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#fff", background: "#2C2420", border: "none", padding: "10px 20px", cursor: "pointer", borderRadius: "3px" }}
        >
          + Add Product
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <input
          type="text" placeholder="Search products..."
          value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
          style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "#2C2420", border: "1px solid #DDD5CE", padding: "8px 14px", outline: "none", borderRadius: "3px", width: "280px" }}
        />
        <button type="submit" style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#fff", background: "#2C2420", border: "none", padding: "8px 18px", cursor: "pointer", borderRadius: "3px" }}>
          Search
        </button>
        {search && (
          <button type="button" onClick={() => { setSearch(""); setSearchInput(""); setPage(1); }}
            style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "#9E8E88", background: "none", border: "1px solid #DDD5CE", padding: "8px 14px", cursor: "pointer", borderRadius: "3px" }}>
            Clear
          </button>
        )}
      </form>

      {/* Table */}
      <div style={{ background: "#fff", border: "1px solid #EDE8E3", borderRadius: "8px", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #EDE8E3", background: "#FAF7F4" }}>
                {["Image", "Name", "Category", "Price", "Variants", "Stock", "Status", "Actions"].map((h) => (
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
                : products.length === 0
                ? (
                    <tr>
                      <td colSpan={8} style={{ padding: "48px 16px", textAlign: "center", fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "#9E8E88" }}>
                        No products found.
                      </td>
                    </tr>
                  )
                : products.map((product: any) => {
                    const primaryImg = product.images?.find((i: any) => i.is_primary) ?? product.images?.[0];
                    const isLowStock = product.stock > 0 && product.stock <= 5;
                    return (
                      <tr key={product.id} style={{ borderBottom: "1px solid #F5F0EB" }}>
                        <td style={{ padding: "10px 16px" }}>
                          <div style={{ width: "40px", height: "52px", background: "#F5F0EB", borderRadius: "3px", overflow: "hidden" }}>
                            {primaryImg && <img src={primaryImg.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                          </div>
                        </td>
                        <td style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#2C2420", padding: "10px 16px", fontWeight: 500, maxWidth: "200px" }}>
                          <Link to={`/products/${product.slug}`} target="_blank" style={{ color: "inherit", textDecoration: "none" }}>
                            {product.name}
                          </Link>
                        </td>
                        <td style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "#9E8E88", padding: "10px 16px" }}>{product.category?.name ?? "—"}</td>
                        <td style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#2C2420", padding: "10px 16px" }}>
                          {product.sale_price
                            ? <span><span style={{ color: "#C4985A" }}>${product.sale_price}</span><span style={{ color: "#9E8E88", textDecoration: "line-through", marginLeft: "6px", fontSize: "11px" }}>${product.price}</span></span>
                            : `$${product.price}`}
                        </td>
                        <td style={{ padding: "10px 16px", maxWidth: "150px" }}>
                          {product.variants && product.variants.length > 0 ? (
                            <div>
                              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", color: "#9E8E88", marginBottom: "4px" }}>
                                {product.variants.length} variant{product.variants.length > 1 ? 's' : ''}
                              </div>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: "3px" }}>
                                {product.variants.slice(0, 4).map((variant: any, idx: number) => (
                                  <span
                                    key={idx}
                                    style={{
                                      fontFamily: "'Inter', sans-serif",
                                      fontSize: "9px",
                                      padding: "2px 6px",
                                      background: "#F5F0EB",
                                      color: "#6B5B55",
                                      borderRadius: "2px",
                                      whiteSpace: "nowrap"
                                    }}
                                  >
                                    {variant.size}{variant.color ? `/${variant.color}` : ''}
                                    <span style={{ color: "#9E8E88", marginLeft: "2px" }}>({variant.stock})</span>
                                  </span>
                                ))}
                                {product.variants.length > 4 && (
                                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "9px", color: "#9E8E88" }}>+{product.variants.length - 4}</span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "#9E8E88", fontStyle: "italic" }}>
                              No variants
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "10px 16px" }}>
                          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: product.stock === 0 ? "#EF4444" : isLowStock ? "#F59E0B" : "#2C2420", fontWeight: isLowStock || product.stock === 0 ? 600 : 400 }}>
                            {product.stock} {isLowStock ? "⚠" : product.stock === 0 ? "✕" : ""}
                          </span>
                        </td>
                        <td style={{ padding: "10px 16px" }}>
                          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", padding: "3px 8px", borderRadius: "3px", background: product.is_active ? "#10B98118" : "#EF444418", color: product.is_active ? "#10B981" : "#EF4444" }}>
                            {product.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td style={{ padding: "10px 16px" }}>
                          <Link
                            to={`/admin/products/${product.id}/edit`}
                            style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#C4985A", textDecoration: "none" }}
                          >
                            Edit
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)}
              style={{ width: "34px", height: "34px", fontFamily: "'Inter', sans-serif", fontSize: "12px", border: "1px solid", borderColor: page === p ? "#2C2420" : "#DDD5CE", background: page === p ? "#2C2420" : "transparent", color: page === p ? "#fff" : "#2C2420", cursor: "pointer", borderRadius: "3px" }}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
