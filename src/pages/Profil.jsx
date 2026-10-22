import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { deleteDoc, doc, setDoc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { auth, db } from "../firebase/firebase";
import { setUser, logout } from "../store/authSlice";
import toast from "react-hot-toast";

const LIBELLES = { admin: "Administrateur", vendeur: "Vendeur", client: "Client" };

export default function Profil() {
  const user = useSelector((s) => s.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [edition, setEdition] = useState(false);
  const [nom, setNom] = useState(user?.nom || "");
  const [suppression, setSuppression] = useState(false);

  if (!user) return null;

  const enregistrer = async (e) => {
    e.preventDefault();
    if (nom.trim().length < 2) return toast.error("Nom trop court.");
    try {
      await updateDoc(doc(db, "utilisateurs", user.uid), { nom: nom.trim() });
      await updateProfile(auth.currentUser, { displayName: nom.trim() });
      dispatch(setUser({ ...user, nom: nom.trim() }));
      toast.success("Profil mis à jour");
      setEdition(false);
    } catch {
      toast.error("Impossible de mettre à jour le profil.");
    }
  };

  const supprimerCompte = async () => {
    if (!confirm("Supprimer définitivement ton compte ? Cette action est irréversible.")) return;
    setSuppression(true);
    const sauvegarde = {
      nom: user.nom,
      email: user.email,
      role: user.role,
      ville: user.ville || "",
    };
    try {
      // On supprime d'abord le profil Firestore, puis le compte Auth.
      // Si Auth exige une reconnexion récente, on restaure le profil pour
      // ne pas laisser l'utilisateur connecté sans document.
      await deleteDoc(doc(db, "utilisateurs", user.uid));
      try {
        await auth.currentUser.delete();
      } catch (errAuth) {
        await setDoc(doc(db, "utilisateurs", user.uid), sauvegarde, { merge: true }).catch(() => {});
        throw errAuth;
      }
      toast.success("Compte supprimé");
      navigate("/", { replace: true });
      dispatch(logout());
    } catch (err) {
      if (err.code === "auth/requires-recent-login") {
        toast.error("Reconnecte-toi puis réessaie pour supprimer ton compte.");
      } else {
        toast.error("Erreur lors de la suppression du compte.");
      }
    } finally {
      setSuppression(false);
    }
  };

  return (
    <div className="profil">
      <h2>Mon profil</h2>
      <div className="profil-card">
        <div className="profil-avatar" aria-hidden="true">
          {user.nom?.charAt(0)?.toUpperCase() || "U"}
        </div>

        <div className="profil-info">
          {edition ? (
            <form onSubmit={enregistrer} style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
              <input
                className="filter-select"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                aria-label="Nom complet"
                autoFocus
              />
              <button type="submit" className="btn-primary btn-sm">Enregistrer</button>
              <button type="button" className="btn-secondary btn-sm" onClick={() => { setEdition(false); setNom(user.nom || ""); }}>Annuler</button>
            </form>
          ) : (
            <>
              <p><strong>{user.nom}</strong></p>
              <p>{user.email}</p>
              <p>
                Rôle : <span className={`badge-status ${user.role}`}>{LIBELLES[user.role] || user.role}</span>
              </p>
            </>
          )}
        </div>

        <div className="dash-actions" style={{ justifyContent: "center" }}>
          {!edition && <button className="btn-secondary btn-sm" onClick={() => setEdition(true)}>Modifier mon nom</button>}
          {user.role === "admin" && <Link to="/dashboard" className="btn-primary btn-sm">Tableau de bord</Link>}
          {user.role === "vendeur" && <Link to="/espace-vendeur" className="btn-primary btn-sm">Mon espace vendeur</Link>}
          {/* L'admin assure uniquement la supervision : pas de liens client. */}
          {user.role !== "admin" && <Link to="/suivi" className="btn-secondary btn-sm">Mes commandes</Link>}
          {user.role === "client" && <Link to="/favoris" className="btn-secondary btn-sm">Mes favoris</Link>}
        </div>

        <button className="btn-danger btn-sm" onClick={supprimerCompte} disabled={suppression}>
          {suppression ? "Suppression…" : "Supprimer mon compte"}
        </button>
      </div>
    </div>
  );
}
