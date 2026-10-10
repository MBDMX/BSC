// frontend/pages/login.tsx
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from '../lib/supabaseClient';
import styles from "../styles/login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Vérifier si l'utilisateur est déjà connecté
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      router.push("/dashboard");
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    let token = "";

    try {
      // Determine environment by hostname (Vercel => not localhost)
      const isLocalhost = typeof window !== "undefined" && window.location.hostname.includes("localhost");
      if (!isLocalhost) {
        // Cloud environment – use Supabase authentication
        const { data, error } = await supabase.auth.signInWithPassword({
          email: username,
          password: password,
        });
        if (error) {
          setError(error.message);
          return;
        }
        token = data.session?.access_token ?? "";
      } else {
        // Local development – FastAPI token endpoint
        const params = new URLSearchParams();
        params.append('username', username);
        params.append('password', password);

        const response = await fetch(`${apiUrl}/token`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: params,
        });

        if (!response.ok) {
          const errData = await response.json();
          setError(errData.detail || "Identifiants incorrects");
          return;
        }
        const data = await response.json();
        token = data.access_token;
      }

      // Store token and navigate to dashboard
      localStorage.setItem("access_token", token);
      router.push("/dashboard");
    } catch (err) {
      setError("Erreur de connexion.");
      console.error("Erreur de connexion:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    // Fonction pour gérer le mot de passe oublié
    alert("Fonctionnalité mot de passe oublié à implémenter");
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className={styles["login-container"]}>
      {/* BURGER SOCIAL CLUB TITLE */}
      <div className={styles["burger-title"]}>
        <h1>
          <span className={styles["burger-icon"]}>🍔</span> BURGER SOCIAL CLUB
        </h1>
        <div className={styles.subtitle}>
          Gestion intelligente & Analytics avancés
        </div>
      </div>

      {/* LOGIN FORM */}
      <div className={styles["login-wrapper"]}>
        <h2>🔐 Connexion</h2>

        <form onSubmit={handleLogin}>
          <div className={styles["form-group"]}>
            <label htmlFor="username">Nom d'utilisateur</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Entrez votre nom d'utilisateur"
              required
            />
          </div>

          <div className={styles["form-group"]}>
            <label htmlFor="password">Mot de passe</label>
            <div className={styles["password-field"]}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Entrez votre mot de passe"
                required
              />
              <button
                type="button"
                className={styles["eye-icon"]}
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className={styles["login-btn"]}
            disabled={isLoading}
          >
            {isLoading ? "Connexion en cours..." : "Se connecter"}
          </button>

          {error && (
            <div className={styles["error-message"]}>
              {error}
            </div>
          )}
        </form>

        <div className={styles["forgot-password"]}>
          <a href="#" onClick={handleForgotPassword}>
            Mot de passe oublié ?
          </a>
        </div>
      </div>
    </div>
  );
}
