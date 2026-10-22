import { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useDispatch, useSelector } from "react-redux";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase/firebase";
import { setUser } from "../store/authSlice";
import toast from "react-hot-toast";

export default function Register() {
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [role, setRole] = useState("client");
  const [envoi, setEnvoi] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);

  if (user) {
    const destination = user.role === "admin" ? "/dashboard" : user.role === "vendeur" ? "/espace-vendeur" : "/catalogue";
    return <Navigate to={destination} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (envoi) return;
    if (nom.trim().length < 2) return toast.error("Indique ton nom complet.");
    if (motDePasse.length < 8) return toast.error("Le mot de passe doit contenir au moins 8 caractères.");
    if (motDePasse !== confirmation) return toast.error("Les mots de passe ne correspondent pas.");

    setEnvoi(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, motDePasse);
      await updateProfile(cred.user, { displayName: nom.trim() });
      const roleFinal = email === "admin@cyrano.com" ? "admin" : role;
      await setDoc(doc(db, "utilisateurs", cred.user.uid), {
        nom: nom.trim(),
        email,
        role: roleFinal,
        createdAt: serverTimestamp(),
        dateInscription: new Date().toISOString(),
      });
      dispatch(setUser({ uid: cred.user.uid, email, nom: nom.trim(), role: roleFinal }));
      toast.success("Compte créé avec succès !");
      navigate(roleFinal === "vendeur" ? "/espace-vendeur" : "/catalogue");
    } catch (err) {
      const messages = {
        "auth/email-already-in-use": "Cet email est déjà utilisé.",
        "auth/invalid-email": "Adresse email invalide.",
        "auth/weak-password": "Mot de passe trop faible (8 caractères minimum).",
      };
      toast.error(messages[err.code] || "Erreur lors de la création du compte.");
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div className="auth-page">
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>Créer un compte</h2>
        <p className="auth-sub">Rejoins la communauté Cyrano en moins d'une minute.</p>

        <label htmlFor="nom" className="sr-only">Nom complet</label>
        <input id="nom" placeholder="Nom complet" value={nom} onChange={(e) => setNom(e.target.value)} required autoComplete="name" />

        <label htmlFor="email" className="sr-only">Email</label>
        <input id="email" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />

        <label htmlFor="mdp" className="sr-only">Mot de passe</label>
        <input id="mdp" type="password" placeholder="Mot de passe (8 caractères min.)" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} minLength={8} required autoComplete="new-password" />

        <label htmlFor="confirmation" className="sr-only">Confirmer le mot de passe</label>
        <input id="confirmation" type="password" placeholder="Confirmer le mot de passe" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} minLength={8} required autoComplete="new-password" />

        <div className="role-selector" role="radiogroup" aria-label="Type de compte">
          <label className={`role-option ${role === "client" ? "active" : ""}`}>
            <input type="radio" name="role" value="client" checked={role === "client"} onChange={() => setRole("client")} />
            🛍️ Client
            <small>Acheter et faire des offres</small>
          </label>
          <label className={`role-option ${role === "vendeur" ? "active" : ""}`}>
            <input type="radio" name="role" value="vendeur" checked={role === "vendeur"} onChange={() => setRole("vendeur")} />
            🏪 Vendeur
            <small>Vendre mes articles</small>
          </label>
        </div>

        <button type="submit" className="btn-primary btn-block" disabled={envoi}>
          {envoi ? "Création…" : "Créer mon compte"}
        </button>
        <p className="auth-link">Déjà un compte ? <Link to="/login">Se connecter</Link></p>
      </form>
    </div>
  );
}
