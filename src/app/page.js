"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ThreeSeatMap from "@/components/ThreeSeatMap";
import API_URL from "@/lib/api";

export default function Home() {
  const [seats, setSeats] = useState([]);
  const [plans, setPlans] = useState([]);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bookingMessage, setBookingMessage] = useState("");

  const [liveMetrics, setLiveMetrics] = useState({ available: 42, total: 120, activeMembers: 78 });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (token && role) {
      setUser({ token, role });
    }

    fetchSeats();
    fetchPlans();
  }, []);

  const fetchSeats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/seats`);
      if (res.ok) {
        const data = await res.json();
        setSeats(data);
        const vacantCount = data.filter(s => !s.assigned_student_id && !s.reservation_pending && s.is_active !== false).length;
        const totalSeats = data.length > 0 ? data.length : 120;
        setLiveMetrics({
          available: data.length > 0 ? vacantCount : 42,
          total: totalSeats,
          activeMembers: data.length > 0 ? Math.max(0, totalSeats - vacantCount) : 78
        });
      }
    } catch (err) {
      console.warn("Backend offline. Using standard simulator values.");
    }
  };

  const fetchPlans = async () => {
    try {
      const res = await fetch(`${API_URL}/api/plans`);
      if (res.ok) {
        const data = await res.json();
        setPlans(data);
      } else {
        loadMockPlans();
      }
    } catch (err) {
      loadMockPlans();
    }
  };

  const loadMockPlans = () => {
    setPlans([
      { id: "p1", name: "Daily Pass", price: 100, duration_days: 1, benefits: ["AC Study Hall access", "High-speed 200Mbps Wi-Fi", "Daily seat selection"] },
      { id: "p2", name: "Premium Monthly", price: 1200, duration_days: 30, benefits: ["Reserved Dedicated Seat", "Personal Storage Locker", "AC & high-speed Wi-Fi", "Extended study hours access"], isPopular: true },
      { id: "p3", name: "Locker Standard", price: 800, duration_days: 30, benefits: ["AC Study desk access", "High-speed Wi-Fi access", "Locker storage facilities"] }
    ]);
  };

  const handleSeatSelect = (seat) => {
    setSelectedSeat(seat);
    setBookingMessage("");
  };

  const handleBooking = async () => {
    if (!user) {
      setBookingMessage("Please log in to reserve a seat.");
      return;
    }
    
    setLoading(true);
    try {
      const subRes = await fetch(`${API_URL}/api/subscriptions/me`, {
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      
      let subId = "";
      if (subRes.ok) {
        const subData = await subRes.json();
        subId = subData.id;
      } else {
        setBookingMessage("No active subscription found. Subscribe to a plan first!");
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_URL}/api/reservations/seats`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.token}`
        },
        body: JSON.stringify({
          seat_id: selectedSeat.id,
          subscription_id: subId
        })
      });

      if (res.ok) {
        setBookingMessage(`Success! Seat ${selectedSeat.seat_number} reserved.`);
        fetchSeats();
      } else {
        const errData = await res.json();
        let errorMsg = "Unknown error";
        if (errData && errData.detail) {
          if (typeof errData.detail === "string") {
            errorMsg = errData.detail;
          } else if (Array.isArray(errData.detail)) {
            errorMsg = errData.detail.map(d => {
              const field = d.loc && d.loc[d.loc.length - 1];
              const fieldName = field ? field.charAt(0).toUpperCase() + field.slice(1).replace("_", " ") : "";
              return fieldName ? `${fieldName}: ${d.msg}` : d.msg;
            }).join(", ");
          }
        }
        setBookingMessage(`Booking failed: ${errorMsg}`);
      }
    } catch (err) {
      setBookingMessage("Error connecting to server. Demo booking successful!");
      setSeats(prev => prev.map(s => s.id === selectedSeat.id ? { ...s, reservation_pending: true } : s));
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setUser(null);
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="app-container" style={{ background: "var(--bg-primary)", color: "#121316" }}>
      
      {/* Centered Floating Pill Header */}
      <header className="glass-header" style={{ width: "90%", maxWidth: "1000px", margin: "2rem auto 1rem", border: "1px solid rgba(0,0,0,0.03)" }}>
        <div className="brand-title" style={{ fontFamily: "var(--font-headings)", fontWeight: "400", letterSpacing: "2px", fontSize: "1.1rem" }}>
          SHIVNERI LIBRARY
        </div>
        <nav className="nav-links">
          <Link href="/" className="nav-btn active" style={{ fontSize: "0.75rem", letterSpacing: "1px", textTransform: "uppercase" }}>Home</Link>
          <span className="nav-btn" onClick={() => scrollToSection("seat-map")} style={{ fontSize: "0.75rem", letterSpacing: "1px", textTransform: "uppercase" }}>Study Map</span>
          <span className="nav-btn" onClick={() => scrollToSection("plans")} style={{ fontSize: "0.75rem", letterSpacing: "1px", textTransform: "uppercase" }}>Plans</span>
          {user ? (
            <>
              <Link href={user.role === "Super Admin" ? "/admin" : "/portal"} className="nav-btn" style={{ fontSize: "0.75rem", letterSpacing: "1px", textTransform: "uppercase" }}>Console</Link>
              <span className="nav-btn" onClick={handleLogout} style={{ fontSize: "0.75rem", letterSpacing: "1px", textTransform: "uppercase" }}>Logout</span>
            </>
          ) : (
            <Link href="/login" style={{
              background: "transparent",
              border: "1px solid #121316",
              color: "#121316",
              padding: "0.4rem 1.2rem",
              fontSize: "0.75rem",
              letterSpacing: "1px",
              textTransform: "uppercase",
              fontWeight: "600",
              borderRadius: "6px",
              textDecoration: "none"
            }}>Log In</Link>
          )}
        </nav>
      </header>

      {/* SECTION 1: Welcoming Experiential Hero */}
      <section className="split-hero" style={{ padding: "4rem 2rem 6rem", maxWidth: "1000px", margin: "0 auto" }}>
        
        {/* Left Side: Welcoming Copy */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem", textAlign: "left" }}>
          <div>
            <span style={{ fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--color-accent)", fontWeight: "600", display: "block", marginBottom: "0.75rem" }}>
              SHIVNERI STUDY CLUB
            </span>
            <h1 style={{ fontSize: "3.4rem", lineHeight: "1.05", marginBottom: "1.2rem", fontFamily: "var(--font-headings)", fontWeight: "300", letterSpacing: "-0.02em" }}>
              Your workspace for infinite focus.
            </h1>
            <p style={{ fontSize: "1.05rem", color: "var(--text-secondary)", lineHeight: "1.7", fontWeight: "300" }}>
              Shivneri Library provides premium, quiet study zones designed to help students, professional exam aspirants, and researchers from all walks of life prepare, focus, and conquer their goals.
            </p>
          </div>

          {/* Action triggers */}
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <button 
              onClick={() => scrollToSection("seat-map")} 
              style={{
                background: "#121316",
                border: "1px solid #121316",
                color: "#ffffff",
                padding: "0.75rem 2rem",
                fontSize: "0.75rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                fontWeight: "600",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              Explore Study Map
            </button>
            
            <button 
              onClick={() => scrollToSection("plans")} 
              style={{
                background: "transparent",
                border: "1px solid #121316",
                color: "#121316",
                padding: "0.75rem 2rem",
                fontSize: "0.75rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                fontWeight: "600",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              View Memberships
            </button>
          </div>

          {/* Clean live metrics tracker */}
          <div style={{ display: "flex", gap: "2.5rem", fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-secondary)" }}>
            <div>
              <strong>{liveMetrics.available}</strong> Desks Vacant
            </div>
            <div style={{ borderLeft: "1px solid #e8e6e0", paddingLeft: "2.5rem" }}>
              <strong>{liveMetrics.activeMembers}</strong> Members Active
            </div>
          </div>
        </div>

        {/* Right Side: Watercolor Artwork */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ padding: "0.5rem", border: "1px solid #e8e6e0", borderRadius: "16px", background: "#ffffff", width: "100%", maxWidth: "440px", boxShadow: "0 15px 40px rgba(0,0,0,0.02)" }}>
            <img 
              src="/images/library_art.png" 
              alt="Shivneri Library Study Environment" 
              style={{ width: "100%", height: "auto", borderRadius: "12px", display: "block" }}
            />
          </div>
        </div>
      </section>

      {/* SECTION 2: Quiet Study Features */}
      <section className="dark-contrast-section" id="amenities" style={{ padding: "6rem 2rem", background: "#121316", color: "#ffffff" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto", textAlign: "center", marginBottom: "4.5rem" }}>
          <h2 style={{ fontSize: "2.5rem", marginBottom: "1rem", fontFamily: "var(--font-headings)", fontWeight: "300", letterSpacing: "-0.01em" }}>
            Quiet Spaces & Modern Amenities
          </h2>
          <p style={{ maxWidth: "600px", margin: "0 auto", fontSize: "1rem", color: "#a1a1aa", fontWeight: "300" }}>
            Engineered environments optimized for extended study hours and deep focus sessions.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "2.5rem", maxWidth: "1000px", margin: "0 auto" }}>
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "2.5rem 2rem" }}>
            <h3 style={{ fontSize: "1.1rem", fontFamily: "var(--font-headings)", fontWeight: "400", color: "#ffffff", marginBottom: "0.75rem" }}>Silent Desks</h3>
            <p style={{ fontSize: "0.85rem", color: "#a1a1aa", lineHeight: "1.6", fontWeight: "300" }}>Dedicated individual cubicles with focus lamps, plug points, and ergonomic seating.</p>
          </div>
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "2.5rem 2rem" }}>
            <h3 style={{ fontSize: "1.1rem", fontFamily: "var(--font-headings)", fontWeight: "400", color: "#ffffff", marginBottom: "0.75rem" }}>Personal Lockers</h3>
            <p style={{ fontSize: "0.85rem", color: "#a1a1aa", lineHeight: "1.6", fontWeight: "300" }}>Secure locker storage to keep your books and study documents safe between sessions.</p>
          </div>
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "2.5rem 2rem" }}>
            <h3 style={{ fontSize: "1.1rem", fontFamily: "var(--font-headings)", fontWeight: "400", color: "#ffffff", marginBottom: "0.75rem" }}>Gigabit Wi-Fi</h3>
            <p style={{ fontSize: "0.85rem", color: "#a1a1aa", lineHeight: "1.6", fontWeight: "300" }}>High speed internet to search references, download material, and stream video lectures.</p>
          </div>
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "2.5rem 2rem" }}>
            <h3 style={{ fontSize: "1.1rem", fontFamily: "var(--font-headings)", fontWeight: "400", color: "#ffffff", marginBottom: "0.75rem" }}>Climate Control</h3>
            <p style={{ fontSize: "0.85rem", color: "#a1a1aa", lineHeight: "1.6", fontWeight: "300" }}>Fully air-conditioned study rooms maintaining a cool, fresh, and distraction-free environment.</p>
          </div>
        </div>
      </section>

      {/* SECTION 3: 3D Seat Workspace Panel */}
      <section style={{ background: "#ffffff", borderBottom: "1px solid var(--border-color)", padding: "6rem 2rem" }} id="seat-map">
        <div style={{ maxWidth: "1000px", margin: "0 auto", textAlign: "center", marginBottom: "4rem" }}>
          <span style={{ fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--color-accent)", fontWeight: "700" }}>HALL MAP</span>
          <h2 style={{ fontSize: "2.5rem", marginTop: "0.5rem", marginBottom: "1rem", fontFamily: "var(--font-headings)", fontWeight: "300", letterSpacing: "-0.01em" }}>
            Select Your Preferred Study Desk
          </h2>
          <p style={{ color: "var(--text-secondary)", maxWidth: "600px", margin: "0 auto", fontSize: "0.95rem", fontWeight: "300" }}>
            Interact with our 3D room map to view desk placements, utilities, and live availability. Left-click and drag to rotate the hall, scroll to zoom.
          </p>
        </div>

        <div className="split-hero" style={{ padding: 0, gap: "3rem", maxWidth: "1000px", margin: "0 auto" }}>
          {/* Left Side: The Interactive 3D Room Visualizer */}
          <div style={{ width: "100%", display: "flex", flexDirection: "column" }}>
            <div className="canvas-container" style={{ border: "1px solid #e8e6e0", borderRadius: "12px", overflow: "hidden", height: "340px" }}>
              <ThreeSeatMap 
                seats={seats} 
                selectedSeat={selectedSeat} 
                onSeatClick={handleSeatSelect} 
              />
            </div>
          </div>

          {/* Right Side: Step Wizard Booking Form */}
          <div className={`booking-panel ${selectedSeat ? "active-drawer" : ""}`} style={{ width: "100%" }}>
            <div className="glass-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", border: "1px solid #e8e6e0", padding: "2rem", height: "100%", minHeight: "340px", background: "#fff" }}>
              <button className="drawer-close" onClick={() => setSelectedSeat(null)}>✕</button>
              
              <div>
                {/* Step Progress Wizard */}
                <div className="wizard-steps" style={{ marginBottom: "1.5rem" }}>
                  <div className={`wizard-step ${selectedSeat === null ? "active" : ""}`}>
                    <span className="wizard-step-num">1</span> Desk
                  </div>
                  <div className="wizard-line"></div>
                  <div className={`wizard-step ${(selectedSeat !== null && !bookingMessage.includes("Success")) ? "active" : ""}`}>
                    <span className="wizard-step-num">2</span> Confirm
                  </div>
                  <div className="wizard-line"></div>
                  <div className={`wizard-step ${bookingMessage.includes("Success") ? "active" : ""}`}>
                    <span className="wizard-step-num">3</span> Done
                  </div>
                </div>

                {selectedSeat ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f5f4f0", paddingBottom: "0.5rem" }}>
                      <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Selected Desk:</span>
                      <strong style={{ fontSize: "1.1rem", fontFamily: "var(--font-headings)", color: "var(--color-accent)" }}>Desk {selectedSeat.seat_number}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f5f4f0", paddingBottom: "0.5rem" }}>
                      <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Location:</span>
                      <span style={{ fontSize: "0.9rem" }}>Floor {selectedSeat.floor || 1} - {selectedSeat.hall_name || "Main Hall"}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f5f4f0", paddingBottom: "0.5rem" }}>
                      <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Status:</span>
                      <span style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "700", color: selectedSeat.assigned_student_id ? "#ef4444" : selectedSeat.reservation_pending ? "#d97706" : "var(--color-success)" }}>
                        {selectedSeat.assigned_student_id ? "Booked" : selectedSeat.reservation_pending ? "Reserved" : "Available"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: "2.5rem 0", textAlign: "center" }}>
                    <p style={{ fontStyle: "italic", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                      Select a vacant desk on the 3D map to view specifications
                    </p>
                  </div>
                )}
              </div>

              {selectedSeat && (
                <div style={{ marginTop: "1.5rem" }}>
                  {!selectedSeat.assigned_student_id && !selectedSeat.reservation_pending ? (
                    <button 
                      onClick={handleBooking} 
                      disabled={loading}
                      style={{
                        width: "100%",
                        height: "45px",
                        background: "#121316",
                        border: "1px solid #121316",
                        color: "#fff",
                        fontSize: "0.75rem",
                        letterSpacing: "0.15em",
                        textTransform: "uppercase",
                        fontWeight: "700",
                        borderRadius: "8px",
                        cursor: "pointer"
                      }}
                    >
                      {loading ? "Processing..." : "Confirm Seat Reservation"}
                    </button>
                  ) : (
                    <button className="btn btn-secondary" style={{ width: "100%", height: "45px", cursor: "not-allowed" }} disabled>
                      Desk Occupied
                    </button>
                  )}
                  {bookingMessage && (
                    <p style={{ marginTop: "1rem", textAlign: "center", color: bookingMessage.includes("Success") ? "var(--color-success)" : "var(--color-danger)", fontSize: "0.85rem", fontWeight: "600" }}>
                      {bookingMessage}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: Membership Packages */}
      <section style={{ padding: "6rem 2rem", background: "#faf9f6" }} id="plans">
        <div style={{ maxWidth: "1000px", margin: "0 auto", textAlign: "center", marginBottom: "4.5rem" }}>
          <h2 style={{ fontSize: "2.5rem", marginBottom: "1rem", fontFamily: "var(--font-headings)", fontWeight: "300", letterSpacing: "-0.01em" }}>
            Membership Plans
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "1rem", fontWeight: "300" }}>Select the perfect plan for your study sessions. Packages include seats & lockers.</p>
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "3rem", maxWidth: "1000px", margin: "0 auto" }}>
          {plans.length === 0 ? (
            Array(3).fill(0).map((_, i) => (
              <div className="glass-card skeleton-card" key={i} style={{ minHeight: "360px", padding: "2rem" }}>
                <div className="skeleton-title"></div>
                <div className="skeleton-text"></div>
                <div className="skeleton-text" style={{ width: "70%" }}></div>
                <div className="skeleton-button"></div>
              </div>
            ))
          ) : (
            plans.map((plan) => (
              <div 
                key={plan.id} 
                style={{ 
                  display: "flex", 
                  flexDirection: "column", 
                  justifyContent: "space-between", 
                  minHeight: "360px", 
                  padding: "2.5rem 2.2rem",
                  background: "#ffffff",
                  border: plan.isPopular ? "1px solid var(--color-accent)" : "1px solid #e8e6e0",
                  borderRadius: "12px"
                }}
              >
                <div>
                  <h3 style={{ fontSize: "1.1rem", fontFamily: "var(--font-headings)", color: plan.isPopular ? "var(--color-accent)" : "var(--text-primary)", fontWeight: "500", letterSpacing: "1px", textTransform: "uppercase" }}>{plan.name}</h3>
                  <div style={{ fontSize: "2.2rem", fontWeight: "300", fontFamily: "var(--font-headings)", color: "var(--text-primary)", margin: "1.2rem 0" }}>
                    ₹{plan.price} <span style={{ fontSize: "0.85rem", fontWeight: "normal", color: "var(--text-secondary)", fontFamily: "var(--font-main)" }}>/ {plan.duration_days} days</span>
                  </div>
                  <ul style={{ listStyle: "none", color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1.5rem" }}>
                    {(plan.benefits || []).map((b, i) => (
                      <li key={i} style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.85rem", fontWeight: "300" }}>
                        <span style={{ color: "var(--color-success)", fontSize: "0.7rem" }}>—</span> {b}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <Link 
                  href="/login" 
                  style={{ 
                    marginTop: "2.5rem", 
                    textAlign: "center",
                    background: plan.isPopular ? "#121316" : "transparent",
                    border: "1px solid #121316",
                    color: plan.isPopular ? "#fff" : "#121316",
                    padding: "0.75rem 0",
                    fontSize: "0.75rem",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    fontWeight: "700",
                    borderRadius: "8px",
                    textDecoration: "none",
                    transition: "all 0.2s ease"
                  }}
                >
                  Select Package
                </Link>
              </div>
            ))
          )}
        </div>
      </section>

      {/* SECTION 5: Call to Action Banner */}
      <section className="cta-banner" style={{ background: "linear-gradient(135deg, #121316 0%, #1e293b 100%)", padding: "6rem 2rem", color: "#ffffff", textAlign: "center" }}>
        <h2 style={{ fontSize: "2.5rem", marginBottom: "1rem", fontFamily: "var(--font-headings)", fontWeight: "300", letterSpacing: "-0.01em" }}>Conquer Your Study Goals</h2>
        <p style={{ maxWidth: "600px", margin: "0 auto 2.5rem", fontSize: "1rem", color: "#cbd5e1", fontWeight: "300", lineHeight: "1.7" }}>Join Pune’s premier focused community. Set your schedules, scan to check in, and conquer your exams at Shivneri.</p>
        <div>
          <Link href="/login" style={{
            background: "#ffffff",
            border: "1px solid #ffffff",
            color: "#121316",
            padding: "0.8rem 2.2rem",
            fontSize: "0.75rem",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            fontWeight: "700",
            borderRadius: "8px",
            textDecoration: "none",
            boxShadow: "none"
          }}>Join The Club</Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid #e8e6e0", padding: "2.5rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.8rem", background: "#ffffff" }}>
        © 2026 Shivneri Library Management System. Crafted with 3D Visual Mappings & Editorial Fine-Art.
      </footer>
    </div>
  );
}
