import { lazy, Suspense, useEffect } from "react";
import { createBrowserRouter, RouterProvider, Outlet, useLocation, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase/firebase";
import { chargerProfil } from "./services/profil";
import { setUser, setReady, logout } from "./store/authSlice";
import { Toaster } from "react-hot-toast";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ErrorBoundary from "./components/ErrorBoundary";
import RequireAuth, { PageLoader } from "./components/RequireAuth";
import "./App.css";

const Accueil = lazy(() => import("./pages/Accueil"));
const Catalogue = lazy(() => import("./pages/Catalogue"));
const ProduitDetails = lazy(() => import("./pages/ProduitDetails"));
const Panier = lazy(() => import("./pages/Panier"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Suivi = lazy(() => import("./pages/Suivi"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Profil = lazy(() => import("./pages/Profil"));
const Vendeur = lazy(() => import("./pages/Vendeur"));
const Favoris = lazy(() => import("./pages/Favoris"));
const Messagerie = lazy(() => import("./pages/Messagerie"));
const EspaceVendeur = lazy(() => import("./pages/EspaceVendeur"));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname]);
  return null;
}

function NotFound() {
  return (
    <div className="empty-state">
      <span className="empty-emoji">🧭</span>
      <h2>Page introuvable</h2>
      <p>La page que tu cherches n'existe pas ou a été déplacée.</p>
      <Link to="/catalogue" className="btn-primary">Retour au catalogue</Link>
    </div>
  );
}

function Layout() {
  return (
    <div className="layout">
      <ScrollToTop />
      <Header />
      <main className="main">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", element: <Accueil /> },
      { path: "/catalogue", element: <Catalogue /> },
      { path: "/produit/:id", element: <ProduitDetails /> },
      { path: "/vendeur/:nom", element: <Vendeur /> },
      { path: "/panier", element: <Panier /> },
      { path: "/checkout", element: <RequireAuth><Checkout /></RequireAuth> },
      { path: "/suivi", element: <RequireAuth><Suivi /></RequireAuth> },
      { path: "/dashboard", element: <RequireAuth roles={["admin"]}><Dashboard /></RequireAuth> },
      { path: "/login", element: <Login /> },
      { path: "/register", element: <Register /> },
      { path: "/profil", element: <RequireAuth><Profil /></RequireAuth> },
      { path: "/favoris", element: <RequireAuth><Favoris /></RequireAuth> },
      { path: "/messages", element: <RequireAuth><Messagerie /></RequireAuth> },
      { path: "/espace-vendeur", element: <RequireAuth roles={["vendeur", "admin"]}><EspaceVendeur /></RequireAuth> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Filet de sécurité : ne jamais bloquer l'app si Firestore ne répond pas.
    const secours = setTimeout(() => dispatch(setReady()), 8000);

    const unsub = onAuthStateChanged(auth, async (utilisateur) => {
      if (!utilisateur) {
        clearTimeout(secours);
        dispatch(logout());
        return;
      }
      // On ne coupe le filet de sécurité qu'une fois le profil réellement
      // chargé : si Firestore ne répond pas, l'app se débloque à 8 s.
      const profil = await chargerProfil(utilisateur);
      clearTimeout(secours);
      dispatch(setUser(profil));
    });

    return () => {
      clearTimeout(secours);
      unsub();
    };
  }, [dispatch]);

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          style: { background: "#fff", color: "#1a1a1a", border: "1px solid #e5e7eb", borderRadius: "12px", boxShadow: "0 12px 32px rgba(0,0,0,.12)" },
          success: { iconTheme: { primary: "#007782", secondary: "#fff" } },
        }}
      />
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
    </>
  );
}

export default App;
