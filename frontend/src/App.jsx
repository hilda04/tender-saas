import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import "./lib/amplify";
import Dashboard from "./pages/Dashboard";
import CompanyProfile from "./pages/CompanyProfile";
import NewTender from "./pages/NewTender";
import Pricing from "./pages/Pricing";
import "./App.css";

export default function App() {
  return (
    <BrowserRouter>
      <Authenticator
        signUpAttributes={["email"]}
        components={{
          Header: () => (
            <div style={{ textAlign: "center", padding: "2rem 0 1rem" }}>
              <h1 style={{ fontSize: "1.8rem", fontWeight: 700, color: "#1a1a2e" }}>ZimTender</h1>
              <p style={{ color: "#555", marginTop: 4 }}>AI-powered tender response assistant</p>
            </div>
          ),
        }}
      >
        {({ signOut, user }) => (
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard user={user} signOut={signOut} />} />
            <Route path="/company" element={<CompanyProfile user={user} signOut={signOut} />} />
            <Route path="/tenders/new" element={<NewTender user={user} signOut={signOut} />} />
            <Route path="/pricing" element={<Pricing user={user} signOut={signOut} />} />
          </Routes>
        )}
      </Authenticator>
    </BrowserRouter>
  );
}
