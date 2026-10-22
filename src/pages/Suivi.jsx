import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { PageLoader } from "../components/RequireAuth";
import { statutSlug } from "../utils/statut";
import toast from "react-hot-toast";

const ETAPES = ["Reçue", "En cours", "Expédiée", "Livrée"];

export default function Suivi() {
  const user = useSelector((s) => s.auth.user);
  const [commandes, setCommandes] = useState([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    if (!user) return;
    let actif = true;
    (async () => {
      try {
        // Requête filtrée : un client ne récupère que ses propres commandes.
        const snap = await getDocs(query(collection(db, "commandes"), where("clientId", "==", user.uid)));
        const liste = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => new Date(b.date || b.createdAt?.seconds * 1000 || 0) - new Date(a.date || a.createdAt?.seconds * 1000 || 0));
        if (actif) setCommandes(liste);
      } catch {
        toast.error("Impossible de charger tes commandes.");
      } finally {
        if (actif) setChargement(false);
      }
    })();
    return () => { actif = false; };
  }, [user]);

  if (chargement) return <PageLoader label="Chargement de tes commandes…" />;

  return (
    <div className="suivi">
      <h2>Suivi de mes commandes</h2>

      {commandes.length === 0 ? (
        <div className="empty-state">
          <span className="empty-emoji">📦</span>
          <h2>Aucune commande pour le moment</h2>
          <p>Tes futures commandes et leur statut de livraison apparaîtront ici.</p>
          <Link to="/catalogue" className="btn-primary">Découvrir le catalogue</Link>
        </div>
      ) : (
        <div className="orders-list">
          {commandes.map((commande) => {
            const etape = ETAPES.indexOf(commande.status);
            const articles = commande.articles || [];
            return (
              <article key={commande.id} className="order-card">
                <div className="order-header">
                  <span className="order-id">Commande #{commande.id.slice(0, 8).toUpperCase()}</span>
                  <span className={`order-status status-${statutSlug(commande.status)}`}>
                    {commande.status}
                  </span>
                </div>

                <div className="order-articles">
                  {articles.map((a, idx) => (
                    <Link to={`/produit/${a.id}`} key={`${a.id}-${idx}`} className="order-article">
                      {a.image && <img src={a.image} alt="" loading="lazy" />}
                      <span>{a.nom}{a.taille ? ` · ${a.taille}` : ""} × {a.quantity}</span>
                    </Link>
                  ))}
                </div>

                <div className="order-steps" aria-label={`Statut : ${commande.status}`}>
                  {ETAPES.map((s, i) => (
                    <span key={s} className={`step ${i <= etape ? "active" : ""}`}>
                      <span className="step-dot" aria-hidden="true" />
                      {s}
                    </span>
                  ))}
                </div>

                <div className="order-total">
                  {commande.client?.adresse ? `Livraison : ${commande.client.adresse} · ` : ""}
                  Total : <strong>{commande.total?.toLocaleString("fr-FR")} FCFA</strong>
                  {commande.paiement ? ` · ${commande.paiement}` : ""}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
