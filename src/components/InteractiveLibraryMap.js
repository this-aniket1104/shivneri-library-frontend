"use client";

import React, { useState, useEffect, useRef } from "react";
import ThreeSeatMap from "./ThreeSeatMap";

export default function InteractiveLibraryMap({
  seats = [],
  selectedSeatId = null,
  onSelectSeat = () => {},
  readOnly = false,
  customLayout = null
}) {
  const [viewMode, setViewMode] = useState("2d"); // "2d" or "3d"
  const [selectedZone, setSelectedZone] = useState("All");

  const zones = ["All", "Main Hall", "Silent Zone", "Discussion Room", "VIP Lounge"];

  // Filter seats by zone if selected
  const filteredSeats = selectedZone === "All" 
    ? seats 
    : seats.filter(s => (s.zone_name || "Main Hall") === selectedZone);

  // Group seats by zone for 2D visual render
  const defaultSeats = filteredSeats.length > 0 ? filteredSeats : [
    { id: "1", seat_number: "A1", status: "available", x_coord: 15, y_coord: 20, zone_name: "Main Hall" },
    { id: "2", seat_number: "A2", status: "available", x_coord: 35, y_coord: 20, zone_name: "Main Hall" },
    { id: "3", seat_number: "A3", status: "booked", x_coord: 55, y_coord: 20, zone_name: "Main Hall" },
    { id: "4", seat_number: "A4", status: "reserved", x_coord: 75, y_coord: 20, zone_name: "Main Hall" },
    { id: "5", seat_number: "B1", status: "available", x_coord: 15, y_coord: 45, zone_name: "Main Hall" },
    { id: "6", seat_number: "B2", status: "booked", x_coord: 35, y_coord: 45, zone_name: "Main Hall" },
    { id: "7", seat_number: "B3", status: "available", x_coord: 55, y_coord: 45, zone_name: "Silent Zone" },
    { id: "8", seat_number: "B4", status: "available", x_coord: 75, y_coord: 45, zone_name: "Silent Zone" },
    { id: "9", seat_number: "C1", status: "available", x_coord: 15, y_coord: 70, zone_name: "Discussion Room" },
    { id: "10", seat_number: "C2", status: "available", x_coord: 35, y_coord: 70, zone_name: "Discussion Room" },
    { id: "11", seat_number: "C3", status: "reserved", x_coord: 55, y_coord: 70, zone_name: "VIP Lounge" },
    { id: "12", seat_number: "C4", status: "available", x_coord: 75, y_coord: 70, zone_name: "VIP Lounge" }
  ];

  const getSeatColor = (seat) => {
    if (selectedSeatId === seat.id) return "bg-amber-500 text-white border-amber-600 shadow-lg scale-105";
    if (seat.assigned_student_id || seat.status === "booked") return "bg-red-500 text-white border-red-600";
    if (seat.reservation_pending || seat.status === "reserved") return "bg-yellow-500 text-slate-900 border-yellow-600";
    if (seat.is_active === false || seat.status === "inactive") return "bg-gray-400 text-white border-gray-500";
    return "bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600 hover:scale-105 cursor-pointer";
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
      {/* Map Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg flex items-center gap-2">
            🗺️ Actual Library Floor Map
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Interactive visual layout showing real desk positions and live availability
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Zone Selector */}
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            {zones.map(z => <option key={z} value={z}>{z}</option>)}
          </select>

          {/* 2D / 3D Mode Toggle */}
          <div className="inline-flex rounded-lg p-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode("2d")}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                viewMode === "2d" 
                  ? "bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm" 
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              2D Blueprint
            </button>
            <button
              type="button"
              onClick={() => setViewMode("3d")}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                viewMode === "3d" 
                  ? "bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm" 
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              3D Spatial View
            </button>
          </div>
        </div>
      </div>

      {/* Legend Bar */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-300 mb-4 px-2 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span> Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span> Booked
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-yellow-500 inline-block"></span> Reserved
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span> Selected
        </span>
      </div>

      {/* Map Content View */}
      {viewMode === "3d" ? (
        <div className="h-[450px] w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
          <ThreeSeatMap 
            seats={defaultSeats} 
            selectedSeat={defaultSeats.find(s => s.id === selectedSeatId)}
            onSeatClick={(seat) => onSelectSeat(seat)}
          />
        </div>
      ) : (
        <div className="relative min-h-[420px] w-full bg-slate-900 rounded-xl p-6 border border-slate-800 overflow-hidden shadow-inner flex flex-col justify-between">
          {/* Library Architectural Grid & Zones */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:30px_30px] opacity-40"></div>
          
          {/* Blueprint Structural Labels */}
          <div className="relative z-10 flex justify-between items-center mb-6">
            <div className="border border-amber-500/40 bg-amber-500/10 text-amber-300 text-xs px-3 py-1 rounded-full font-mono tracking-wider">
              🚪 ENTRANCE & RECEPTION
            </div>
            <div className="border border-cyan-500/40 bg-cyan-500/10 text-cyan-300 text-xs px-3 py-1 rounded-full font-mono tracking-wider">
              🔇 SILENT ZONE
            </div>
          </div>

          {/* Interactive Desks Rendered on Blueprint Canvas */}
          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 my-auto">
            {defaultSeats.map((seat) => {
              const isSelected = selectedSeatId === seat.id;
              return (
                <button
                  key={seat.id}
                  type="button"
                  disabled={readOnly || seat.assigned_student_id || seat.status === "booked"}
                  onClick={() => onSelectSeat(seat)}
                  className={`relative p-3 rounded-xl border-2 transition-all flex flex-col items-center justify-center font-bold text-center ${getSeatColor(seat)}`}
                >
                  <span className="text-lg tracking-wider font-mono">{seat.seat_number}</span>
                  <span className="text-[10px] opacity-80 uppercase tracking-tight">
                    {seat.zone_name || "Main Hall"}
                  </span>
                  {seat.assigned_student_id && (
                    <span className="text-[9px] mt-1 bg-black/20 px-1.5 py-0.5 rounded font-normal">
                      Occupied
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Blueprint Footer Facilities */}
          <div className="relative z-10 flex justify-between items-center mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-400 font-mono">
            <span>🛅 LOCKERS ZONE</span>
            <span>☕ REFRESHMENT AREA</span>
            <span>📶 HIGH SPEED WIFI</span>
          </div>
        </div>
      )}
    </div>
  );
}
