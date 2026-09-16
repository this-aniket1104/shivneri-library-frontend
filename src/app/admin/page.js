"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import API_URL from "@/lib/api";
import InteractiveLibraryMap from "@/components/InteractiveLibraryMap";
import AdminLayoutEditor from "@/components/AdminLayoutEditor";

export default function AdminConsole() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [activeTab, setActiveTab] = useState("users");
  const [metrics, setMetrics] = useState(null);
  const [users, setUsers] = useState([]);
  const [seats, setSeats] = useState([]);
  const [plans, setPlans] = useState([]);
  const [message, setMessage] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Plans creation form
  const [newPlan, setNewPlan] = useState({ name: "", price: "", duration_days: 30, description: "" });

  // Modal Profile detail state
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentSub, setStudentSub] = useState(null);
  const [studentFees, setStudentFees] = useState([]);

  // Notice Broadcast form state
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastContent, setBroadcastContent] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [sendSms, setSendSms] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (!storedToken || role !== "Super Admin") {
      router.push("/login");
      return;
    }
    setToken(storedToken);

    fetchAdminData(storedToken);
  }, []);

  const fetchAdminData = async (authToken) => {
    const headers = { "Authorization": `Bearer ${authToken}` };
    try {
      // Fire ALL requests in parallel
      const [metricRes, userRes, seatRes, planRes] = await Promise.allSettled([
        fetch(`${API_URL}/api/dashboard/metrics`, { headers }),
        fetch(`${API_URL}/api/users`, { headers }),
        fetch(`${API_URL}/api/seats`, { headers }),
        fetch(`${API_URL}/api/plans`)
      ]);

      if (metricRes.status === "fulfilled" && metricRes.value.ok) {
        setMetrics(await metricRes.value.json());
      } else { loadMockMetrics(); }

      if (userRes.status === "fulfilled" && userRes.value.ok) {
        setUsers(await userRes.value.json());
      } else { loadMockUsers(); }

      if (seatRes.status === "fulfilled" && seatRes.value.ok) {
        setSeats(await seatRes.value.json());
      } else { loadMockSeats(); }

      if (planRes.status === "fulfilled" && planRes.value.ok) {
        setPlans(await planRes.value.json());
      } else { loadMockPlans(); }

    } catch (err) {
      console.warn("Backend offline. Setting up local dashboard sandbox.");
      loadMockMetrics();
      loadMockUsers();
      loadMockSeats();
      loadMockPlans();
    }
  };

  const loadMockMetrics = () => {
    setMetrics({
      active_students: 42,
      occupied_seats: 12,
      available_seats: 8,
      monthly_revenue: 48000
    });
  };

  const loadMockUsers = () => {
    setUsers([
      { id: "u-1", full_name: "Aniket Sharma", email: "aniket@gmail.com", role: "Student", student_id: "student-1" },
      { id: "u-2", full_name: "Rahul Verma", email: "rahul@library.com", role: "Librarian", student_id: null },
      { id: "u-3", full_name: "Pooja Patel", email: "pooja@gmail.com", role: "Student", student_id: "student-2" },
      { id: "u-4", full_name: "System Administrator", email: "admin@shivnericlub.com", role: "Super Admin", student_id: null }
    ]);
  };

  const loadMockSeats = () => {
    setSeats([
      { id: "s-1", seat_number: "A1", floor: 1, hall_name: "Main Hall", assigned_student_id: null, is_active: true },
      { id: "s-2", seat_number: "A2", floor: 1, hall_name: "Main Hall", assigned_student_id: "u-1", is_active: true },
      { id: "s-3", seat_number: "A3", floor: 1, hall_name: "Main Hall", assigned_student_id: null, is_active: true },
      { id: "s-4", seat_number: "A4", floor: 1, hall_name: "Main Hall", assigned_student_id: "u-3", is_active: true }
    ]);
  };

  const loadMockPlans = () => {
    setPlans([
      { id: "p-1", name: "Premium Monthly", price: 1200, duration_days: 30, description: "AC Hall & Personal Locker" },
      { id: "p-2", name: "Daily Pass", price: 100, duration_days: 1, description: "AC Study Desk and high speed WiFi" }
    ]);
  };

  const handleRoleChange = async (userId, newRole) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/users/${userId}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ role_name: newRole })
      });
      if (res.ok) {
        setMessage(`Successfully changed user role to ${newRole}!`);
        fetchAdminData(token);
      } else {
        const err = await res.json();
        setMessage(`Role update failed: ${err.detail || "Invalid permission"}`);
      }
    } catch (e) {
      setMessage(`Demo: Role modified to "${newRole}" successfully.`);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm("Are you sure you want to delete this user account?")) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/users/${userId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        setMessage("User deleted successfully!");
        fetchAdminData(token);
      } else {
        const err = await res.json();
        setMessage(`Deletion failed: ${err.detail || "Error occurred"}`);
      }
    } catch (e) {
      setMessage("Demo: Account removed from visual console.");
      setUsers(prev => prev.filter(u => u.id !== userId));
    } finally {
      setActionLoading(false);
    }
  };

  const handleFetchStudentDetails = async (userObj) => {
    setSelectedStudent(userObj);
    setStudentSub(null);
    setStudentFees([]);

    if (!userObj.student_id) return;

    try {
      // Fetch Plan details
      const subRes = await fetch(`${API_URL}/api/subscriptions/${userObj.student_id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (subRes.ok) {
        const subData = await subRes.json();
        setStudentSub(subData);
      }

      // Fetch Ledger Invoices
      const feeRes = await fetch(`${API_URL}/api/fees/${userObj.student_id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (feeRes.ok) {
        const feeData = await feeRes.json();
        setStudentFees(feeData);
      }
    } catch (err) {
      console.warn("Failed fetching student billing profile.");
      // Fallback sandbox
      setStudentSub({
        plan_name: "Premium Monthly Pass",
        start_date: "2026-06-01T00:00:00",
        end_date: "2026-07-15T00:00:00",
        status: "active"
      });
      setStudentFees([
        { id: "f1", description: "Monthly Membership Dues", amount: 1200, due_date: "2026-07-05", status: "unpaid" }
      ]);
    }
  };

  const handleBroadcastNotice = async (e) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastContent) {
      setMessage("Please fill notice fields.");
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/users/broadcast`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          title: broadcastTitle,
          content: broadcastContent,
          send_email: sendEmail,
          send_sms: sendSms
        })
      });
      if (res.ok) {
        const data = await res.json();
        setMessage(`Success! Alert broadcasted to ${data.notified_emails?.length || 0} active users via Email/SMS.`);
        setBroadcastTitle("");
        setBroadcastContent("");
      } else {
        setMessage("Broadcast dispatch failed.");
      }
    } catch (err) {
      setMessage(`Demo Broadcast dispatched! Notice: "${broadcastTitle}" sent to all users.`);
      setBroadcastTitle("");
      setBroadcastContent("");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    if (!newPlan.name || !newPlan.price) {
      setMessage("Please enter plan details.");
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/plans`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(newPlan)
      });
      if (res.ok) {
        setMessage("Plan created successfully!");
        setNewPlan({ name: "", price: "", duration_days: 30, description: "" });
        fetchAdminData(token);
      } else {
        setMessage("Failed to create plan.");
      }
    } catch (e) {
      setMessage("Demo: New plan added successfully in sandbox!");
      const mockNew = { id: `p-${Date.now()}`, ...newPlan };
      setPlans(prev => [...prev, mockNew]);
      setNewPlan({ name: "", price: "", duration_days: 30, description: "" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!confirm("Are you sure you want to delete this plan?")) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/plans/${planId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setMessage("Plan deleted successfully!");
        fetchAdminData(token);
      } else {
        const err = await res.json();
        setMessage(`Deletion failed: ${err.detail || "Error occurred"}`);
      }
    } catch (e) {
      setMessage("Demo: Plan removed from console.");
      setPlans(prev => prev.filter(p => p.id !== planId));
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    router.push("/");
  };

  return (
    <div className="app-container" style={{ background: "var(--bg-primary)", minHeight: "100vh", display: "flex", flexDirection: "column", color: "#121316" }}>
      
      {/* Centered Luxury Header Capsule */}
      <header className="glass-header" style={{ width: "90%", maxWidth: "1000px", margin: "2rem auto 1rem", border: "1px solid rgba(0,0,0,0.03)" }}>
        <div className="brand-title" style={{ fontFamily: "var(--font-headings)", fontWeight: "400", letterSpacing: "2px", fontSize: "1.1rem" }}>
          SHIVNERI CONSOLE
        </div>
        <nav className="nav-links" style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          <span className={`nav-btn ${activeTab === "users" ? "active" : ""}`} onClick={() => setActiveTab("users")} style={{ fontSize: "0.75rem", letterSpacing: "1px", textTransform: "uppercase" }}>Users</span>
          <span className={`nav-btn ${activeTab === "map" ? "active" : ""}`} onClick={() => setActiveTab("map")} style={{ fontSize: "0.75rem", letterSpacing: "1px", textTransform: "uppercase" }}>🗺️ Actual Map</span>
          <span className={`nav-btn ${activeTab === "editor" ? "active" : ""}`} onClick={() => setActiveTab("editor")} style={{ fontSize: "0.75rem", letterSpacing: "1px", textTransform: "uppercase" }}>🛠️ Layout Builder</span>
          <span className={`nav-btn ${activeTab === "registrations" ? "active" : ""}`} onClick={() => setActiveTab("registrations")} style={{ fontSize: "0.75rem", letterSpacing: "1px", textTransform: "uppercase" }}>📋 Approvals</span>
          <Link href="/admin/whatsapp" className="nav-btn" style={{ fontSize: "0.75rem", letterSpacing: "1px", textTransform: "uppercase" }}>💬 WhatsApp Hub</Link>
          <span className={`nav-btn ${activeTab === "broadcast" ? "active" : ""}`} onClick={() => setActiveTab("broadcast")} style={{ fontSize: "0.75rem", letterSpacing: "1px", textTransform: "uppercase" }}>Broadcast</span>
          <span className={`nav-btn ${activeTab === "plans" ? "active" : ""}`} onClick={() => setActiveTab("plans")} style={{ fontSize: "0.75rem", letterSpacing: "1px", textTransform: "uppercase" }}>Plans</span>
          <span className="nav-btn" onClick={handleLogout} style={{ fontSize: "0.75rem", letterSpacing: "1px", textTransform: "uppercase" }}>Logout</span>
        </nav>
      </header>

      {/* Greeting Banner */}
      <section style={{ padding: "2rem", maxWidth: "1000px", margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", gap: "2.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "2rem", paddingBottom: "2rem", borderBottom: "1px solid #e8e6e0" }}>
          <div>
            <span style={{ fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--color-accent)", fontWeight: "600" }}>
              Administrator Console
            </span>
            <h1 style={{ fontSize: "3rem", margin: "0.5rem 0 0", fontFamily: "var(--font-headings)", fontWeight: "300", letterSpacing: "-0.02em" }}>
              System Dashboard
            </h1>
          </div>
        </div>

        {/* Analytics Cards */}
        {metrics && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "2rem", padding: "0 0.5rem" }}>
            <div>
              <span style={{ fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-secondary)" }}>Active Members</span>
              <div style={{ fontSize: "2rem", fontWeight: "300", marginTop: "0.4rem", fontFamily: "var(--font-headings)" }}>{metrics.active_students}</div>
            </div>
            <div>
              <span style={{ fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-secondary)" }}>Seats Occupied</span>
              <div style={{ fontSize: "2rem", fontWeight: "300", marginTop: "0.4rem", fontFamily: "var(--font-headings)", color: "var(--color-success)" }}>{metrics.occupied_seats}</div>
            </div>
            <div>
              <span style={{ fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-secondary)" }}>Available Desks</span>
              <div style={{ fontSize: "2rem", fontWeight: "300", marginTop: "0.4rem", fontFamily: "var(--font-headings)", color: "var(--color-accent)" }}>{metrics.available_seats}</div>
            </div>
            <div>
              <span style={{ fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-secondary)" }}>Est. Revenue</span>
              <div style={{ fontSize: "2rem", fontWeight: "300", marginTop: "0.4rem", fontFamily: "var(--font-headings)" }}>₹{metrics.monthly_revenue}</div>
            </div>
          </div>
        )}
      </section>

      {/* Main stacked sections */}
      <main style={{ padding: "0 2rem 4rem", maxWidth: "1000px", margin: "0 auto", width: "100%" }}>
        
        {/* Tab 1: User management and role configuration */}
        {activeTab === "users" && (
          <div style={{ background: "#ffffff", border: "1px solid #e8e6e0", borderRadius: "12px", padding: "2rem" }}>
            <h2 style={{ fontSize: "1.2rem", fontFamily: "var(--font-headings)", fontWeight: "400", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "0.5rem" }}>User Account Database</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "2rem" }}>Review member registrations, allocate roles, and view subscription details.</p>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {users.map(u => (
                <div key={u.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "1.2rem", borderBottom: "1px solid #f5f4f0" }}>
                  <div>
                    <div style={{ fontSize: "0.95rem", fontWeight: "600" }}>{u.full_name}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>{u.email}</div>
                  </div>
                  
                  <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                    
                    {/* Role Dropdown (Visible black text) */}
                    <select 
                      value={u.role} 
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      style={{ 
                        border: "0", 
                        borderBottom: "1px solid #e8e6e0", 
                        borderRadius: "0", 
                        padding: "0.3rem 0", 
                        background: "transparent",
                        fontSize: "0.85rem",
                        color: "#121316",
                        outline: "none",
                        cursor: "pointer"
                      }}
                    >
                      <option value="Student" style={{ color: "#121316" }}>Student</option>
                      <option value="Desk Staff" style={{ color: "#121316" }}>Desk Staff</option>
                      <option value="Librarian" style={{ color: "#121316" }}>Librarian</option>
                      <option value="Super Admin" style={{ color: "#121316" }}>Super Admin</option>
                    </select>

                    {/* View Info detail trigger (for student plans/invoices) */}
                    {u.student_id ? (
                      <button
                        onClick={() => handleFetchStudentDetails(u)}
                        disabled={actionLoading}
                        style={{
                          background: "transparent",
                          border: "1px solid #121316",
                          color: "#121316",
                          padding: "0.4rem 1rem",
                          fontSize: "0.7rem",
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          fontWeight: "700",
                          borderRadius: "6px",
                          cursor: actionLoading ? "not-allowed" : "pointer",
                          opacity: actionLoading ? 0.5 : 1
                        }}
                      >
                        Details
                      </button>
                    ) : (
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", minWidth: "70px", textAlign: "center" }}>Staff</span>
                    )}

                    {/* Delete Account button */}
                    <button 
                      onClick={() => handleDeleteUser(u.id)}
                      disabled={actionLoading}
                      style={{
                        background: "transparent",
                        border: "1px solid var(--color-danger)",
                        color: "var(--color-danger)",
                        padding: "0.4rem 1rem",
                        fontSize: "0.7rem",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        fontWeight: "700",
                        borderRadius: "6px",
                        cursor: actionLoading ? "not-allowed" : "pointer",
                        opacity: actionLoading ? 0.5 : 1
                      }}
                    >
                      {actionLoading ? "Wait..." : "Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab: Actual Library Map */}
        {activeTab === "map" && (
          <div style={{ background: "#ffffff", border: "1px solid #e8e6e0", borderRadius: "12px", padding: "1.5rem" }}>
            <InteractiveLibraryMap seats={seats} />
          </div>
        )}

        {/* Tab: Layout Builder */}
        {activeTab === "editor" && (
          <div style={{ background: "#ffffff", border: "1px solid #e8e6e0", borderRadius: "12px", padding: "1.5rem" }}>
            <AdminLayoutEditor 
              seats={seats} 
              onSaveLayout={async (updatedSeats) => {
                await fetch(`${API_URL}/api/seats/layout`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                  body: JSON.stringify(updatedSeats)
                });
                setSeats(updatedSeats);
              }}
            />
          </div>
        )}

        {/* Tab: Student Registration Approvals Queue */}
        {activeTab === "registrations" && (
          <div style={{ background: "#ffffff", border: "1px solid #e8e6e0", borderRadius: "12px", padding: "2rem" }}>
            <h2 style={{ fontSize: "1.2rem", fontFamily: "var(--font-headings)", fontWeight: "400", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "0.5rem" }}>📋 Student Self-Registration Approvals Queue</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>Review pending online student registrations, verify payment reference UTR, and trigger instant WhatsApp welcome setup.</p>

            <div style={{ border: "1px solid #e8e6e0", borderRadius: "8px", padding: "1.5rem", background: "#faf9f6" }}>
              <p style={{ fontSize: "0.85rem", color: "#666" }}>No pending registrations awaiting approval right now.</p>
            </div>
          </div>
        )}

        {/* Tab 2: Notice Broadcast Channel */}
        {activeTab === "broadcast" && (
          <div style={{ background: "#ffffff", border: "1px solid #e8e6e0", borderRadius: "12px", padding: "2.5rem" }}>
            <h2 style={{ fontSize: "1.2rem", fontFamily: "var(--font-headings)", fontWeight: "400", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "0.5rem" }}>Broadcast Notice Channel</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "2rem" }}>Dispatch announcement notices and alert emails directly to all registered library candidates.</p>
            
            <form onSubmit={handleBroadcastNotice} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: "0.3rem" }}>Announcement Title</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Library Schedule Revision for Exams"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
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

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: "0.3rem" }}>Message Content</label>
                <textarea 
                  placeholder="Type the message description to broadcast..."
                  value={broadcastContent}
                  onChange={(e) => setBroadcastContent(e.target.value)}
                  required
                  style={{ 
                    width: "100%", 
                    minHeight: "100px",
                    border: "0", 
                    borderBottom: "1px solid #e8e6e0", 
                    borderRadius: "0", 
                    padding: "0.5rem 0", 
                    background: "transparent",
                    fontSize: "0.9rem",
                    outline: "none",
                    resize: "none"
                  }}
                />
              </div>

              {/* Broadcast channels selectors */}
              <div style={{ display: "flex", gap: "2rem", marginTop: "0.5rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", cursor: "pointer" }}>
                  <input 
                    type="checkbox" 
                    checked={sendEmail} 
                    onChange={(e) => setSendEmail(e.target.checked)}
                  />
                  <span>Dispatch Email Notification</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", cursor: "pointer" }}>
                  <input 
                    type="checkbox" 
                    checked={sendSms} 
                    onChange={(e) => setSendSms(e.target.checked)}
                  />
                  <span>Dispatch SMS Notification</span>
                </label>
              </div>

              <button 
                type="submit"
                disabled={actionLoading}
                style={{
                  background: actionLoading ? "#888" : "#121316",
                  border: "1px solid #121316",
                  color: "#fff",
                  padding: "0.75rem 2rem",
                  fontSize: "0.75rem",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  fontWeight: "700",
                  borderRadius: "8px",
                  cursor: actionLoading ? "not-allowed" : "pointer",
                  width: "fit-content",
                  alignSelf: "flex-start",
                  marginTop: "1rem",
                  opacity: actionLoading ? 0.6 : 1
                }}
              >
                {actionLoading ? "Sending..." : "Send Broadcast Alerts"}
              </button>
            </form>
          </div>
        )}

        {/* Tab 3: Seat configuration */}
        {activeTab === "seats" && (
          <div style={{ background: "#ffffff", border: "1px solid #e8e6e0", borderRadius: "12px", padding: "2rem" }}>
            <h2 style={{ fontSize: "1.2rem", fontFamily: "var(--font-headings)", fontWeight: "400", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "0.5rem" }}>Study Desks Directory</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "2rem" }}>View real-time physical seat layout assignments.</p>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {seats.map(s => (
                <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "1rem", borderBottom: "1px solid #f5f4f0" }}>
                  <div>
                    <div style={{ fontSize: "0.95rem", fontWeight: "600" }}>Desk {s.seat_number}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>Floor {s.floor} | {s.hall_name}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                    <span style={{ fontSize: "0.8rem", color: s.assigned_student_id ? "var(--text-primary)" : "var(--text-muted)" }}>
                      {s.assigned_student_id ? `Assigned Student` : "Vacant"}
                    </span>
                    <span 
                      style={{ 
                        fontSize: "0.7rem", 
                        textTransform: "uppercase", 
                        letterSpacing: "0.5px", 
                        fontWeight: "700",
                        color: s.assigned_student_id ? "#ef4444" : "var(--color-success)"
                      }}
                    >
                      {s.assigned_student_id ? "Occupied" : "Available"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Plan configuration */}
        {activeTab === "plans" && (
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "2.5rem", alignItems: "start" }}>
            
            {/* List of plans */}
            <div style={{ background: "#ffffff", border: "1px solid #e8e6e0", borderRadius: "12px", padding: "2rem" }}>
              <h2 style={{ fontSize: "1.2rem", fontFamily: "var(--font-headings)", fontWeight: "400", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "1.5rem" }}>Membership Subscriptions</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
                {plans.map(p => (
                  <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f5f4f0", paddingBottom: "1rem" }}>
                    <div>
                      <h3 style={{ fontSize: "1rem", fontWeight: "600" }}>{p.name}</h3>
                      <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>{p.description || "No description"}</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                      <div style={{ textAlign: "right" }}>
                        <strong style={{ fontSize: "1.2rem", fontWeight: "300", fontFamily: "var(--font-headings)", color: "var(--color-accent)" }}>{p.price}</strong>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>{p.duration_days} days</div>
                      </div>
                      <button
                        onClick={() => handleDeletePlan(p.id)}
                        disabled={actionLoading}
                        style={{
                          background: "transparent",
                          border: "1px solid var(--color-danger)",
                          color: "var(--color-danger)",
                          padding: "0.35rem 0.8rem",
                          fontSize: "0.65rem",
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          fontWeight: "700",
                          borderRadius: "6px",
                          cursor: actionLoading ? "not-allowed" : "pointer",
                          opacity: actionLoading ? 0.5 : 1
                        }}
                      >
                        {actionLoading ? "Wait..." : "Delete"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Create Plan form */}
            <div style={{ background: "#ffffff", border: "1px solid #e8e6e0", borderRadius: "12px", padding: "2rem" }}>
              <h2 style={{ fontSize: "1.2rem", fontFamily: "var(--font-headings)", fontWeight: "400", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "1.5rem" }}>Launch Subscription Plan</h2>
              <form onSubmit={handleCreatePlan} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: "0.3rem" }}>Plan Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Premium Monthly Plan"
                    value={newPlan.name}
                    onChange={(e) => setNewPlan(prev => ({ ...prev, name: e.target.value }))}
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
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: "0.3rem" }}>Price (INR)</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 1500"
                    value={newPlan.price}
                    onChange={(e) => setNewPlan(prev => ({ ...prev, price: e.target.value }))}
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
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: "0.3rem" }}>Duration (Days)</label>
                  <input 
                    type="number" 
                    value={newPlan.duration_days}
                    onChange={(e) => setNewPlan(prev => ({ ...prev, duration_days: e.target.value }))}
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
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: "0.3rem" }}>Description / Benefits</label>
                  <input 
                    type="text" 
                    placeholder="e.g. WiFi, AC, locker included"
                    value={newPlan.description}
                    onChange={(e) => setNewPlan(prev => ({ ...prev, description: e.target.value }))}
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
                  disabled={actionLoading}
                  style={{
                    background: actionLoading ? "#888" : "#121316",
                    border: "1px solid #121316",
                    color: "#fff",
                    padding: "0.75rem",
                    fontSize: "0.75rem",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    fontWeight: "700",
                    borderRadius: "6px",
                    width: "100%",
                    marginTop: "0.5rem",
                    cursor: actionLoading ? "not-allowed" : "pointer",
                    opacity: actionLoading ? 0.6 : 1
                  }}
                >
                  {actionLoading ? "Creating..." : "Create Plan"}
                </button>
              </form>
            </div>
          </div>
        )}

      </main>

      {/* MODAL: Student Profile Details Drawer (Plan & Outstanding Dues) */}
      {selectedStudent && (
        <div className="modal-overlay" onClick={() => setSelectedStudent(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "560px", padding: "2.5rem", border: "1px solid #e8e6e0", background: "#fff", borderRadius: "12px" }}>
            
            {/* Header info */}
            <div style={{ borderBottom: "1px solid #e8e6e0", paddingBottom: "1.2rem", marginBottom: "1.5rem" }}>
              <span style={{ fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--color-accent)", fontWeight: "700" }}>Student Profile</span>
              <h3 style={{ fontSize: "1.8rem", margin: "0.2rem 0", fontFamily: "var(--font-headings)", fontWeight: "300" }}>{selectedStudent.full_name}</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Email: {selectedStudent.email} | Contact: +91 {selectedStudent.phone || "N/A"}</p>
            </div>

            {/* Active Subscription Details */}
            <div style={{ marginBottom: "1.5rem" }}>
              <span style={{ fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: "700", display: "block", marginBottom: "0.75rem" }}>Active Membership Pass</span>
              {studentSub ? (
                <div style={{ padding: "1rem", border: "1px solid #e8e6e0", borderRadius: "8px", background: "rgba(0,0,0,0.01)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong style={{ fontSize: "1rem" }}>{studentSub.plan_name}</strong>
                    <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--color-success)", fontWeight: "700" }}>{studentSub.status}</span>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.5rem" }}>
                    Renew / Expiry date: <strong>{new Date(studentSub.end_date).toLocaleDateString()}</strong>
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontStyle: "italic" }}>No active subscription plan recorded.</p>
              )}
            </div>

            {/* Outstanding Ledgers Dues */}
            <div style={{ marginBottom: "2rem" }}>
              <span style={{ fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: "700", display: "block", marginBottom: "0.75rem" }}>Outstanding Invoices</span>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                {studentFees.length === 0 ? (
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontStyle: "italic" }}>All invoices fully settled.</p>
                ) : (
                  studentFees.map(f => (
                    <div key={f.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "0.6rem", borderBottom: "1px solid #f5f4f0" }}>
                      <div>
                        <span style={{ fontSize: "0.85rem", fontWeight: "600" }}>{f.description}</span>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>Due {new Date(f.due_date).toLocaleDateString()}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <span style={{ fontSize: "0.9rem", fontWeight: "700" }}>₹{f.amount}</span>
                        <span style={{ fontSize: "0.7rem", textTransform: "uppercase", fontWeight: "700", color: f.status === "paid" ? "var(--color-success)" : "var(--color-accent)" }}>{f.status}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Close button */}
            <button 
              className="btn" 
              onClick={() => setSelectedStudent(null)}
              style={{
                width: "100%",
                background: "#121316",
                border: "1px solid #121316",
                color: "#fff",
                padding: "0.7rem",
                fontSize: "0.75rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                fontWeight: "700",
                borderRadius: "6px",
                cursor: "pointer"
              }}
            >
              Close Details
            </button>
          </div>
        </div>
      )}

      {/* Pop up alerts */}
      {message && (
        <div className="modal-overlay" onClick={() => setMessage("")}>
          <div className="modal-content" style={{ maxWidth: "360px", textAlign: "center", padding: "2rem", border: "1px solid #e8e6e0", background: "#fff", borderRadius: "12px" }}>
            <p style={{ fontSize: "0.95rem", fontWeight: "600", marginBottom: "1.5rem", lineHeight: "1.5" }}>{message}</p>
            <button 
              className="btn" 
              onClick={() => setMessage("")}
              style={{
                width: "100%",
                background: "#121316",
                border: "1px solid #121316",
                color: "#fff",
                padding: "0.6rem 2rem",
                fontSize: "0.75rem",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                fontWeight: "700",
                borderRadius: "6px"
              }}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{ marginTop: "auto", borderTop: "1px solid #e8e6e0", padding: "2.5rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.8rem", background: "#ffffff" }}>
        © 2026 Shivneri Library Console. Crafted with 3D Mappings & Editorial Fine-Art.
      </footer>
    </div>
  );
}
