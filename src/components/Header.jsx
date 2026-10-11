import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { logout } from "../store/authSlice";
import toast from "react-hot-toast";

function Header() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const role = user?.role;
  const cartCount = useSelector((state) => state.cart.items.reduce((sum, i) => sum + i.quantity, 0));
  const favCount = useSelector((state) => state.favorites.items.length);
  const msgCount = useSelector((state) => state.messages.conversations.length);

  const handleLogout = async () => {
    await signOut(auth);
    dispatch(logout());
    toast.success("Déconnexion réussie");
    navigate("/");
  };

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="logo">Cyrano</Link>
        <nav className="nav">
          <Link to="/">Accueil</Link>
          <Link to="/catalogue">Catalogue</Link>
          {role === "admin" ? (
            <Link to="/dashboard" className="btn-admin">Tableau de Bord</Link>
          ) : role === "vendeur" ? (
            <Link to="/espace-vendeur" className="btn-admin">Espace Vendeur</Link>
          ) : (
            <>
              <Link to="/favoris">
                Favoris{favCount > 0 && <span className="badge">{favCount}</span>}
              </Link>
              <Link to="/messages">
                Messages{msgCount > 0 && <span className="badge">{msgCount}</span>}
              </Link>
              <Link to="/panier" className="cart-link">
                Panier
                {cartCount > 0 && <span className="badge">{cartCount}</span>}
              </Link>
            </>
          )}
          {user ? (
            <>
              <Link to="/profil" className="nav-user">{user.nom || user.email} <span className="role-badge">{role}</span></Link>
              <button onClick={handleLogout} className="btn-logout">Déconnexion</button>
            </>
          ) : (
            <Link to="/login" className="btn-admin">Connexion</Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;
