import { useState, type FormEvent } from "react";

export function Login({ onSubmit, error }: { onSubmit: (password: string) => void; error?: string }) {
  const [value, setValue] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    if (value.trim()) onSubmit(value.trim());
  }

  return (
    <main className="login">
      <form className="login-card" onSubmit={submit}>
        <h1>Enquête mobilité N'Djamena</h1>
        <p className="muted">Tableau de bord réservé à l'équipe.</p>
        <label htmlFor="password">Mot de passe</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
        />
        {error && <p className="error" role="alert">{error}</p>}
        <button type="submit" className="btn primary" disabled={!value.trim()}>
          Se connecter
        </button>
      </form>
    </main>
  );
}
