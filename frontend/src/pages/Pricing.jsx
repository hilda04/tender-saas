import React, { useState, useEffect } from "react";
import NavBar from "../components/NavBar";
import api from "../lib/api";

export default function Pricing({ signOut }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/users/me").then(r => setUser(r.data)).catch(() => {});
  }, []);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const res = await api.post("/billing/checkout");
      window.location.href = res.data.url;
    } catch {
      alert("Failed to start checkout. Please try again.");
      setLoading(false);
    }
  };

  const isActive = user?.subscriptionStatus === "active";

  return (
    <div className="layout">
      <NavBar signOut={signOut} />
      <div className="container" style={{ maxWidth: 640 }}>
        <h1 style={{ textAlign: "center", marginBottom: "0.5rem" }}>Simple pricing</h1>
        <p style={{ textAlign: "center", color: "#888", marginBottom: "2rem" }}>One plan. Unlimited tender responses.</p>

        <div className="card" style={{ border: "2px solid #4f46e5", position: "relative" }}>
          <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", background: "#4f46e5", color: "white", padding: "4px 16px", borderRadius: 20, fontSize: "0.82rem", fontWeight: 600 }}>
            Most popular
          </div>
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <div style={{ fontSize: "2.8rem", fontWeight: 700, color: "#4f46e5" }}>$39</div>
            <div style={{ color: "#888" }}>per month, cancel anytime</div>
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: "1.5rem 0" }}>
            {[
              "Unlimited tender response generation",
              "AI trained on Zimbabwean procurement formats",
              "Download as fully formatted .docx",
              "Covers GPPA, ZINARA, ZPC, City Council tenders",
              "Company profile saved — one setup, use forever",
              "All sections: cover letter, methodology, compliance, declaration",
              "Cancel anytime, no contracts",
            ].map(f => (
              <li key={f} style={{ padding: "8px 0", display: "flex", gap: 10, alignItems: "flex-start", borderBottom: "1px solid #f0f0f0", fontSize: "0.95rem" }}>
                <span style={{ color: "#0f6e56", fontWeight: 700, marginTop: 2 }}>✓</span>
                {f}
              </li>
            ))}
          </ul>

          {isActive ? (
            <div className="alert alert-success" style={{ textAlign: "center" }}>
              Your subscription is active. Enjoy unlimited generations!
            </div>
          ) : (
            <button className="btn btn-primary" onClick={handleSubscribe} disabled={loading}
              style={{ width: "100%", justifyContent: "center", padding: "14px", fontSize: "1rem" }}>
              {loading ? <><span className="spinner" /> Redirecting to checkout...</> : "Subscribe — $39/month"}
            </button>
          )}
          <p style={{ textAlign: "center", color: "#aaa", fontSize: "0.8rem", marginTop: "1rem" }}>
            Secure payment via Stripe. Cancel anytime from your account.
          </p>
        </div>

        <div className="card" style={{ background: "#f7f8fc" }}>
          <h2>Free tier included</h2>
          <p style={{ color: "#555" }}>Every account gets <strong>2 free tender responses</strong> to try the product before committing. No credit card required to start.</p>
        </div>

        <div className="card">
          <h2>Frequently asked questions</h2>
          {[
            ["What types of tenders does it support?", "Government (GPPA-compliant), parastatal (ZINARA, ZPC, ZETDC, NRZ), municipal (City of Harare, Bulawayo City Council), and private corporate tenders."],
            ["Is the output ready to submit?", "The .docx output is a strong first draft with all required sections. You should review, add any specific technical specs or pricing schedules, and print on company letterhead."],
            ["How long does generation take?", "Usually 30–60 seconds. You can download the .docx immediately after."],
            ["Can I edit the generated document?", "Yes. It downloads as a standard Word (.docx) file you can edit in Microsoft Word or Google Docs."],
          ].map(([q, a]) => (
            <div key={q} style={{ marginBottom: "1.2rem", borderBottom: "1px solid #f0f0f0", paddingBottom: "1.2rem" }}>
              <h3 style={{ marginBottom: "0.4rem" }}>{q}</h3>
              <p style={{ color: "#555", fontSize: "0.9rem" }}>{a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
