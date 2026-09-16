"use client";

import React, { useState } from "react";

export default function StudentRenewalPage() {
  const [selectedPlan, setSelectedPlan] = useState("p1");
  const [paymentRef, setPaymentRef] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const plans = [
    { id: "p1", name: "Monthly Standard Plan", duration_days: 30, price: 1500 },
    { id: "p2", name: "Quarterly Scholar Plan", duration_days: 90, price: 4000 },
    { id: "p3", name: "VIP Reserved Desk Plan", duration_days: 30, price: 2500 }
  ];

  const handleRenew = (e) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur px-6 py-4 flex items-center justify-between">
        <h1 className="font-extrabold text-lg text-slate-100">⚡ Student Self-Renewal Portal</h1>
        <a href="/portal" className="text-xs text-slate-400 hover:text-slate-200">← Back to Portal</a>
      </header>

      <main className="flex-1 max-w-xl w-full mx-auto p-6 my-auto">
        {isSubmitted ? (
          <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-3xl mx-auto">
              ✅
            </div>
            <h2 className="text-2xl font-bold text-emerald-400">Subscription Renewed Successfully!</h2>
            <p className="text-sm text-slate-300">
              Your subscription extension has been processed. A payment confirmation receipt has been sent to your WhatsApp number.
            </p>
            <a
              href="/portal"
              className="inline-block px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow transition"
            >
              Return to Portal Home
            </a>
          </div>
        ) : (
          <form onSubmit={handleRenew} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
            <div>
              <h2 className="text-xl font-bold text-slate-100">Renew Plan & Retain Seat</h2>
              <p className="text-xs text-slate-400 mt-1">Select plan for immediate extension</p>
            </div>

            <div className="space-y-3">
              {plans.map(p => (
                <div
                  key={p.id}
                  onClick={() => setSelectedPlan(p.id)}
                  className={`p-4 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                    selectedPlan === p.id 
                      ? "bg-amber-500/10 border-amber-500 shadow-md"
                      : "bg-slate-800/40 border-slate-700 hover:bg-slate-800"
                  }`}
                >
                  <div>
                    <h4 className="font-bold text-slate-100 text-sm">{p.name}</h4>
                    <p className="text-xs text-slate-400">{p.duration_days} Days Extension</p>
                  </div>
                  <span className="text-lg font-black text-amber-400">₹{p.price}</span>
                </div>
              ))}
            </div>

            <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 text-center space-y-2">
              <p className="text-xs text-slate-400">UPI Payment QR</p>
              <div className="w-32 h-32 bg-white p-2 rounded-xl mx-auto flex items-center justify-center text-slate-950 font-mono font-bold text-xs">
                [UPI QR CODE]
              </div>
              <p className="text-xs font-mono text-amber-400">UPI ID: library@upi</p>
            </div>

            <div>
              <label className="block mb-1 text-slate-400 font-medium text-xs">UPI Ref / UTR Number</label>
              <input
                type="text"
                required
                value={paymentRef}
                onChange={e => setPaymentRef(e.target.value)}
                placeholder="e.g. 9182301928"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm rounded-xl shadow-lg transition"
            >
              🚀 Submit Renewal Payment
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
