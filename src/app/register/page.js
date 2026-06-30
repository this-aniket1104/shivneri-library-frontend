"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import API_URL from "@/lib/api";

export default function Register() {
  const router = useRouter();
  
  // Form fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  
  // OTP states
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpMessage, setOtpMessage] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Handler to simulate sending OTP
  const handleSendOTP = () => {
    if (phone.length !== 10) {
      setOtpMessage("Please enter a valid 10-digit mobile number (no country code or symbols).");
      return;
    }
    setOtpSent(true);
    setOtpMessage("DEMO: Verification SMS sent. Enter code '1234' to verify.");
  };

  // Handler to verify OTP code
  const handleVerifyOTP = () => {
    if (otpCode === "1234") {
      setOtpVerified(true);
      setOtpMessage("Phone number verified successfully! ✓");
    } else {
      setOtpMessage("Invalid verification code. Enter '1234' for demo bypass.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName || !email || !password || !phone) {
      setMessage("Please fill in all fields.");
      return;
    }
    if (phone.length !== 10) {
      setMessage("Phone number must be exactly 10 digits without country code or symbols.");
      return;
    }
    if (!otpVerified) {
      setMessage("Please verify your phone number using the OTP code first.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      // Mock/Demo backend registration call
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          phone: phone
        })
      });

      if (res.ok) {
        setMessage("Account created successfully! Redirecting to login...");
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      } else {
        const err = await res.json();
        let errorMsg = "Registration failed. Try a different email.";
        if (err && err.detail) {
          if (typeof err.detail === "string") {
            errorMsg = err.detail;
          } else if (Array.isArray(err.detail)) {
            errorMsg = err.detail.map(d => {
              const field = d.loc && d.loc[d.loc.length - 1];
              const fieldName = field ? field.charAt(0).toUpperCase() + field.slice(1).replace("_", " ") : "";
              return fieldName ? `${fieldName}: ${d.msg}` : d.msg;
            }).join(", ");
          }
        }
        setMessage(errorMsg);
      }
    } catch (err) {
      console.warn("Backend offline. Simulating registration success.");
      setMessage("Demo Mode: Registration successful! Redirecting to login...");
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-primary)" }}>
      
      {/* Floating Pill Header */}
      <header className="glass-header" style={{ width: "90%", maxWidth: "1100px", margin: "1.5rem auto 1rem" }}>
        <div className="brand-title">🛡️ SHIVNERI LIBRARY</div>
        <Link href="/" className="nav-btn">Home</Link>
      </header>

      {/* Centered Registration Box */}
      <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", padding: "2rem" }}>
        <div className="glass-card" style={{ width: "100%", maxWidth: "460px", padding: "2.5rem 2rem", border: "1px solid var(--border-color)", background: "#ffffff" }}>
          
          <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "2.2rem", marginBottom: "0.5rem", fontFamily: "var(--font-headings)" }}>Create Account</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Register your silent study package today</p>
          </div>

          {message && (
            <div style={{
              background: message.includes("successful") ? "var(--color-accent-glow)" : "rgba(239, 68, 68, 0.05)",
              color: message.includes("successful") ? "var(--color-accent)" : "var(--color-danger)",
              border: `1px solid ${message.includes("successful") ? "rgba(224, 83, 0, 0.2)" : "rgba(239, 68, 68, 0.2)"}`,
              padding: "0.75rem 1rem",
              borderRadius: "8px",
              marginBottom: "1.5rem",
              fontSize: "0.85rem",
              textAlign: "center",
              fontWeight: "600"
            }}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
            
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="Rahul Kumar"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="name@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Phone & OTP Column */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Phone Number</label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/[^0-9]/g, "");
                    setPhone(cleaned.slice(0, 10));
                  }}
                  disabled={otpVerified}
                  required
                />
                {!otpVerified && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ fontSize: "0.75rem", padding: "0 1rem", minWidth: "100px", whiteSpace: "nowrap" }}
                    onClick={handleSendOTP}
                  >
                    {otpSent ? "Resend" : "Send OTP"}
                  </button>
                )}
              </div>
            </div>

            {/* Simulated OTP verification module */}
            {otpSent && !otpVerified && (
              <div style={{
                background: "rgba(0,0,0,0.015)",
                border: "1px dashed var(--border-color)",
                padding: "1rem",
                borderRadius: "8px",
                display: "flex",
                flexDirection: "column",
                gap: "0.6rem"
              }}>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: "600" }}>
                  {otpMessage}
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter code"
                    maxLength={4}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn"
                    style={{ fontSize: "0.8rem", padding: "0 1rem" }}
                    onClick={handleVerifyOTP}
                  >
                    Verify
                  </button>
                </div>
              </div>
            )}

            {/* Success OTP tag */}
            {otpVerified && (
              <div style={{ fontSize: "0.8rem", color: "var(--color-success)", fontWeight: "700", textAlign: "left" }}>
                {otpMessage}
              </div>
            )}

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Create Password (min. 8 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>

            <button
              type="submit"
              className="btn"
              style={{
                width: "100%",
                marginTop: "0.5rem",
                opacity: otpVerified ? 1 : 0.6,
                cursor: otpVerified ? "pointer" : "not-allowed"
              }}
              disabled={loading || !otpVerified}
            >
              {loading ? "Creating Account..." : "Register Now"}
            </button>
          </form>

          {/* Login redirection */}
          <div style={{ textAlign: "center", marginTop: "1.5rem", paddingTop: "1.2rem", borderTop: "1px solid var(--border-color)", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "var(--color-accent)", fontWeight: "700" }}>
              Log In
            </Link>
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
        © 2026 Shivneri Library Management System.
      </footer>

    </div>
  );
}
