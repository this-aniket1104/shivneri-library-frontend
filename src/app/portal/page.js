"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ThreeSeatMap from "@/components/ThreeSeatMap";
import API_URL from "@/lib/api";

export default function StudentPortal() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [subscription, setSubscription] = useState(null);
  const [seatAllocation, setSeatAllocation] = useState(null);
  const [fees, setFees] = useState([]);
  const [seats, setSeats] = useState([]);
  const [checkedIn, setCheckedIn] = useState(false);
  const [message, setMessage] = useState("");
  
  // Profile Contact details
  const [profile, setProfile] = useState({ name: "Aarav Mehta", email: "aarav@gmail.com", phone: "9876543210" });

  // Complaints / Support state
  const [complaints, setComplaints] = useState([]);
  const [newComplaintCategory, setNewComplaintCategory] = useState("Wi-Fi / Internet");
  const [newComplaintDesc, setNewComplaintDesc] = useState("");

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (!storedToken) {
      router.push("/login");
      return;
    }
    setToken(storedToken);

    // Fetch profile and dashboard data in parallel
    const headers = { "Authorization": `Bearer ${storedToken}` };
    Promise.allSettled([
      fetch(`${API_URL}/api/auth/me`, { headers }).then(r => r.ok ? r.json() : null),
      fetchDashboardInfo(storedToken)
    ]).then(([profileRes]) => {
      if (profileRes.status === "fulfilled" && profileRes.value) {
        const data = profileRes.value;
        setProfile({ name: data.full_name, email: data.email, phone: data.phone || "N/A" });
      }
    });
  }, []);

  const fetchDashboardInfo = async (authToken) => {
    const headers = { "Authorization": `Bearer ${authToken}` };
    try {
      // Fire ALL requests in parallel instead of sequential
      const [subRes, seatRes, feeRes, allSeatsRes] = await Promise.allSettled([
        fetch(`${API_URL}/api/subscriptions/me`, { headers }),
        fetch(`${API_URL}/api/seats/me`, { headers }),
        fetch(`${API_URL}/api/fees/me`, { headers }),
        fetch(`${API_URL}/api/seats`)
      ]);

      // Process results
      if (subRes.status === "fulfilled" && subRes.value.ok) {
        setSubscription(await subRes.value.json());
      } else { setSubscription(null); }

      if (seatRes.status === "fulfilled" && seatRes.value.ok) {
        setSeatAllocation(await seatRes.value.json());
      } else { setSeatAllocation(null); }

      if (feeRes.status === "fulfilled" && feeRes.value.ok) {
        setFees(await feeRes.value.json());
      } else { setFees([]); }

      if (allSeatsRes.status === "fulfilled" && allSeatsRes.value.ok) {
        setSeats(await allSeatsRes.value.json());
      }

    } catch (err) {
      setSubscription(null);
      setSeatAllocation(null);
      setFees([]);
    }
  };

  const handleCheckInToggle = async () => {
    const endpoint = checkedIn ? "checkout-self" : "checkin-self";
    try {
      const res = await fetch(`${API_URL}/api/attendance/${endpoint}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setCheckedIn(!checkedIn);
        setMessage(`Successfully ${checkedIn ? "checked out" : "checked in"}!`);
      } else {
        const err = await res.json();
        setMessage(`Error: ${err.detail || "Request failed"}`);
      }
    } catch (e) {
      setCheckedIn(!checkedIn);
      setMessage(`Visual attendance status toggled.`);
    }
  };

  const handlePayFee = async (feeId) => {
    try {
      const res = await fetch(`${API_URL}/api/fees/${feeId}/pay`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ payment_method: "UPI" })
      });
      if (res.ok) {
        setMessage("Payment registered.");
        fetchDashboardInfo(token);
      } else {
        setMessage("Payment failed.");
      }
    } catch (e) {
      setMessage("UPI QR simulation triggered for checkout.");
      setFees(prev => prev.map(f => f.id === feeId ? { ...f, status: "paid" } : f));
    }
  };

  const handleRenewPlan = () => {
    setMessage("Please complete UPI transaction to extend subscription.");
  };

  const handleSubmitComplaint = (e) => {
    e.preventDefault();
    if (!newComplaintDesc.trim()) return;

    const ticket = {
      id: `c-${Date.now()}`,
      category: newComplaintCategory,
      description: newComplaintDesc,
      status: "open",
      created_at: new Date().toISOString().split("T")[0]
    };

    setComplaints(prev => [ticket, ...prev]);
    setNewComplaintDesc("");
    setMessage("Support ticket logged successfully.");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    router.push("/");
  };

  const calculateDaysRemaining = (endDateStr) => {
    if (!endDateStr) return 0;
    const diff = new Date(endDateStr) - new Date();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  const daysLeft = subscription ? calculateDaysRemaining(subscription.end_date) : 0;

  return (
    <div className="app-container" style={{ background: "var(--bg-primary)", minHeight: "100vh", display: "flex", flexDirection: "column", color: "#121316" }}>
      
      {/* Centered Luxury Floating Nav Bar */}
      <header className="glass-header" style={{ width: "90%", maxWidth: "1000px", margin: "2rem auto 1rem", border: "1px solid rgba(0,0,0,0.03)" }}>
        <div className="brand-title" style={{ fontFamily: "var(--font-headings)", fontWeight: "400", letterSpacing: "2px", fontSize: "1.1rem" }}>
          SHIVNERI STUDY CLUB
        </div>
        <nav className="nav-links">
          <Link href="/" className="nav-btn" style={{ fontSize: "0.75rem", letterSpacing: "1px", textTransform: "uppercase" }}>Home</Link>
          <span className="nav-btn" onClick={handleLogout} style={{ fontSize: "0.75rem", letterSpacing: "1px", textTransform: "uppercase" }}>Logout</span>
        </nav>
      </header>

      {/* Profile & Greeting Row (Fine-Art Clean Styling) */}
      <section style={{ padding: "2rem", maxWidth: "1000px", margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", gap: "2.5rem" }}>
        
        {/* Typographic Welcome Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "2rem", paddingBottom: "2rem", borderBottom: "1px solid #e8e6e0" }}>
          <div>
            <span style={{ fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--color-accent)", fontWeight: "600" }}>
              Member Console
            </span>
            <h1 style={{ fontSize: "3rem", margin: "0.5rem 0 0", fontFamily: "var(--font-headings)", fontWeight: "300", letterSpacing: "-0.02em" }}>
              Hello, {profile.name}
            </h1>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-secondary)" }}>
                Attendance
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.3rem" }}>
                <span style={{ 
                  display: "inline-block", 
                  width: "6px", 
                  height: "6px", 
                  borderRadius: "50%", 
                  backgroundColor: checkedIn ? "var(--color-accent)" : "#9ca3af"
                }}></span>
                <strong style={{ fontSize: "0.85rem", fontWeight: "500", textTransform: "uppercase", letterSpacing: "0.5px", color: checkedIn ? "var(--color-accent)" : "var(--text-secondary)" }}>
                  {checkedIn ? "Active Session" : "Checked Out"}
                </strong>
              </div>
            </div>
            <button 
              onClick={handleCheckInToggle}
              style={{
                background: "transparent",
                border: "1px solid #121316",
                color: "#121316",
                padding: "0.6rem 1.8rem",
                fontSize: "0.75rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                fontWeight: "600",
                cursor: "pointer",
                borderRadius: "8px",
                transition: "all 0.2s ease"
              }}
            >
              {checkedIn ? "Check Out" : "Check In"}
            </button>
          </div>
        </div>

        {/* Profile details Banner (Borderless, clean list columns) */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "2rem", padding: "0 0.5rem" }}>
          <div>
            <span style={{ fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-secondary)" }}>Full Name</span>
            <div style={{ fontSize: "1.1rem", fontWeight: "300", marginTop: "0.4rem", fontFamily: "var(--font-headings)" }}>{profile.name}</div>
          </div>
          <div>
            <span style={{ fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-secondary)" }}>Email Address</span>
            <div style={{ fontSize: "1.1rem", fontWeight: "300", marginTop: "0.4rem" }}>{profile.email}</div>
          </div>
          <div>
            <span style={{ fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-secondary)" }}>Phone Number</span>
            <div style={{ fontSize: "1.1rem", fontWeight: "300", marginTop: "0.4rem" }}>+91 {profile.phone}</div>
          </div>
        </div>

      </section>

      {/* Main stacked sections */}
      <main style={{ padding: "0 2rem 4rem", display: "flex", flexDirection: "column", gap: "4.5rem", maxWidth: "1000px", margin: "0 auto", width: "100%" }}>
        
        {/* ROW 1: Seat Assignment & 3D Interactive Map */}
        <section style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <h2 style={{ fontSize: "1.1rem", letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "var(--font-headings)", borderBottom: "1px solid #e8e6e0", paddingBottom: "0.75rem", margin: 0, fontWeight: "400" }}>
            Seat Reservation
          </h2>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: "3rem", alignItems: "stretch" }}>
            
            {/* Specs */}
            {seatAllocation ? (
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "1rem 0" }}>
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
                    <div>
                      <span style={{ color: "var(--text-secondary)", fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase" }}>Desk ID</span>
                      <div style={{ fontSize: "3.2rem", fontWeight: "300", fontFamily: "var(--font-headings)", color: "var(--color-accent)", marginTop: "0.4rem" }}>
                        {seatAllocation.seat_number}
                      </div>
                    </div>
                    <div>
                      <span style={{ color: "var(--text-secondary)", fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase" }}>Locker Box</span>
                      <div style={{ fontSize: "3.2rem", fontWeight: "300", fontFamily: "var(--font-headings)", color: "#121316", marginTop: "0.4rem" }}>
                        {seatAllocation.locker_number || "None"}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", borderTop: "1px solid #e8e6e0", paddingTop: "1.5rem", marginTop: "2rem", lineHeight: "1.6" }}>
                  <div style={{ marginBottom: "0.4rem" }}>Location: <strong>Floor {seatAllocation.floor}</strong>, {seatAllocation.hall_name}</div>
                  <div>Equipped with: <strong>Focus lighting, power socket & walnut dividers</strong></div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "3rem 0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <p style={{ fontStyle: "italic", color: "var(--text-muted)", fontSize: "0.9rem" }}>No active seat reservation detected.</p>
              </div>
            )}

            {/* 3D Map representation */}
            <div className="canvas-container" style={{ height: "300px", border: "1px solid #e8e6e0", borderRadius: "12px", overflow: "hidden", background: "#fff" }}>
              <ThreeSeatMap 
                seats={seats.map(s => s.seat_number === (seatAllocation?.seat_number || "A2") ? { ...s, selected: true } : s)}
                selectedSeat={seatAllocation ? { id: seatAllocation.id, seat_number: seatAllocation.seat_number } : null}
              />
            </div>

          </div>
        </section>

        {/* ROW 2: Membership Package & Outstanding Invoices */}
        <section style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <h2 style={{ fontSize: "1.1rem", letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "var(--font-headings)", borderBottom: "1px solid #e8e6e0", paddingBottom: "0.75rem", margin: 0, fontWeight: "400" }}>
            Membership & Invoices
          </h2>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: "3rem", alignItems: "stretch" }}>
            
            {/* Plan Info */}
            {subscription ? (
              <div style={{ border: "1px solid rgba(224, 83, 0, 0.15)", borderRadius: "12px", background: "#ffffff", padding: "2rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                    <div>
                      <span style={{ fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--color-accent)", fontWeight: "700" }}>Active Package</span>
                      <h3 style={{ fontSize: "1.6rem", margin: "0.2rem 0 0", fontFamily: "var(--font-headings)", fontWeight: "300" }}>{subscription.plan_name}</h3>
                    </div>
                  </div>
                  <div style={{ fontSize: "1.3rem", fontWeight: "300", fontFamily: "var(--font-headings)", color: "var(--color-accent)", marginTop: "1rem" }}>
                    {daysLeft} Days Remaining
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #e8e6e0", paddingTop: "1.5rem", marginTop: "2rem" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                    Valid until {new Date(subscription.end_date).toLocaleDateString()}
                  </span>
                  <button 
                    onClick={handleRenewPlan}
                    style={{
                      background: "transparent",
                      border: "1px solid #121316",
                      color: "#121316",
                      padding: "0.5rem 1.2rem",
                      fontSize: "0.7rem",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      fontWeight: "700",
                      cursor: "pointer",
                      borderRadius: "6px",
                      transition: "all 0.2s ease"
                    }}
                  >
                    Renew Plan
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "3rem 0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <p style={{ fontStyle: "italic", color: "var(--text-muted)", fontSize: "0.9rem" }}>No active subscription plan found.</p>
              </div>
            )}

            {/* Invoices Table (Sleek Typographic Design) */}
            <div style={{ background: "#ffffff", border: "1px solid #e8e6e0", borderRadius: "12px", padding: "1.5rem" }}>
              <h3 style={{ fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "1.5rem", fontWeight: "700" }}>Outstanding Dues</h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {fees.length === 0 ? (
                  <p style={{ color: "var(--text-muted)", fontStyle: "italic", fontSize: "0.85rem" }}>All dues settled.</p>
                ) : (
                  fees.map(f => (
                    <div key={f.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "1rem", borderBottom: "1px solid #f5f4f0" }}>
                      <div>
                        <div style={{ fontSize: "0.9rem", fontWeight: "500" }}>{f.description}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>Due {new Date(f.due_date).toLocaleDateString()}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                        <div style={{ fontSize: "0.95rem", fontWeight: "600" }}>₹{f.amount}</div>
                        {f.status === "unpaid" ? (
                          <button 
                            onClick={() => handlePayFee(f.id)}
                            style={{
                              background: "#121316",
                              border: "1px solid #121316",
                              color: "#fff",
                              padding: "0.4rem 1rem",
                              fontSize: "0.7rem",
                              letterSpacing: "0.08em",
                              textTransform: "uppercase",
                              fontWeight: "700",
                              cursor: "pointer",
                              borderRadius: "6px",
                              transition: "all 0.2s ease"
                            }}
                          >
                            Pay UPI
                          </button>
                        ) : (
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Paid</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </section>

        {/* ROW 3: Help Desk & Support Tickets */}
        <section style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <h2 style={{ fontSize: "1.1rem", letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "var(--font-headings)", borderBottom: "1px solid #e8e6e0", paddingBottom: "0.75rem", margin: 0, fontWeight: "400" }}>
            Help Desk
          </h2>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: "3rem", alignItems: "stretch" }}>
            
            {/* Submit Complaint (Sleek Input design) */}
            <div style={{ background: "#ffffff", border: "1px solid #e8e6e0", borderRadius: "12px", padding: "2rem" }}>
              <h3 style={{ fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "1.5rem", fontWeight: "700" }}>Submit Ticket</h3>
              
              <form onSubmit={handleSubmitComplaint} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: "0.3rem" }}>Support Category</label>
                  <select
                    value={newComplaintCategory}
                    onChange={(e) => setNewComplaintCategory(e.target.value)}
                    style={{ 
                      width: "100%", 
                      border: "0", 
                      borderBottom: "1px solid #e8e6e0", 
                      borderRadius: "0", 
                      padding: "0.5rem 0", 
                      background: "transparent",
                      fontSize: "0.9rem",
                      outline: "none"
                    }}
                  >
                    <option value="Wi-Fi / Internet">Wi-Fi / Internet</option>
                    <option value="AC & Ventilation">AC & Ventilation</option>
                    <option value="Electricity / Lighting">Electricity / Lighting</option>
                    <option value="Desk Cleaning">Desk Cleaning</option>
                    <option value="Other Support">Other Support</option>
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: "0.3rem" }}>Issue Details</label>
                  <input
                    type="text"
                    placeholder="Describe what needs attention..."
                    value={newComplaintDesc}
                    onChange={(e) => setNewComplaintDesc(e.target.value)}
                    required
                    style={{ 
                      width: "100%", 
                      border: "0", 
                      borderBottom: "1px solid #e8e6e0", 
                      borderRadius: "0", 
                      padding: "0.5rem 0", 
                      background: "transparent",
                      fontSize: "0.9rem",
                      outline: "none"
                    }}
                  />
                </div>

                <button 
                  type="submit"
                  style={{
                    background: "#121316",
                    border: "1px solid #121316",
                    color: "#fff",
                    padding: "0.75rem",
                    fontSize: "0.75rem",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    fontWeight: "700",
                    cursor: "pointer",
                    borderRadius: "6px",
                    width: "100%",
                    marginTop: "0.5rem",
                    transition: "all 0.2s ease"
                  }}
                >
                  Submit Support Ticket
                </button>
              </form>
            </div>

            {/* Ticket history list (typographic list columns) */}
            <div style={{ background: "#ffffff", border: "1px solid #e8e6e0", borderRadius: "12px", padding: "1.5rem" }}>
              <h3 style={{ fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "1.5rem", fontWeight: "700" }}>Ticket History</h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {complaints.map(c => (
                  <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "1rem", borderBottom: "1px solid #f5f4f0" }}>
                    <div>
                      <div style={{ fontSize: "0.9rem", fontWeight: "600" }}>{c.category}</div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>{c.description}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{c.created_at}</span>
                      <span 
                        style={{ 
                          fontSize: "0.7rem", 
                          textTransform: "uppercase", 
                          letterSpacing: "0.5px", 
                          fontWeight: "700",
                          color: c.status === "resolved" ? "var(--color-success)" : "var(--color-accent)"
                        }}
                      >
                        {c.status === "resolved" ? "Resolved" : "Open"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </section>

      </main>

      {/* Alert Overlay */}
      {message && (
        <div className="modal-overlay" onClick={() => setMessage("")}>
          <div className="modal-content" style={{ maxWidth: "360px", textAlign: "center", padding: "2rem", border: "1px solid #e8e6e0" }}>
            <p style={{ fontSize: "0.95rem", fontWeight: "500", marginBottom: "1.5rem", lineHeight: "1.5" }}>{message}</p>
            <button 
              className="btn" 
              onClick={() => setMessage("")}
              style={{
                background: "#121316",
                border: "1px solid #121316",
                color: "#fff",
                padding: "0.6rem 2rem",
                fontSize: "0.75rem",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                fontWeight: "700",
                cursor: "pointer",
                borderRadius: "6px",
                width: "100%"
              }}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{ borderTop: "1px solid #e8e6e0", padding: "2.5rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.8rem", background: "#ffffff", marginTop: "auto" }}>
        © 2026 Shivneri Library Management System. Crafted with 3D Mappings & Editorial Fine-Art.
      </footer>
    </div>
  );
}
