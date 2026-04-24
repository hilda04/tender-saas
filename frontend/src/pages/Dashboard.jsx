import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import NavBar from "../components/NavBar";
import api from "../lib/api";

export default function Dashboard({ signOut }) {
  const [user, setUser] = useState(null);
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(null);
  const [company, setCompany] = useState(null);
  const [searchParams] = useSearchParams();
  const justSubscribed = searchParams.get("subscribed") === "true";

  useEffect(() => {
    Promise.all([
      api.get("/users/me").then(r => setUser(r.data)),
      api.get("/tenders").then(r => setTenders(r.data.tenders || [])),
      api.get("/companies").then(r => setCompany(r.data)),
    ]).finally(() => setLoading(false));
  }, []);

  const handleGenerate = async (tender) => {
    if (!company) return alert("Please set up your company profile first.");
    setGenerating(tender.tenderId);
    try {
      await api.post("/generate", { tenderId: tender.tenderId, companyId: company.companyId });
      const updated = await api.get("/tenders");
      setTenders(updated.data.tenders || []);
    } catch (e) {
      const msg = e.response?.data?.error || "Generation failed. Please try again.";
      if (msg.includes("subscribe")) {
        if (window.confirm("You've used your free generations. Subscribe for $39/month?")) {
          const res = await api.post("/billing/checkout");
          window.location.href = res.data.url;
        }
      } else {
        alert(msg);
      }
    }
    setGenerating(null);
  };

  const handleDownload = async (tenderId) => {
    try {
      const res = await api.get(`/tenders/${tenderId}/download`);
      window.open(res.data.url, "_blank");
    } catch {
      alert("Download failed. Please try again.");
    }
  };

  const handleSubscribe = async () => {
    const res = await api.post("/billing/checkout");
    window.location.href = res.data.url;
  };

  if (loading) return <div className="layout"><NavBar signOut={signOut} /><div className="container"><p>Loading...</p></div></div>;

  const isActive = user?.subscriptionStatus === "active";
  const freesLeft = Math.max(0, (user?.freeGenerationsLimit || 2) - (user?.freeGenerationsUsed || 0));

  return (
    <div className="layout">
      <NavBar signOut={signOut} />
      <div className="container">

        {justSubscribed && (
          <div className="alert alert-success">Welcome! Your subscription is active. Generate unlimited tender responses.</div>
        )}

        {!isActive && (
          <div className="alert alert-info" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>
              You have <strong>{freesLeft} free generation{freesLeft !== 1 ? "s" : ""}</strong> remaining.
              Subscribe for unlimited access.
            </span>
            <button className="btn btn-primary" style={{ marginLeft: "1rem" }} onClick={handleSubscribe}>
              Subscribe $39/mo
            </button>
          </div>
        )}

        {!company && (
          <div className="alert alert-error" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Complete your company profile before generating tender responses.</span>
            <Link to="/company" className="btn btn-primary" style={{ marginLeft: "1rem" }}>Set up profile</Link>
          </div>
        )}

        <div className="grid-2" style={{ marginBottom: "1.5rem" }}>
          <div className="stat-card">
            <div className="value">{tenders.length}</div>
            <div className="label">Tenders created</div>
          </div>
          <div className="stat-card">
            <div className="value">{tenders.filter(t => t.status === "completed").length}</div>
            <div className="label">Responses generated</div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={{ margin: 0 }}>Your tenders</h2>
          <Link to="/tenders/new" className="btn btn-primary">+ New tender</Link>
        </div>

        {tenders.length === 0 ? (
          <div className="empty-state">
            <h3>No tenders yet</h3>
            <p>Create your first tender to generate a professional response.</p>
            <Link to="/tenders/new" className="btn btn-primary" style={{ marginTop: "1rem" }}>Create tender</Link>
          </div>
        ) : (
          tenders.map((t) => (
            <div key={t.tenderId} className="tender-row">
              <div className="tender-row-info">
                <h3>{t.tenderTitle}</h3>
                <p>{t.issuingAuthority} · {t.tenderNumber || "No ref"} · <span className={`badge badge-${t.status}`}>{t.status}</span></p>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {t.status === "completed" ? (
                  <button className="btn btn-success" onClick={() => handleDownload(t.tenderId)}>
                    Download .docx
                  </button>
                ) : (
                  <button
                    className="btn btn-primary"
                    onClick={() => handleGenerate(t)}
                    disabled={generating === t.tenderId || !company}
                  >
                    {generating === t.tenderId ? <><span className="spinner" /> Generating...</> : "Generate response"}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
