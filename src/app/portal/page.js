"use client";

import React, { useState, useEffect } from "react";
import InteractiveLibraryMap from "@/components/InteractiveLibraryMap";

export default function StudentPortalPage() {
  const [subscription, setSubscription] = useState(null);
  const [student, setStudent] = useState(null);
  const [seat, setSeat] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock student portal data
    setStudent({
      full_name: "Rahul Sharma",
      email: "rahul@example.com",
      phone: "+91 9876543210",
      id: "std-101"
    });
    setSubscription({
      id: "sub-202",
      plan_name: "Monthly Scholar Plan",
      start_date: "2026-09-01",
      end_date: "2026-10-01",
      status: "active",
      days_left: 15
    });
    setSeat({
      id: "seat-1",
      seat_number: "A2",
      zone_name: "Main Hall"
    });
    setLoading(false);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎓</span>
          <div>
            <h1 className="font-extrabold text-lg text-slate-100">Student Self-Service Portal</h1>
            <p className="text-xs text-slate-400">Welcome back, {student?.full_name || "Student"}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/portal/renew"
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition"
          >
            ⚡ Renew Subscription
          </a>
          <a href="/login" className="text-xs text-slate-400 hover:text-slate-200">Logout</a>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow">
            <p className="text-xs text-slate-400">Active Subscription</p>
            <h3 className="text-lg font-bold text-slate-100 mt-1">{subscription?.plan_name}</h3>
            <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              ● {subscription?.status?.toUpperCase()}
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow">
            <p className="text-xs text-slate-400">Days Remaining</p>
            <h3 className="text-3xl font-black text-amber-400 mt-1">{subscription?.days_left} Days</h3>
            <p className="text-[11px] text-slate-400 mt-1">Expires on {subscription?.end_date}</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow">
            <p className="text-xs text-slate-400">Assigned Desk / Seat</p>
            <h3 className="text-xl font-mono font-bold text-slate-100 mt-1">{seat?.seat_number || "Unassigned"}</h3>
            <p className="text-[11px] text-slate-400 mt-1">Zone: {seat?.zone_name || "Main Hall"}</p>
          </div>
        </div>

        {/* Actual Library Map Component */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            📍 Your Seat Location on Actual Library Map
          </h2>
          <InteractiveLibraryMap
            selectedSeatId={seat?.id}
            readOnly={true}
          />
        </div>
      </main>
    </div>
  );
}
