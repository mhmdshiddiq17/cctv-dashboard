import { cols } from "@/lib/const";
import { CCTVFilter, CCTVItem, CCTVSortKey, CCTVStatus } from "@/lib/types";
import { AlertTriangle, Wifi, WifiOff } from "lucide-react";
import { useState } from "react";

// ─── STATUS BADGE ─────────────────────────────────────────────────
function StatusBadge({ status }: Readonly<{ status: CCTVStatus }>) {
  const config = {
    ONLINE:      { label: "Online",      class: "bg-green-900 text-green-300 border border-green-700" },
    OFFLINE:     { label: "Offline",     class: "bg-red-900 text-red-300 border border-red-700" },
    MAINTENANCE: { label: "Maintenance", class: "bg-yellow-900 text-yellow-300 border border-yellow-700" },
  };
  const c = config[status] ?? config.OFFLINE;
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${c.class}`}>
      {c.label}
    </span>
  );
}

// ─── CCTV STATUS ICON ─────────────────────────────────────────────
function CCTVStatusIcon({ status }: Readonly<{ status: CCTVStatus }>) {
  if (status === "ONLINE")      return <Wifi size={14} className="text-green-400" />;
  if (status === "OFFLINE")     return <WifiOff size={14} className="text-red-400" />;
  if (status === "MAINTENANCE") return <AlertTriangle size={14} className="text-yellow-400" />;
  return null;
}

function CCTVTable({ cctvList }: Readonly<{ cctvList: CCTVItem[] }>) {
  const [sortKey, setSortKey] = useState<CCTVSortKey>("label");
  const [filter, setFilter] = useState<CCTVFilter>("ALL");

  const filtered = cctvList.filter(c => filter === "ALL" || c.status === filter);
  const sorted = [...filtered].sort((a, b) => {
    if (sortKey === "fps") {
      return a.fps - b.fps;
    }

    return a[sortKey].localeCompare(b[sortKey]);
  });

 
  const filterOptions: ReadonlyArray<CCTVFilter> = ["ALL", "ONLINE", "OFFLINE", "MAINTENANCE"];

  return (
    <div className="flex flex-col gap-2">
      {/* Filter Bar */}
      <div className="flex gap-2 flex-wrap">
        {filterOptions.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold border transition
              ${filter === f
                ? "bg-red-600 border-red-500 text-white"
                : "bg-gray-900 border-gray-700 text-gray-400 hover:border-red-700 hover:text-white"}`}
          >
            {f === "ALL" ? "Semua" : f}
          </button>
        ))}
      </div>
      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-900 border-b border-gray-800">
              {cols.map(col => (
                <th
                  key={col.key}
                  onClick={() => setSortKey(col.key)}
                  className={`px-3 py-2.5 text-left font-semibold uppercase tracking-wider cursor-pointer transition
                    ${sortKey === col.key ? "text-red-400" : "text-gray-500 hover:text-gray-300"}`}
                >
                  {col.label} {sortKey === col.key && "↑"}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((cctv, i) => (
              <tr key={cctv.id} className={`border-b border-gray-900 hover:bg-gray-800 transition ${i % 2 === 0 ? "bg-gray-950" : "bg-gray-900"}`}>
                <td className="px-3 py-2.5 text-white font-medium flex items-center gap-2">
                  <CCTVStatusIcon status={cctv.status} /> {cctv.label}
                </td>
                <td className="px-3 py-2.5 text-gray-400">{cctv.location}</td>
                <td className="px-3 py-2.5"><StatusBadge status={cctv.status} /></td>
                <td className="px-3 py-2.5 text-gray-400">{cctv.resolution}</td>
                <td className="px-3 py-2.5 text-gray-400">{cctv.brand}</td>
                <td className="px-3 py-2.5 text-gray-400">{cctv.fps > 0 ? `${cctv.fps} fps` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default CCTVTable;