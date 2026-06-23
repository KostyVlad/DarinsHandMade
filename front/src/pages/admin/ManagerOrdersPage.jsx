import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API } from "../../api";

const STATUSES = ["all", "pending", "paid", "in_production", "shipped", "completed", "cancelled"];
const FLOW = ["pending", "paid", "in_production", "shipped", "completed", "cancelled"];

const STATUS_STYLE = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-blue-100 text-blue-800",
  in_production: "bg-purple-100 text-purple-800",
  shipped: "bg-indigo-100 text-indigo-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-700",
};

const label = (s) => s.replace("_", " ");
const money = (n) => `$${Number(n || 0).toFixed(2)}`;

function StatCard({ label, value }) {
  return (
    <div className="border border-black/10 p-6">
      <p className="text-black/40 uppercase text-[11px] tracking-[2px] mb-2">{label}</p>
      <p className="font-['Dorsa'] text-[40px] tracking-[2px] leading-none text-black">{value}</p>
    </div>
  );
}

export default function ManagerOrdersPage({ token }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState(null);
  const [message, setMessage] = useState(null);
  const [stats, setStats] = useState(null);
  const [period, setPeriod] = useState("30");

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.set("status", filter);
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(`${API}/api/orders?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setOrders(data.data || []);
    } catch {
      setMessage({ type: "error", text: "Failed to load orders" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const loadStats = async () => {
    try {
      const qs = period === "all" ? "" : `?days=${period}`;
      const res = await fetch(`${API}/api/orders/stats${qs}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setStats(data.data);
    } catch {
      /* non-critical */
    }
  };

  useEffect(() => {
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const changeStatus = async (id, status) => {
    setMessage(null);
    try {
      const res = await fetch(`${API}/api/orders/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || "Update failed");
      setOrders((prev) => prev.map((o) => (o._id === id ? data.data : o)));
      setMessage({ type: "success", text: "Status updated" });
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-black text-white py-12 px-6 md:px-8 text-center">
        <h1 className="font-['Dorsa'] text-[44px] sm:text-[64px] md:text-[110px] tracking-[8px] md:tracking-[14px] leading-none">
          Orders
        </h1>
        <p className="font-['Centaur'] text-[13px] md:text-[15px] tracking-[4px] text-white/70 uppercase mt-2">
          Track and manage customer orders
        </p>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 md:px-8 py-10">
        {stats && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-['Perpetua_Titling_MT'] text-[14px] tracking-[2px] uppercase">Sales overview</h2>
              <div className="flex gap-2">
                {[["7", "7 days"], ["30", "30 days"], ["all", "All time"]].map(([v, l]) => (
                  <button
                    key={v}
                    onClick={() => setPeriod(v)}
                    className={`px-3 py-1 text-[11px] tracking-[1px] uppercase border cursor-pointer ${
                      period === v ? "border-black bg-black text-white" : "border-black/20 text-black/50 hover:border-black/50"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <StatCard label="Total Sales" value={money(stats.revenue)} />
              <StatCard label="Orders" value={stats.orders} />
              <StatCard label="Avg Order" value={money(stats.avgOrder)} />
            </div>

            {stats.topProducts?.length > 0 && (
              <div className="border border-black/10 p-5">
                <p className="text-black/40 uppercase text-[11px] tracking-[2px] mb-3">Top products</p>
                {stats.topProducts.map((p, i) => (
                  <div key={i} className="flex justify-between text-[14px] font-['Centaur'] py-1.5 border-b border-black/5 last:border-0">
                    <span>{i + 1}. {p._id}</span>
                    <span className="text-black/60">{p.qty} sold · {money(p.revenue)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <Link
            to="/admin"
            className="font-['Perpetua_Titling_MT'] text-[11px] tracking-[2px] uppercase text-black/60 hover:text-black no-underline"
          >
            ← Products
          </Link>
          <form
            onSubmit={(e) => { e.preventDefault(); load(); }}
            className="flex gap-2"
          >
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search # / name / email"
              className="border-b border-black/20 pb-1 text-[14px] tracking-[1px] bg-transparent outline-none focus:border-black w-[220px]"
            />
            <button className="font-['Perpetua_Titling_MT'] text-[10px] tracking-[2px] uppercase border border-black px-3 hover:bg-black/5 cursor-pointer">
              Search
            </button>
          </form>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 border font-['Perpetua_Titling_MT'] text-[11px] tracking-[2px] uppercase transition-colors cursor-pointer ${
                filter === s ? "border-black bg-black text-white" : "border-black/20 text-black/60 hover:border-black/50"
              }`}
            >
              {label(s)}
            </button>
          ))}
        </div>

        {message && (
          <p className={`font-['Centaur'] text-[14px] mb-4 ${message.type === "error" ? "text-red-600" : "text-green-700"}`}>
            {message.text}
          </p>
        )}

        {loading ? (
          <p className="font-['Centaur'] text-[18px] text-black/50 py-10">Loading…</p>
        ) : orders.length === 0 ? (
          <p className="font-['Centaur'] text-[18px] text-black/50 py-10">No orders found.</p>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <div key={o._id} className="border border-black/10">
                <button
                  onClick={() => setOpenId(openId === o._id ? null : o._id)}
                  className="w-full flex items-center gap-4 p-4 text-left cursor-pointer bg-transparent border-none hover:bg-black/[0.02]"
                >
                  <span className="font-['Perpetua_Titling_MT'] text-[12px] tracking-[1px]">{o.orderNumber}</span>
                  <span className="font-['Centaur'] text-[14px] text-black/70 flex-1 truncate">{o.customer?.name}</span>
                  <span className="font-['Perpetua_Titling_MT'] text-[14px]">{money(o.total)}</span>
                  <span className={`text-[11px] tracking-[1px] uppercase px-2 py-1 rounded ${STATUS_STYLE[o.status] || ""}`}>
                    {label(o.status)}
                  </span>
                  <span className="font-['Centaur'] text-[12px] text-black/40 hidden md:inline">
                    {new Date(o.createdAt).toLocaleDateString()}
                  </span>
                </button>

                {openId === o._id && (
                  <div className="border-t border-black/10 p-5 bg-[#fafafa] space-y-4">
                    <div className="grid md:grid-cols-2 gap-4 text-[14px] font-['Centaur'] tracking-[0.5px]">
                      <div>
                        <p className="text-black/40 uppercase text-[11px] tracking-[2px] mb-1">Customer</p>
                        <p>{o.customer?.name}</p>
                        <p className="text-black/60">{o.customer?.email}</p>
                        <p className="text-black/60">{o.customer?.phone || "—"}</p>
                      </div>
                      <div>
                        <p className="text-black/40 uppercase text-[11px] tracking-[2px] mb-1">Fulfilment</p>
                        {o.deliveryMethod === "pickup" ? (
                          <p>Self pickup</p>
                        ) : (
                          <p>{[o.shipping?.address, o.shipping?.city, o.shipping?.country].filter(Boolean).join(", ")}</p>
                        )}
                        {o.notes && <p className="text-black/60 mt-2">Notes: {o.notes}</p>}
                      </div>
                    </div>

                    <div>
                      <p className="text-black/40 uppercase text-[11px] tracking-[2px] mb-2">Items</p>
                      {o.items.map((it, i) => (
                        <div key={i} className="flex justify-between text-[14px] font-['Centaur'] py-1 border-b border-black/5">
                          <span>
                            {it.name}
                            {it.custom && (
                              <span className="text-black/40 text-[12px]">
                                {" "}({[it.custom.size, it.custom.strap, it.custom.chainColor, it.custom.color].filter(Boolean).join(" · ")})
                              </span>
                            )}
                            <span className="text-black/40"> ×{it.quantity}</span>
                          </span>
                          <span>{money(it.price * it.quantity)}</span>
                        </div>
                      ))}
                      <p className="text-right font-['Perpetua_Titling_MT'] text-[15px] mt-2">Total: {money(o.total)}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-black/40 uppercase text-[11px] tracking-[2px]">Status</span>
                      <select
                        value={o.status}
                        onChange={(e) => changeStatus(o._id, e.target.value)}
                        className="border border-black/20 px-3 py-2 text-[13px] tracking-[1px] bg-white outline-none focus:border-black cursor-pointer"
                      >
                        {FLOW.map((s) => (
                          <option key={s} value={s}>{label(s)}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
