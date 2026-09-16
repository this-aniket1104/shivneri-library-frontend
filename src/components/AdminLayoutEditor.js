"use client";

import React, { useState } from "react";

export default function AdminLayoutEditor({ seats = [], onSaveLayout = () => {} }) {
  const [editingSeats, setEditingSeats] = useState(seats);
  const [activeZone, setActiveZone] = useState("Main Hall");
  const [isSaving, setIsSaving] = useState(false);

  const zones = ["Main Hall", "Silent Zone", "Discussion Room", "VIP Lounge"];

  const handlePositionChange = (seatId, key, val) => {
    setEditingSeats(prev => prev.map(s => s.id === seatId ? { ...s, [key]: val } : s));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveLayout(editingSeats);
      alert("Library Floor Plan Layout saved successfully!");
    } catch (err) {
      alert("Failed to save layout: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            🛠️ Actual Library Map & Layout Editor
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Configure seat numbers, zones, and custom blueprint position coordinates to match your physical library layout
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {isSaving ? "Saving Layout..." : "💾 Save Library Layout"}
        </button>
      </div>

      {/* Zone filter tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {zones.map(z => (
          <button
            key={z}
            type="button"
            onClick={() => setActiveZone(z)}
            className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all ${
              activeZone === z
                ? "bg-amber-500 text-white border-amber-500 shadow"
                : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
            }`}
          >
            {z}
          </button>
        ))}
      </div>

      {/* Seats Layout Editor Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="p-3">Seat Number</th>
              <th className="p-3">Zone / Hall</th>
              <th className="p-3">X Coord (%)</th>
              <th className="p-3">Y Coord (%)</th>
              <th className="p-3">Rotation (°)</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {editingSeats.map(seat => (
              <tr key={seat.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                <td className="p-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                  {seat.seat_number}
                </td>
                <td className="p-3">
                  <select
                    value={seat.zone_name || "Main Hall"}
                    onChange={(e) => handlePositionChange(seat.id, "zone_name", e.target.value)}
                    className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                  >
                    {zones.map(z => <option key={z} value={z}>{z}</option>)}
                  </select>
                </td>
                <td className="p-3">
                  <input
                    type="number"
                    value={seat.x_coord || 0}
                    onChange={(e) => handlePositionChange(seat.id, "x_coord", parseFloat(e.target.value))}
                    className="w-20 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-slate-800 dark:text-slate-200"
                  />
                </td>
                <td className="p-3">
                  <input
                    type="number"
                    value={seat.y_coord || 0}
                    onChange={(e) => handlePositionChange(seat.id, "y_coord", parseFloat(e.target.value))}
                    className="w-20 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-slate-800 dark:text-slate-200"
                  />
                </td>
                <td className="p-3">
                  <input
                    type="number"
                    value={seat.rotation || 0}
                    onChange={(e) => handlePositionChange(seat.id, "rotation", parseInt(e.target.value))}
                    className="w-20 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-slate-800 dark:text-slate-200"
                  />
                </td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    seat.assigned_student_id ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                  }`}>
                    {seat.assigned_student_id ? "Assigned" : "Available"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
