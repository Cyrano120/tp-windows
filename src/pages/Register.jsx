import { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";
import { useDispatch } from "react-redux";
import { setUser } from "../store/authSlice";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

function Register() {
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("client");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: nom });
      const finalRole = email === "admin@cyrano.com" ? "admin" : role;
      const userData = { nom, email, role: finalRole, createdAt: new Date().toISOString() };
      await setDoc(doc(db, "utilisateurs", cred.user.uid), userData);
      dispatch(setUser({ uid: cred.user.uid, email, nom, role: finalRole }));
      toast.success("Compte créé avec succès !");
      navigate("/catalogue");
    } catch (err) {
      if (err.code === "auth/email-already-in-use") toast.error("Cet email est déjà utilisé");
      else toast.error("Erreur : " + err.message);
    }
  };

  return (
    <div className="auth-page">
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>Inscription</h2>
        <input placeholder="Nom complet" value={nom} onChange={(e) => setNom(e.target.value)} required />
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Mot de passe (6+ caractères)" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
        <div className="role-selector">
          <label className={`role-option ${role === "client" ? "active" : ""}`} onClick={() => setRole("client")}>
            <input type="radio" name="role" value="client" checked={role === "client"} readOnly />
            🛍️ Client
          </label>
          <label className={`role-option ${role === "vendeur" ? "active" : ""}`} onClick={() => setRole("vendeur")}>
            <input type="radio" name="role" value="vendeur" checked={role === "vendeur"} readOnly />
            🏪 Vendeur
          </label>
        </div>
        <button type="submit" className="btn-primary">Créer mon compte</button>
        <p className="auth-link">Déjà un compte ? <Link to="/login">Se connecter</Link></p>
      </form>
    </div>
  );
}

export default Register;
