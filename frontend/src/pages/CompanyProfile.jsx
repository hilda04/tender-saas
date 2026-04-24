import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar";
import TagInput from "../components/TagInput";
import api from "../lib/api";

const SECTORS = [
  "Construction","Civil Engineering","IT & Technology","Consulting","Healthcare",
  "Agriculture","Education","Transport & Logistics","Security","Cleaning & Facility Management",
  "Electrical","Plumbing & Mechanical","Catering & Hospitality","Printing & Publishing","Other"
];

export default function CompanyProfile({ signOut }) {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [companyId, setCompanyId] = useState(null);
  const [form, setForm] = useState({
    companyName: "", registrationNumber: "", address: "", city: "",
    phone: "", email: "", website: "", directors: [],
    yearsExperience: "", sectors: [], certifications: [],
    taxNumber: "", pastProjects: [],
  });

  useEffect(() => {
    api.get("/companies").then(r => {
      if (r.data) {
        setForm({ ...r.data });
        setCompanyId(r.data.companyId);
      }
    }).catch(() => {});
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = companyId ? `/companies/${companyId}` : "/companies";
      const method = companyId ? "put" : "post";
      const res = await api[method](url, form);
      if (!companyId) setCompanyId(res.data.companyId);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert(err.response?.data?.error || "Save failed");
    }
    setSaving(false);
  };

  return (
    <div className="layout">
      <NavBar signOut={signOut} />
      <div className="container">
        <h1>Company profile</h1>
        <p style={{ color: "#888", marginBottom: "1.5rem" }}>This information will be used in every tender response you generate.</p>

        {saved && <div className="alert alert-success">Profile saved successfully.</div>}

        <form onSubmit={handleSubmit}>
          <div className="card">
            <h2>Basic information</h2>
            <div className="grid-2">
              <div className="form-group">
                <label>Company name *</label>
                <input required value={form.companyName} onChange={e => set("companyName", e.target.value)} placeholder="Acme Construction (Pvt) Ltd" />
              </div>
              <div className="form-group">
                <label>Registration number</label>
                <input value={form.registrationNumber} onChange={e => set("registrationNumber", e.target.value)} placeholder="1234/2018" />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label>Physical address</label>
                <input value={form.address} onChange={e => set("address", e.target.value)} placeholder="123 Samora Machel Ave" />
              </div>
              <div className="form-group">
                <label>City</label>
                <input value={form.city} onChange={e => set("city", e.target.value)} placeholder="Harare" />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label>Phone</label>
                <input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+263 77 123 4567" />
              </div>
              <div className="form-group">
                <label>Company email</label>
                <input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="info@acme.co.zw" />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label>Website</label>
                <input value={form.website} onChange={e => set("website", e.target.value)} placeholder="www.acme.co.zw" />
              </div>
              <div className="form-group">
                <label>ZIMRA tax number (BP number)</label>
                <input value={form.taxNumber} onChange={e => set("taxNumber", e.target.value)} placeholder="2000123456" />
              </div>
            </div>
          </div>

          <div className="card">
            <h2>Company background</h2>
            <div className="grid-2">
              <div className="form-group">
                <label>Years in operation</label>
                <input type="number" value={form.yearsExperience} onChange={e => set("yearsExperience", e.target.value)} placeholder="8" />
              </div>
              <div className="form-group">
                <label>Sector(s)</label>
                <select onChange={e => { const v = e.target.value; if (v && !form.sectors.includes(v)) set("sectors", [...form.sectors, v]); }}>
                  <option value="">Add a sector...</option>
                  {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <div style={{ marginTop: 8 }}>
                  <TagInput value={form.sectors} onChange={v => set("sectors", v)} placeholder="" />
                </div>
              </div>
            </div>
            <div className="form-group">
              <label>Directors / Key personnel (press Enter after each name)</label>
              <TagInput value={form.directors} onChange={v => set("directors", v)} placeholder="Full name and role..." />
            </div>
            <div className="form-group">
              <label>Certifications & registrations (press Enter after each)</label>
              <TagInput value={form.certifications} onChange={v => set("certifications", v)} placeholder="e.g. ISO 9001, IDBZ registered, NEC registered..." />
            </div>
          </div>

          <div className="card">
            <h2>Past projects</h2>
            <p style={{ color: "#888", fontSize: "0.88rem", marginBottom: "1rem" }}>Add your most relevant past projects. These strengthen your tender responses significantly.</p>
            {(form.pastProjects || []).map((p, i) => (
              <div key={i} style={{ background: "#f7f8fc", padding: "1rem", borderRadius: 8, marginBottom: "0.75rem" }}>
                <div className="grid-2">
                  <div className="form-group">
                    <label>Project name</label>
                    <input value={p.name || ""} onChange={e => {
                      const ps = [...form.pastProjects]; ps[i] = { ...ps[i], name: e.target.value }; set("pastProjects", ps);
                    }} />
                  </div>
                  <div className="form-group">
                    <label>Client / Authority</label>
                    <input value={p.client || ""} onChange={e => {
                      const ps = [...form.pastProjects]; ps[i] = { ...ps[i], client: e.target.value }; set("pastProjects", ps);
                    }} />
                  </div>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label>Contract value (USD)</label>
                    <input value={p.value || ""} onChange={e => {
                      const ps = [...form.pastProjects]; ps[i] = { ...ps[i], value: e.target.value }; set("pastProjects", ps);
                    }} placeholder="e.g. $250,000" />
                  </div>
                  <div className="form-group">
                    <label>Year completed</label>
                    <input value={p.year || ""} onChange={e => {
                      const ps = [...form.pastProjects]; ps[i] = { ...ps[i], year: e.target.value }; set("pastProjects", ps);
                    }} placeholder="2023" />
                  </div>
                </div>
                <button type="button" className="btn btn-danger" style={{ padding: "4px 12px", fontSize: "0.82rem" }}
                  onClick={() => set("pastProjects", form.pastProjects.filter((_, j) => j !== i))}>
                  Remove
                </button>
              </div>
            ))}
            <button type="button" className="btn btn-secondary"
              onClick={() => set("pastProjects", [...(form.pastProjects || []), { name: "", client: "", value: "", year: "" }])}>
              + Add project
            </button>
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving} style={{ width: "100%", justifyContent: "center", padding: "12px" }}>
            {saving ? <><span className="spinner" /> Saving...</> : "Save company profile"}
          </button>
        </form>
      </div>
    </div>
  );
}
