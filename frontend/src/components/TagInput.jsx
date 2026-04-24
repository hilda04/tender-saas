import React, { useState } from "react";

export default function TagInput({ value = [], onChange, placeholder }) {
  const [input, setInput] = useState("");

  const add = () => {
    const trimmed = input.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInput("");
  };

  const remove = (tag) => onChange(value.filter((t) => t !== tag));

  return (
    <div className="tag-input-container">
      {value.map((tag) => (
        <span key={tag} className="tag">
          {tag}
          <button type="button" onClick={() => remove(tag)}>×</button>
        </span>
      ))}
      <input
        className="tag-input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } }}
        onBlur={add}
        placeholder={placeholder || "Type and press Enter"}
      />
    </div>
  );
}
