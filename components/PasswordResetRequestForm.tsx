"use client";

import { useState } from "react";

export default function PasswordResetRequestForm() {
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const response = await fetch(
      "http://127.0.0.1:8000/authentication/password-reset-request/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      }
    );

    if (response.ok) {
      alert("Password reset email sent!");
    } else {
      alert("An error occurred, please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <button type="submit">Send Password Reset Email</button>
    </form>
  );
}
