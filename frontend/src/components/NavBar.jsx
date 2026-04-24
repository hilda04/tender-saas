import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function NavBar({ signOut }) {
  const loc = useLocation();
  const link = (to, label) => (
    <Link to={to} style={{ fontWeight: loc.pathname === to ? "600" : "normal", color: loc.pathname === to ? "white" : "rgba(255,255,255,0.7)" }}>
      {label}
    </Link>
  );

  return (
    <nav>
      <Link to="/dashboard" className="brand">ZimTender</Link>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        {link("/dashboard", "Dashboard")}
        {link("/company", "Company")}
        {link("/tenders/new", "+ New Tender")}
        {link("/pricing", "Pricing")}
        <button className="signout" onClick={signOut} style={{ marginLeft: "1rem" }}>Sign out</button>
      </div>
    </nav>
  );
}
