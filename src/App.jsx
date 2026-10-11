import { useEffect, useState } from "react";
import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import { useDispatch } from "react-redux";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase/firebase";
import { setUser } from "./store/authSlice";
import { Toaster } from "react-hot-toast";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Accueil from "./pages/Accueil";
import Catalogue from "./pages/Catalogue";
import ProduitDetails from "./pages/ProduitDetails";
import Panier from "./pages/Panier";
import Checkout from "./pages/Checkout";
import Suivi from "./pages/Suivi";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profil from "./pages/Profil";
import Vendeur from "./pages/Vendeur";
import Favoris from "./pages/Favoris";
import Messagerie from "./pages/Messagerie";
import EspaceVendeur from "./pages/EspaceVendeur";
import "./App.css";

function Layout() {
  return (
    <div className="layout">
      <Header />
      <main className="main">
        <Outlet />
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
      { path: "/checkout", element: <Checkout /> },
      { path: "/suivi", element: <Suivi /> },
      { path: "/dashboard", element: <Dashboard /> },
      { path: "/login", element: <Login /> },
      { path: "/register", element: <Register /> },
      { path: "/profil", element: <Profil /> },
      { path: "/favoris", element: <Favoris /> },
      { path: "/messages", element: <Messagerie /> },
      { path: "/espace-vendeur", element: <EspaceVendeur /> },
    ],
  },
]);

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        getDoc(doc(db, "utilisateurs", user.uid))
          .then((snap) => {
            const data = snap.data() || {};
            dispatch(setUser({ uid: user.uid, email: user.email, nom: data.nom || user.displayName, role: data.role || "client" }));
          })
          .catch(() => dispatch(setUser({ uid: user.uid, email: user.email, nom: user.displayName, role: "client" })));
      }
    });
    return unsub;
  }, [dispatch]);

  return (
    <>
      <Toaster position="top-right" toastOptions={{ style: { background: "white", color: "#222", border: "1px solid #eee" } }} />
      <RouterProvider router={router} />
    </>
  );
}

export default App;
