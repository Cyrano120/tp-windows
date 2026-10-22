import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";

export function PageLoader({ label = "Chargement…" }) {
  return (
    <div className="page-loader" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

/**
 * Protège une route.
 * @param {string[]} roles rôles autorisés (vide = tout utilisateur connecté)
 */
export default function RequireAuth({ children, roles = [] }) {
  const { user, ready } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!ready) return <PageLoader />;
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  if (roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
}
