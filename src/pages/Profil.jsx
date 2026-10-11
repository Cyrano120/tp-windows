import { useSelector } from "react-redux";
import { auth } from "../firebase/firebase";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

function Profil() {
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();

  if (!user) {
    navigate("/login");
    return null;
  }

  const handleDelete = async () => {
    if (!confirm("Supprimer votre compte ? Cette action est irréversible.")) return;
    try {
      await auth.currentUser.delete();
      toast.success("Compte supprimé");
      navigate("/");
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  return (
    <div className="profil">
      <h2>Mon Profil</h2>
      <div className="profil-card">
        <div className="profil-avatar">
          {user.nom?.charAt(0)?.toUpperCase() || "U"}
        </div>
        <div className="profil-info">
          <p><strong>Nom :</strong> {user.nom || "Non renseigné"}</p>
          <p><strong>Email :</strong> {user.email}</p>
          <p><strong>Rôle :</strong> {user.email === "admin@cyrano.com" ? "Administrateur" : "Client"}</p>
        </div>
        <button className="btn-danger" onClick={handleDelete}>
          Supprimer mon compte
        </button>
      </div>
    </div>
  );
}

export default Profil;
