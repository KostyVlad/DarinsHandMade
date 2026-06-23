import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API } from "../../api";

const EMPTY = {
  model_name: "",
  category: "bags",
  price: "",
  color_palette: "",
  details: "",
  style: "",
};

const imgUrl = (file_name) => `${API}/${String(file_name).replace(/^\//, "")}`;

export default function AdminPage({ token }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [imageFile, setImageFile] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState("all");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const loadProducts = async () => {
    try {
      const res = await fetch(`${API}/api/products`);
      const data = await res.json();
      setProducts(data.data || []);
    } catch {
      setMessage({ type: "error", text: "Failed to load products" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const run = async () => {
      await loadProducts();
    };
    run();
  }, []);

  const resetForm = () => {
    setForm(EMPTY);
    setImageFile(null);
    setEditingId(null);
  };

  const startEdit = (p) => {
    setEditingId(p._id);
    setForm({
      model_name: p.model_name || "",
      category: p.category || "bags",
      price: p.price ?? "",
      color_palette: (p.color_palette || []).join(", "),
      details: (p.details || []).join(", "),
      style: (p.style || []).join(", "),
    });
    setImageFile(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (!editingId && !imageFile) {
      setMessage({ type: "error", text: "Upload a product image" });
      return;
    }

    const fd = new FormData();
    fd.append("model_name", form.model_name);
    fd.append("category", form.category);
    fd.append("price", form.price);
    fd.append("color_palette", form.color_palette);
    fd.append("details", form.details);
    fd.append("style", form.style);
    if (imageFile) fd.append("image", imageFile);

    setSaving(true);
    try {
      const res = await fetch(
        editingId ? `${API}/api/products/${editingId}` : `${API}/api/products`,
        {
          method: editingId ? "PUT" : "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || "Save failed");

      setMessage({ type: "success", text: editingId ? "Product updated" : "Product added" });
      resetForm();
      await loadProducts();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`Delete "${p.model_name}"?`)) return;
    setMessage(null);
    try {
      const res = await fetch(`${API}/api/products/${p._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || "Delete failed");
      if (editingId === p._id) resetForm();
      setMessage({ type: "success", text: "Product deleted" });
      await loadProducts();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const shown = products.filter((p) => filter === "all" || p.category === filter);

  const inputClass =
    "w-full border-b border-black/20 pb-2 pt-1 font-['Centaur'] text-[16px] tracking-[1px] text-black placeholder:text-black/25 bg-transparent outline-none focus:border-black transition-colors";
  const labelClass =
    "font-['Perpetua_Titling_MT'] text-[11px] tracking-[3px] text-black/50 uppercase block mb-2";

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-black text-white py-12 px-6 md:px-8 text-center">
        <h1 className="font-['Dorsa'] text-[44px] sm:text-[64px] md:text-[110px] tracking-[8px] md:tracking-[14px] leading-none">
          Manager Studio
        </h1>
        <p className="font-['Centaur'] text-[13px] md:text-[15px] tracking-[4px] text-white/70 uppercase mt-2">
          Add, edit and remove bags & bracelets
        </p>
        <Link
          to="/admin/orders"
          className="inline-block mt-5 border border-white/40 text-white font-['Perpetua_Titling_MT'] text-[11px] tracking-[2px] uppercase px-6 py-2 no-underline hover:bg-white hover:text-black transition-colors"
        >
          View Orders →
        </Link>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 md:px-8 py-12 grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-12 items-start">
        <form onSubmit={handleSubmit} className="lg:sticky lg:top-8 border border-black/10 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-['Dorsa'] text-[34px] tracking-[3px] leading-none">
              {editingId ? "Edit product" : "New product"}
            </h2>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="font-['Perpetua_Titling_MT'] text-[10px] tracking-[2px] uppercase text-black/50 hover:text-black underline underline-offset-4"
              >
                Cancel
              </button>
            )}
          </div>

          <div>
            <label className={labelClass}>Name</label>
            <input
              className={inputClass}
              value={form.model_name}
              onChange={(e) => setForm((f) => ({ ...f, model_name: e.target.value }))}
              placeholder="Dark Blue Beaded Mini Bag"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Category</label>
              <select
                className={inputClass}
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              >
                <option value="bags">Bags</option>
                <option value="bracelets">Bracelets</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Price ($)</label>
              <input
                className={inputClass}
                type="number"
                min="0"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                placeholder="120"
                required
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Colors (comma-separated)</label>
            <input
              className={inputClass}
              value={form.color_palette}
              onChange={(e) => setForm((f) => ({ ...f, color_palette: e.target.value }))}
              placeholder="Dark Blue, White"
            />
          </div>

          <div>
            <label className={labelClass}>Details (comma-separated)</label>
            <input
              className={inputClass}
              value={form.details}
              onChange={(e) => setForm((f) => ({ ...f, details: e.target.value }))}
              placeholder="Pearl handle, Ribbon bow"
            />
          </div>

          <div>
            <label className={labelClass}>Style (comma-separated)</label>
            <input
              className={inputClass}
              value={form.style}
              onChange={(e) => setForm((f) => ({ ...f, style: e.target.value }))}
              placeholder="Glamorous, Romantic"
            />
          </div>

          <div>
            <label className={labelClass}>
              Image {editingId && <span className="text-black/30">(leave empty to keep current)</span>}
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              className="font-['Centaur'] text-[14px] text-black/70 file:mr-3 file:border file:border-black/20 file:bg-white file:px-3 file:py-1.5 file:font-['Perpetua_Titling_MT'] file:text-[10px] file:tracking-[2px] file:uppercase file:cursor-pointer hover:file:border-black"
            />
          </div>

          {message && (
            <p
              className={`font-['Centaur'] text-[14px] tracking-[1px] ${
                message.type === "error" ? "text-red-600" : "text-green-700"
              }`}
            >
              {message.text}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 bg-black text-white font-['Perpetua_Titling_MT'] text-[12px] tracking-[3px] uppercase hover:bg-black/80 transition-colors disabled:opacity-60 cursor-pointer"
          >
            {saving ? "Saving…" : editingId ? "Save changes" : "Add product"}
          </button>
        </form>

        <div>
          <div className="flex items-center gap-3 mb-6">
            {["all", "bags", "bracelets"].map((c) => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={`px-4 py-2 border font-['Perpetua_Titling_MT'] text-[11px] tracking-[2px] uppercase transition-colors cursor-pointer ${
                  filter === c ? "border-black bg-black text-white" : "border-black/20 text-black/60 hover:border-black/50"
                }`}
              >
                {c}
              </button>
            ))}
            <span className="ml-auto font-['Centaur'] text-[13px] tracking-[2px] text-black/40">
              {shown.length} item{shown.length === 1 ? "" : "s"}
            </span>
          </div>

          {loading ? (
            <p className="font-['Centaur'] text-[20px] text-black/50 py-10">Loading…</p>
          ) : shown.length === 0 ? (
            <p className="font-['Centaur'] text-[18px] text-black/50 py-10">No products yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {shown.map((p) => (
                <div key={p._id} className="border border-black/10 flex flex-col">
                  <div className="aspect-square bg-[#fafafa] overflow-hidden">
                    <img src={imgUrl(p.file_name)} alt={p.model_name} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-4 flex flex-col gap-1 flex-1">
                    <p className="font-['Perpetua_Titling_MT'] text-[12px] tracking-[1.5px] uppercase">{p.model_name}</p>
                    <p className="font-['Centaur'] text-[13px] tracking-[1px] text-black/50 capitalize">
                      {p.category} · ${p.price}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => startEdit(p)}
                        className="flex-1 py-2 border border-black text-black font-['Perpetua_Titling_MT'] text-[10px] tracking-[2px] uppercase hover:bg-black/5 transition-colors cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        className="flex-1 py-2 border border-red-600 text-red-600 font-['Perpetua_Titling_MT'] text-[10px] tracking-[2px] uppercase hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
