import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { addDoc, collection, deleteDoc, doc, getDocs, updateDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { setOrders, setLoading, updateOrderStatus } from "../store/ordersSlice";
import { addProduct, deleteProduct, setProducts, updateProduct } from "../store/productsSlice";
import { setOffres, updateOffreStatus } from "../store/offresSlice";
import { PageLoader } from "../components/RequireAuth";
import { PRODUITS, normaliserProduit } from "../data/catalogue";
import { statutSlug } from "../utils/statut";
import toast from "react-hot-toast";
import { Bar, Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, Legend, LinearScale, Title, Tooltip } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const ONGLETS = [
  { id: "apercu", label: "Vue d'ensemble" },
  { id: "produits", label: "Produits" },
  { id: "commandes", label: "Commandes" },
  { id: "offres", label: "Offres" },
  { id: "utilisateurs", label: "Utilisateurs" },
];

const ROLES = [
  { id: "client", label: "Client" },
  { id: "vendeur", label: "Vendeur" },
  { id: "admin", label: "Admin" },
];

const PROCHAIN_STATUT = { "Reçue": "En cours", "En cours": "Expédiée", "Expédiée": "Livrée" };
const FORM_VIDE = { nom: "", prix: "", categorie: "Homme", tailles: "", image: "", stock: "1" };

export default function Dashboard() {
  const dispatch = useDispatch();
  const { orders, loading } = useSelector((s) => s.orders);
  const products = useSelector((s) => s.products.items);
  const offres = useSelector((s) => s.offres.items);
  const admin = useSelector((s) => s.auth.user);

  const [users, setUsers] = useState([]);
  const [onglet, setOnglet] = useState("apercu");
  const [showForm, setShowForm] = useState(false);
  const [editProd, setEditProd] = useState(null);
  const [form, setForm] = useState(FORM_VIDE);
  const [rechercheProduit, setRechercheProduit] = useState("");
  const [rechercheUser, setRechercheUser] = useState("");

  useEffect(() => {
    let actif = true;
    (async () => {
      dispatch(setLoading(true));
      try {
        const [ordsSnap, prodsSnap, offresSnap, usersSnap] = await Promise.all([
          getDocs(collection(db, "commandes")),
          getDocs(collection(db, "produits")),
          getDocs(collection(db, "offres")),
          getDocs(collection(db, "utilisateurs")),
        ]);
        if (!actif) return;
        dispatch(setOrders(ordsSnap.docs.map((d) => ({ id: d.id, ...d.data() }))));
        dispatch(setProducts(prodsSnap.docs.map((d) => ({ id: d.id, ...d.data() }))));
        dispatch(setOffres(offresSnap.docs.map((d) => ({ id: d.id, ...d.data() }))));
        setUsers(usersSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch {
        toast.error("Erreur de chargement des données d'administration.");
      } finally {
        if (actif) dispatch(setLoading(false));
      }
    })();
    return () => { actif = false; };
  }, [dispatch]);

  const produitsAffiches = useMemo(() => {
    const demo = PRODUITS.map((p) => ({ ...normaliserProduit(p), demo: true }));
    return [...demo, ...products];
  }, [products]);

  const produitsFiltres = useMemo(
    () => produitsAffiches.filter((p) => `${p.nom} ${p.categorie} ${p.vendeur}`.toLowerCase().includes(rechercheProduit.toLowerCase())),
    [produitsAffiches, rechercheProduit]
  );

  const usersFiltres = useMemo(
    () => users.filter((u) => `${u.nom || ""} ${u.email || ""} ${u.role || ""}`.toLowerCase().includes(rechercheUser.toLowerCase())),
    [users, rechercheUser]
  );

  const totalVentes = orders.reduce((s, o) => s + (Number(o.total) || 0), 0);
  const offresEnAttente = offres.filter((o) => o.status === "en_attente").length;

  const commandesTriees = useMemo(
    () => [...orders].sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : (a.createdAt?.seconds || 0) * 1000;
      const dateB = b.date ? new Date(b.date).getTime() : (b.createdAt?.seconds || 0) * 1000;
      return (dateB || 0) - (dateA || 0);
    }),
    [orders]
  );

  const stats = [
    { label: "Commandes", value: orders.length, color: "#007782" },
    { label: "Revenus", value: `${totalVentes.toLocaleString("fr-FR")} FCFA`, color: "#067647" },
    { label: "Produits", value: produitsAffiches.length, color: "#7a5af8" },
    { label: "Utilisateurs", value: users.length, color: "#175cd3" },
    { label: "Offres en attente", value: offresEnAttente, color: "#b54708" },
  ];

  const revenusParMois = useMemo(() => {
    const mois = {};
    orders.forEach((o) => {
      const d = o.date ? new Date(o.date) : null;
      if (d && !Number.isNaN(d.getTime())) {
        const m = d.toLocaleString("fr-FR", { month: "short", year: "2-digit" });
        mois[m] = (mois[m] || 0) + (Number(o.total) || 0);
      }
    });
    return mois;
  }, [orders]);

  const statusCount = useMemo(() => {
    const counts = {};
    orders.forEach((o) => { counts[o.status] = (counts[o.status] || 0) + 1; });
    return counts;
  }, [orders]);

  const barData = {
    labels: Object.keys(revenusParMois),
    datasets: [{ label: "Revenus (FCFA)", data: Object.values(revenusParMois), backgroundColor: "#007782", borderRadius: 6 }],
  };

  const doughnutData = {
    labels: Object.keys(statusCount),
    datasets: [{
      data: Object.values(statusCount),
      backgroundColor: ["#f5a623", "#175cd3", "#7a5af8", "#067647", "#d92d20"],
      borderWidth: 0,
    }],
  };

  const avancerCommande = async (order) => {
    const suivant = PROCHAIN_STATUT[order.status];
    if (!suivant) return;
    try {
      await updateDoc(doc(db, "commandes", order.id), { status: suivant });
      dispatch(updateOrderStatus({ id: order.id, status: suivant }));
      toast.success(`Commande #${order.id.slice(0, 8)} → ${suivant}`);
    } catch {
      toast.error("Erreur de mise à jour du statut.");
    }
  };

  const changerRole = async (u, role) => {
    if (u.id === admin.uid) return toast.error("Tu ne peux pas modifier ton propre rôle.");
    if (!confirm(`Attribuer le rôle « ${role} » à ${u.nom || u.email} ?`)) return;
    try {
      await updateDoc(doc(db, "utilisateurs", u.id), { role });
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, role } : x)));
      toast.success(`${u.nom || u.email} → ${role}`);
    } catch {
      toast.error("Erreur lors du changement de rôle.");
    }
  };

  const statutOffre = async (offre, status) => {
    try {
      await updateDoc(doc(db, "offres", offre.id), { status });
      dispatch(updateOffreStatus({ id: offre.id, status }));
      toast.success(`Offre ${status}`);
    } catch {
      toast.error("Erreur de mise à jour de l'offre.");
    }
  };

  const supprimerProduit = async (p) => {
    if (p.demo) return toast.error("Les produits de démonstration ne sont pas modifiables.");
    if (!confirm(`Supprimer « ${p.nom} » ?`)) return;
    try {
      await deleteDoc(doc(db, "produits", p.id));
      dispatch(deleteProduct(p.id));
      toast.success("Produit supprimé");
    } catch {
      toast.error("Erreur de suppression.");
    }
  };

  const openEdit = (p) => {
    if (p.demo) return toast.error("Produit de démonstration : non modifiable.");
    setEditProd(p);
    setForm({
      nom: p.nom || "", prix: p.prix?.toString() || "", categorie: p.categorie || "Homme",
      tailles: (p.tailles || []).join(", "), image: p.image || "", stock: String(p.stock ?? 1),
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const prix = Number(form.prix);
    if (prix <= 0) return toast.error("Prix invalide.");
    const base = {
      nom: form.nom.trim(),
      prix,
      categorie: form.categorie,
      tailles: form.tailles.split(",").map((t) => t.trim()).filter(Boolean),
      image: form.image.trim() || "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=700&h=900&fit=crop",
      stock: Number(form.stock) || 1,
    };
    try {
      if (editProd) {
        await updateDoc(doc(db, "produits", editProd.id), base);
        dispatch(updateProduct({ ...editProd, ...base }));
        toast.success("Produit modifié");
      } else {
        const data = { ...base, vendeurId: null, vendeurNom: "Cyrano", vendeur: "Cyrano", etat: "Neuf", note: 0, nbAvis: 0 };
        const ref = await addDoc(collection(db, "produits"), data);
        dispatch(addProduct({ id: ref.id, ...data }));
        toast.success("Produit ajouté");
      }
      setShowForm(false);
      setEditProd(null);
      setForm(FORM_VIDE);
    } catch {
      toast.error("Erreur d'enregistrement.");
    }
  };

  const exporterCSV = () => {
    // Neutralise les formules Excel (=, +, -, @) pour éviter une injection CSV.
    const echapper = (v) => {
      let valeur = String(v ?? "");
      if (/^[=+\-@\t\r]/.test(valeur)) valeur = `'${valeur}`;
      return `"${valeur.replace(/"/g, '""')}"`;
    };
    const entetes = ["ID", "Client", "Email", "Téléphone", "Adresse", "Total", "Paiement", "Statut", "Date"];
    const lignes = orders.map((o) => [
      o.id, o.client?.nom, o.client?.email || o.clientEmail, o.client?.tel, o.client?.adresse,
      o.total, o.paiement, o.status, o.date,
    ].map(echapper).join(","));
    const blob = new Blob([`\uFEFF${entetes.join(",")}\n${lignes.join("\n")}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `commandes-cyrano-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export CSV téléchargé");
  };

  if (loading && orders.length === 0) return <PageLoader label="Chargement du tableau de bord…" />;

  return (
    <div className="dashboard">
      <div className="dash-header">
        <div>
          <h2>Tableau de bord</h2>
          <p className="dash-sub">Supervision de la plateforme Cyrano.</p>
        </div>
        <div className="dash-actions">
          <button className="btn-secondary" onClick={exporterCSV}>📥 Exporter CSV</button>
          <button className="btn-primary" onClick={() => { setEditProd(null); setForm(FORM_VIDE); setShowForm(true); }}>+ Ajouter produit</button>
        </div>
      </div>

      <div className="stats-grid">
        {stats.map((s) => (
          <div key={s.label} className="stat-card" style={{ "--stat-color": s.color }}>
            <h3>{s.label}</h3>
            <p style={String(s.value).length > 12 ? { fontSize: 18 } : undefined}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="tabs" role="tablist">
        {ONGLETS.map((o) => (
          <button key={o.id} role="tab" aria-selected={onglet === o.id} className={`tab ${onglet === o.id ? "active" : ""}`} onClick={() => setOnglet(o.id)}>
            {o.label}
            {o.id === "offres" && offresEnAttente > 0 && <span className="badge" style={{ marginLeft: 6 }}>{offresEnAttente}</span>}
          </button>
        ))}
      </div>

      {onglet === "apercu" && (
        <>
          <div className="charts-grid">
            <div className="chart-card">
              <h3>Revenus par mois</h3>
              {Object.keys(revenusParMois).length > 0
                ? <Bar data={barData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
                : <p className="no-results">Aucune donnée pour le moment.</p>}
            </div>
            <div className="chart-card">
              <h3>Statut des commandes</h3>
              {Object.keys(statusCount).length > 0
                ? <Doughnut data={doughnutData} options={{ responsive: true, plugins: { legend: { position: "bottom" } } }} />
                : <p className="no-results">Aucune commande pour le moment.</p>}
            </div>
          </div>

          <h3>Dernières commandes</h3>
          <div className="dash-table">
            {commandesTriees.slice(0, 5).map((order) => (
              <div key={order.id} className="dash-row">
                <div>
                  <strong>#{order.id.slice(0, 8).toUpperCase()}</strong> — {order.client?.nom || "Client"} — {order.total?.toLocaleString("fr-FR")} FCFA
                  <span className={`badge-status ${statutSlug(order.status)}`}>{order.status}</span>
                </div>
                {PROCHAIN_STATUT[order.status] && (
                  <button className="btn-small" onClick={() => avancerCommande(order)}>→ {PROCHAIN_STATUT[order.status]}</button>
                )}
              </div>
            ))}
            {orders.length === 0 && <div className="dash-empty">Aucune commande enregistrée.</div>}
          </div>
        </>
      )}

      {onglet === "produits" && (
        <>
          <input className="search-bar" placeholder="Rechercher un produit, une catégorie, un vendeur…" value={rechercheProduit} onChange={(e) => setRechercheProduit(e.target.value)} style={{ marginBottom: 16 }} />
          <div className="dash-table">
            {produitsFiltres.map((p) => (
              <div key={`${p.demo ? "demo-" : ""}${p.id}`} className="dash-row">
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <img src={p.image} alt="" style={{ width: 40, height: 52, objectFit: "cover", borderRadius: 8 }} />
                  <div>
                    <strong>{p.nom}</strong>{p.demo && <span className="role-badge">démo</span>}
                    <div className="dash-cat">{p.categorie} · {p.vendeur || "Cyrano"} · {p.prix?.toLocaleString("fr-FR")} FCFA</div>
                  </div>
                </div>
                {!p.demo && (
                  <div className="dash-row-actions">
                    <Link to={`/produit/${p.id}`} className="btn-small">Voir</Link>
                    <button className="btn-small" onClick={() => openEdit(p)}>Modifier</button>
                    <button className="btn-small btn-danger" onClick={() => supprimerProduit(p)}>Supprimer</button>
                  </div>
                )}
              </div>
            ))}
            {produitsFiltres.length === 0 && <div className="dash-empty">Aucun produit trouvé.</div>}
          </div>
        </>
      )}

      {onglet === "commandes" && (
        <div className="dash-table">
          {commandesTriees.map((order) => (
            <div key={order.id} className="dash-row">
              <div>
                <strong>#{order.id.slice(0, 8).toUpperCase()}</strong> — {order.client?.nom || "Client"} ({order.client?.tel || "—"})
                <span className={`badge-status ${statutSlug(order.status)}`}>{order.status}</span>
                <div className="dash-cat">
                  {order.total?.toLocaleString("fr-FR")} FCFA · {(order.articles || []).length} article(s) · {order.paiement || "paiement n/c"}
                </div>
              </div>
              {PROCHAIN_STATUT[order.status] && (
                <button className="btn-small" onClick={() => avancerCommande(order)}>→ {PROCHAIN_STATUT[order.status]}</button>
              )}
            </div>
          ))}
          {orders.length === 0 && <div className="dash-empty">Aucune commande.</div>}
        </div>
      )}

      {onglet === "offres" && (
        <div className="dash-table">
          {offres.map((offre) => (
            <div key={offre.id} className="dash-row">
              <div>
                <strong>{offre.clientNom}</strong> — {offre.produitNom} — <strong>{offre.montant?.toLocaleString("fr-FR")} FCFA</strong>
                <span className={`badge-status ${statutSlug(offre.status)}`}>{offre.status}</span>
                <div className="dash-cat">Vendeur : {offre.vendeurNom || "—"}</div>
              </div>
              {offre.status === "en_attente" && (
                <div className="dash-row-actions">
                  <button className="btn-small" onClick={() => statutOffre(offre, "acceptée")}>✅ Accepter</button>
                  <button className="btn-small btn-danger" onClick={() => statutOffre(offre, "refusée")}>❌ Refuser</button>
                </div>
              )}
            </div>
          ))}
          {offres.length === 0 && <div className="dash-empty">Aucune offre pour le moment.</div>}
        </div>
      )}

      {onglet === "utilisateurs" && (
        <>
          <input className="search-bar" placeholder="Rechercher un utilisateur…" value={rechercheUser} onChange={(e) => setRechercheUser(e.target.value)} style={{ marginBottom: 16 }} />
          <div className="dash-table">
            {usersFiltres.map((u) => (
              <div key={u.id} className="dash-row">
                <div>
                  <strong>{u.nom || "N/A"}</strong> — {u.email}
                  <span className={`badge-status ${u.role}`}>{ROLES.find((r) => r.id === u.role)?.label || u.role}</span>
                  {u.id === admin.uid && <span className="role-badge">moi</span>}
                </div>
                <select
                  className="filter-select"
                  value={u.role || "client"}
                  disabled={u.id === admin.uid}
                  onChange={(e) => changerRole(u, e.target.value)}
                  aria-label={`Rôle de ${u.nom || u.email}`}
                >
                  {ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                </select>
              </div>
            ))}
            {usersFiltres.length === 0 && <div className="dash-empty">Aucun utilisateur trouvé.</div>}
          </div>
        </>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
            <h3>{editProd ? "Modifier" : "Ajouter"} un produit</h3>
            <input placeholder="Nom du produit" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required />
            <input type="number" min="1" placeholder="Prix (FCFA)" value={form.prix} onChange={(e) => setForm({ ...form, prix: e.target.value })} required />
            <select value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })}>
              <option>Homme</option><option>Femme</option><option>Accessoires</option>
            </select>
            <input placeholder="Tailles (S, M, L)" value={form.tailles} onChange={(e) => setForm({ ...form, tailles: e.target.value })} />
            <input type="number" min="0" placeholder="Stock" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
            <input placeholder="URL image" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
            <div className="modal-actions">
              <button type="button" className="btn-clear" onClick={() => setShowForm(false)}>Annuler</button>
              <button type="submit" className="btn-primary">{editProd ? "Modifier" : "Ajouter"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
