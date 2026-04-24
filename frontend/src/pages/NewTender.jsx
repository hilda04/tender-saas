import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar";
import TagInput from "../components/TagInput";
import api from "../lib/api";

export default function NewTender({ signOut }) {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    tenderTitle: "", tenderNumber: "", issuingAuthority: "", closingDate: "",
    description: "", requirements: [], evaluationCriteria: [],
    budgetRange: "", deliverables: [], submissionFormat: "",
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/tenders", form);
      navigate("/dashboard");
    } catch (err) {
      alert(err.response?.data?.error || "Failed to save tender");
      setSaving(false);
    }
  };

  return (
    <div className="layout">
      <NavBar signOut={signOut} />
      <div className="container">
        <h1>New tender</h1>
        <p style={{ color: "#888", marginBottom: "1.5rem" }}>Enter the details from the tender document. The more detail you provide, the stronger the AI-generated response.</p>

        <form onSubmit={handleSubmit}>
          <div className="card">
            <h2>Tender identification</h2>
            <div className="grid-2">
              <div className="form-group">
                <label>Tender title *</label>
                <input required value={form.tenderTitle} onChange={e => set("tenderTitle", e.target.value)}
                  placeholder="Supply and Delivery of Office Furniture" />
              </div>
              <div className="form-group">
                <label>Tender / Reference number</label>
                <input value={form.tenderNumber} onChange={e => set("tenderNumber", e.target.value)}
                  placeholder="MOF/PROC/2024/089" />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label>Issuing authority / Client *</label>
                <input required value={form.issuingAuthority} onChange={e => set("issuingAuthority", e.target.value)}
                  placeholder="Ministry of Finance, City of Harare, ZPC..." />
              </div>
              <div className="form-group">
                <label>Closing date</label>
                <input type="date" value={form.closingDate} onChange={e => set("closingDate", e.target.value)} />
              </div>
            </div>
          </div>

          <div className="card">
            <h2>Scope of work</h2>
            <div className="form-group">
              <label>Description of work required</label>
              <textarea value={form.description} onChange={e => set("description", e.target.value)}
                placeholder="Describe what the tender is asking for. You can paste directly from the tender document..." rows={6} />
            </div>
            <div className="form-group">
              <label>Specific requirements (press Enter after each)</label>
              <TagInput value={form.requirements} onChange={v => set("requirements", v)}
                placeholder="e.g. Must be ZIMRA registered, Delivery within 14 days..." />
            </div>
            <div className="form-group">
              <label>Deliverables (press Enter after each)</label>
              <TagInput value={form.deliverables} onChange={v => set("deliverables", v)}
                placeholder="e.g. 50 office chairs, 20 desks, Installation..." />
            </div>
          </div>

          <div className="card">
            <h2>Evaluation & submission</h2>
            <div className="form-group">
              <label>Evaluation criteria (press Enter after each)</label>
              <TagInput value={form.evaluationCriteria} onChange={v => set("evaluationCriteria", v)}
                placeholder="e.g. Price 60%, Experience 30%, BBBEE 10%..." />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label>Budget range / Contract value</label>
                <input value={form.budgetRange} onChange={e => set("budgetRange", e.target.value)}
                  placeholder="USD $50,000 – $80,000" />
              </div>
              <div className="form-group">
                <label>Submission format</label>
                <select value={form.submissionFormat} onChange={e => set("submissionFormat", e.target.value)}>
                  <option value="">Select format</option>
                  <option value="hard_copy">Hard copy only</option>
                  <option value="electronic">Electronic submission</option>
                  <option value="both">Both hard copy and electronic</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "1rem" }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate("/dashboard")} style={{ flex: 1, justifyContent: "center" }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ flex: 2, justifyContent: "center", padding: "12px" }}>
              {saving ? <><span className="spinner" /> Saving...</> : "Save tender"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
