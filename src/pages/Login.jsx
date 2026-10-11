import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";
import { useDispatch } from "react-redux";
import { setUser } from "../store/authSlice";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const snap = await getDoc(doc(db, "utilisateurs", cred.user.uid));
      const data = snap.data() || { nom: cred.user.displayName || email, role: "client" };
      dispatch(setUser({ uid: cred.user.uid, email, nom: data.nom, role: data.role }));
      toast.success("Connexion réussie !");
      navigate("/catalogue");
    } catch {
      toast.error("Email ou mot de passe incorrect");
    }
  };

  return (
    <div className="auth-page">
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>Connexion</h2>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit" className="btn-primary">Se connecter</button>
        <p className="auth-link">Pas encore de compte ? <Link to="/register">S'inscrire</Link></p>
      </form>
    </div>
  );
}

export default Login;
