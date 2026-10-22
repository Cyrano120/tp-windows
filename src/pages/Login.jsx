import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useSelector, useDispatch } from "react-redux";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { auth } from "../firebase/firebase";
import { chargerProfil } from "../services/profil";
import { setUser } from "../store/authSlice";
import toast from "react-hot-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((s) => s.auth.user);

  const accueilRole = (u) => (u?.role === "admin" ? "/dashboard" : u?.role === "vendeur" ? "/espace-vendeur" : "/catalogue");

  if (user) return <Navigate to={location.state?.from || accueilRole(user)} replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (envoi) return;
    setEnvoi(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, motDePasse);
      const profil = await chargerProfil(cred.user);
      dispatch(setUser(profil));
      toast.success("Connexion réussie !");
      const destination = location.state?.from || accueilRole(profil);
      navigate(destination, { replace: true });
    } catch (err) {
      const messages = {
        "auth/invalid-credential": "Email ou mot de passe incorrect.",
        "auth/wrong-password": "Email ou mot de passe incorrect.",
        "auth/user-not-found": "Aucun compte ne correspond à cet email.",
        "auth/too-many-requests": "Trop de tentatives. Réessaie dans quelques minutes.",
        "auth/invalid-email": "Adresse email invalide.",
      };
      toast.error(messages[err.code] || "Connexion impossible. Vérifie tes informations.");
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div className="auth-page">
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>Bon retour 👋</h2>
        <p className="auth-sub">Connecte-toi pour suivre tes commandes et tes favoris.</p>

        <label htmlFor="email" className="sr-only">Email</label>
        <input id="email" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />

        <label htmlFor="mdp" className="sr-only">Mot de passe</label>
        <input id="mdp" type="password" placeholder="Mot de passe" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} required autoComplete="current-password" />

        <button type="submit" className="btn-primary btn-block" disabled={envoi}>
          {envoi ? "Connexion…" : "Se connecter"}
        </button>

        <p className="auth-link">Pas encore de compte ? <Link to="/register">S'inscrire</Link></p>
      </form>
    </div>
  );
}
