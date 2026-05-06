import { useState, useRef, useEffect, type FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/client";
import { useCategories } from "@/api/admin";
import { useToastStore } from "@/store/toastStore";
import AdminImageManager from "@/components/AdminImageManager";

export default function AdminEditProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useToastStore((s) => s.add);
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const { data: categoriesData } = useCategories();
  const categories = Array.isArray(categoriesData)
    ? categoriesData
    : (categoriesData?.results ?? []);

  // Fetch product by slug (not id)
  const { data: product, isLoading } = useQuery({
    queryKey: ["admin-product", id],
    queryFn: () => api.get(`/products/${id}/`).then((r) => r.data),
    enabled: !!id,
  });

  const [form, setForm] = useState({
    name: "", slug: "", description: "", price: "",
    sale_price: "", stock: "", category_id: "",
    is_active: true, is_featured: false, is_new: false, is_bestseller: false,
    is_customizable: false,
  });

  const [variants, setVariants] = useState<Array<{
    id?: number;
    size: string;
    color: string;
    stock: number;
    price_override: string;
  }>>([]);

  const [images, setImages] = useState<Array<{
    id?: number;
    image: string | File;
    alt_text: string;
    sort_order: number;
    is_primary?: boolean;
  }>>([]);

  // Populate form once product loads
  useEffect(() => {
    if (product) {
      setForm({
        name:          product.name ?? "",
        slug:          product.slug ?? "",
        description:   product.description ?? "",
        price:         product.price ?? "",
        sale_price:    product.sale_price ?? "",
        stock:         String(product.stock ?? 0),
        category_id:   String(product.category?.id ?? ""),
        is_active:     product.is_active ?? true,
        is_featured:   product.is_featured ?? false,
        is_new:        product.is_new ?? false,
        is_bestseller: product.is_bestseller ?? false,
        is_customizable: product.is_customizable ?? false,
      });
      setVariants(product.variants?.map((v: any) => ({
        id: v.id,
        size: v.size,
        color: v.color || "",
        stock: v.stock,
        price_override: v.price_override || "",
      })) || []);
      
      setImages(product.images?.map((img: any, index: number) => ({
        id: img.id,
        image: img.image,
        alt_text: img.alt_text || "",
        sort_order: img.sort_order || index,
        is_primary: img.is_primary || false,
      })) || []);
    }
  }, [product]);

  const { mutate: updateProduct, isPending } = useMutation({
    mutationFn: (fd: FormData) =>
      api.patch(`/products/${id}/`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      }).then((r) => r.data),
    onSuccess: () => {
      toast("Product updated successfully.");
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      navigate("/admin/products");
    },
    onError: () => toast("Failed to update product.", "error"),
  });

  const set = (k: string, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

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
    fd.append("name",        form.name);
    fd.append("slug",        form.slug);
    fd.append("description", form.description);
    fd.append("price",       form.price);
    fd.append("stock",       form.stock);
    fd.append("category_id", form.category_id);
    if (form.sale_price) fd.append("sale_price", form.sale_price);
    fd.append("is_active",     form.is_active     ? "true" : "false");
    fd.append("is_featured",   form.is_featured   ? "true" : "false");
    fd.append("is_new",        form.is_new        ? "true" : "false");
    fd.append("is_bestseller", form.is_bestseller ? "true" : "false");
    fd.append("is_customizable", form.is_customizable ? "true" : "false");
    
    // Add variants data
    fd.append("variants_data", JSON.stringify(variants));
    
    // Add images data
    const imageFiles: File[] = [];
    const imageData = images.map((img, index) => {
      if (img.image instanceof File) {
        imageFiles.push(img.image);
        return {
          id: img.id,
          alt_text: img.alt_text,
          sort_order: index,
          is_primary: img.is_primary || index === 0,
          file_index: imageFiles.length - 1
        };
      } else {
        return {
          id: img.id,
          image: img.image,
          alt_text: img.alt_text,
          sort_order: index,
          is_primary: img.is_primary || index === 0
        };
      }
    });
    
    fd.append("images_data", JSON.stringify(imageData));
    imageFiles.forEach((file, index) => {
      fd.append(`image_${index}`, file);
    });
    
    const file = fileRef.current?.files?.[0];
    if (file) fd.append("upload_image", file);
    updateProduct(fd);
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

  const primaryImage = product?.images?.find((i: any) => i.is_primary) ?? product?.images?.[0];

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4 max-w-2xl">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ height: "44px", background: "#EDE8E3", borderRadius: "3px" }} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "640px" }}>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate("/admin/products")}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#9E8E88", fontSize: "20px", lineHeight: 1 }}
        >
          ←
        </button>
        <div>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#C4985A", marginBottom: "4px" }}>
            Management
          </p>
          <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "28px", fontWeight: 400, color: "#2C2420" }}>
            Edit Product
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Image Management */}
        <div>
          <AdminImageManager
            images={images}
            onImagesChange={setImages}
            maxImages={10}
          />
        </div>

        {/* Name */}
        <div>
          <label style={labelStyle}>Product Name *</label>
          <input required value={form.name} onChange={(e) => set("name", e.target.value)} style={inputStyle} />
        </div>

        {/* Slug */}
        <div>
          <label style={labelStyle}>Slug *</label>
          <input required value={form.slug} onChange={(e) => set("slug", e.target.value)} style={inputStyle} />
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

        {/* Price */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label style={labelStyle}>Price *</label>
            <input required type="number" step="0.01" min="0" value={form.price} onChange={(e) => set("price", e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Sale Price</label>
            <input type="number" step="0.01" min="0" value={form.sale_price} onChange={(e) => set("sale_price", e.target.value)} style={inputStyle} placeholder="Leave empty for no sale" />
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
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={4} style={{ ...inputStyle, resize: "vertical" }} />
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
                  <div className="grid grid-cols-4 gap-3 mb-3">
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
                      <label style={{ ...labelStyle, fontSize: "9px", marginBottom: "3px" }}>Color</label>
                      <input
                        value={variant.color}
                        onChange={(e) => updateVariant(index, "color", e.target.value)}
                        placeholder="Optional"
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
        <div className="grid grid-cols-2 gap-3">
          {([
            ["is_active",     "Active"],
            ["is_featured",   "Featured"],
            ["is_new",        "New Arrival"],
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
            type="submit" disabled={isPending}
            style={{ flex: 1, fontFamily: "'Inter', sans-serif", fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#fff", background: isPending ? "#9E8E88" : "#2C2420", border: "none", padding: "13px", cursor: isPending ? "not-allowed" : "pointer", borderRadius: "3px" }}
          >
            {isPending ? "Saving…" : "Save Changes"}
          </button>
          <button
            type="button" onClick={() => navigate("/admin/products")}
            style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#6B5B55", background: "transparent", border: "1px solid #DDD5CE", padding: "13px 20px", cursor: "pointer", borderRadius: "3px" }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
