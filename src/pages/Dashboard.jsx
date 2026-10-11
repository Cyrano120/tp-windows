import { useState, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { setOrders, setLoading, updateOrderStatus } from "../store/ordersSlice";
import { setProducts, addProduct, updateProduct, deleteProduct } from "../store/productsSlice";
import { setOffres, updateOffreStatus, setLoading as setOffresLoading } from "../store/offresSlice";
import toast from "react-hot-toast";
import { Bar, Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from "chart.js";
import { seedFirestore } from "../firebase/seed";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

function Dashboard() {
  const dispatch = useDispatch();
  const { orders } = useSelector((state) => state.orders);
  const { items: products } = useSelector((state) => state.products);
  const offres = useSelector((state) => state.offres.items);
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editProd, setEditProd] = useState(null);
  const [form, setForm] = useState({ nom: "", prix: "", categorie: "Homme", tailles: "", image: "" });

  useEffect(() => {
    const fetchData = async () => {
      dispatch(setLoading(true));
      try {
        const [ordsSnap, prodsSnap, offresSnap, usersSnap] = await Promise.all([
          getDocs(collection(db, "commandes")),
          getDocs(collection(db, "produits")),
          getDocs(collection(db, "offres")),
          getDocs(collection(db, "utilisateurs")),
        ]);
        dispatch(setOrders(ordsSnap.docs.map((d) => ({ id: d.id, ...d.data() }))));
        if (!prodsSnap.empty) dispatch(setProducts(prodsSnap.docs.map((d) => ({ id: d.id, ...d.data() }))));
        dispatch(setOffres(offresSnap.docs.map((d) => ({ id: d.id, ...d.data() }))));
        setUsers(usersSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch { console.error("Erreur chargement"); }
      finally { dispatch(setLoading(false)); }
    };
    fetchData();
  }, [dispatch]);

  const totalVentes = orders.reduce((s, o) => s + (o.total || 0), 0);
  const stats = [
    { label: "Commandes", value: orders.length, color: "#007782" },
    { label: "Produits", value: products.length, color: "#764ba2" },
    { label: "Revenus", value: `${totalVentes.toLocaleString()} FCFA`, color: "#00d4ff" },
    { label: "Livrées", value: orders.filter((o) => o.status === "Livrée").length, color: "#10b981" },
  ];

  const revenusParMois = useMemo(() => {
    const mois = {};
    orders.forEach((o) => {
      if (o.date) {
        const m = new Date(o.date).toLocaleString("fr-FR", { month: "short" });
        mois[m] = (mois[m] || 0) + (o.total || 0);
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
    datasets: [{ label: "Revenus (FCFA)", data: Object.values(revenusParMois), backgroundColor: "#007782", borderRadius: 4 }],
  };

  const doughnutData = {
    labels: Object.keys(statusCount),
    datasets: [{ data: Object.values(statusCount), backgroundColor: ["#ffc800", "#00d4ff", "#7b2ff7", "#10b981"] }],
  };

  const nextStatus = { "Reçue": "En cours", "En cours": "Expédiée", "Expédiée": "Livrée", "Livrée": null };

  const handleStatus = async (order) => {
    const next = nextStatus[order.status];
    if (!next) return;
    try {
      await updateDoc(doc(db, "commandes", order.id), { status: next });
      dispatch(updateOrderStatus({ id: order.id, status: next }));
      toast.success(`Commande ${order.id.slice(0, 8)} → ${next}`);
    } catch { toast.error("Erreur mise à jour"); }
  };

  const handleRoleChange = async (u, newRole) => {
    try {
      await updateDoc(doc(db, "utilisateurs", u.id), { role: newRole });
      setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, role: newRole } : x));
      toast.success(`${u.nom || u.email} → ${newRole}`);
    } catch { toast.error("Erreur changement de rôle"); }
  };

  const handleOffreStatus = async (offre, newStatus) => {
    try {
      await updateDoc(doc(db, "offres", offre.id), { status: newStatus });
      dispatch(updateOffreStatus({ id: offre.id, status: newStatus }));
      toast.success(`Offre ${newStatus === "acceptée" ? "acceptée" : "refusée"}`);
    } catch { toast.error("Erreur mise à jour offre"); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Supprimer ce produit ?")) return;
    try {
      await deleteDoc(doc(db, "produits", id));
      dispatch(deleteProduct(id));
      toast.success("Produit supprimé");
    } catch { toast.error("Erreur suppression"); }
  };

  const openEdit = (prod) => {
    setEditProd(prod);
    setForm({ nom: prod.nom, prix: prod.prix?.toString() || "", categorie: prod.categorie || "Homme", tailles: (prod.tailles || []).join(", "), image: prod.image || "" });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = { nom: form.nom, prix: Number(form.prix), categorie: form.categorie, tailles: form.tailles.split(",").map((t) => t.trim()).filter(Boolean), image: form.image };
    try {
      if (editProd) {
        await updateDoc(doc(db, "produits", editProd.id), data);
        dispatch(updateProduct({ id: editProd.id, ...data }));
        toast.success("Produit modifié");
      } else {
        const ref = await addDoc(collection(db, "produits"), data);
        dispatch(addProduct({ id: ref.id, ...data }));
        toast.success("Produit ajouté");
      }
      setShowForm(false);
      setEditProd(null);
    } catch { toast.error("Erreur enregistrement"); }
  };

  const handleSeed = async () => {
    if (!confirm("Ajouter les 10 produits de démo dans Firestore ?")) return;
    try {
      await seedFirestore();
      toast.success("Base de données initialisée !");
      window.location.reload();
    } catch { toast.error("Erreur lors du seed"); }
  };

  const exportCSV = () => {
    const headers = "ID,Client,Total,Statut,Date\n";
    const rows = orders.map((o) => `${o.id},${o.client?.nom || "N/A"},${o.total || 0},${o.status},${o.date || ""}`).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "commandes.csv"; a.click();
    toast.success("CSV exporté");
  };

  return (
    <div className="dashboard">
      <div className="dash-header">
        <h2>Tableau de Bord</h2>
        <div className="dash-actions">
          <button className="btn-secondary" onClick={exportCSV}>📥 CSV</button>
          <button className="btn-secondary" onClick={handleSeed}>🌱 Seed DB</button>
          <button className="btn-primary" onClick={() => { setEditProd(null); setForm({ nom: "", prix: "", categorie: "Homme", tailles: "", image: "" }); setShowForm(true); }}>
            + Ajouter produit
          </button>
        </div>
      </div>

      <div className="stats-grid">
        {stats.map((s) => (
          <div key={s.label} className="stat-card" style={{ borderTopColor: s.color }}>
            <h3>{s.label}</h3>
            <p>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Revenus par mois</h3>
          {Object.keys(revenusParMois).length > 0 ? <Bar data={barData} options={{ responsive: true, plugins: { legend: { display: false } } }} /> : <p className="no-results">Aucune donnée</p>}
        </div>
        <div className="chart-card">
          <h3>Statut des commandes</h3>
          {Object.keys(statusCount).length > 0 ? <Doughnut data={doughnutData} options={{ responsive: true }} /> : <p className="no-results">Aucune donnée</p>}
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
            <h3>{editProd ? "Modifier" : "Ajouter"} un produit</h3>
            <input placeholder="Nom" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required />
            <input type="number" placeholder="Prix (FCFA)" value={form.prix} onChange={(e) => setForm({ ...form, prix: e.target.value })} required />
            <select value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })}>
              <option value="Homme">Homme</option>
              <option value="Femme">Femme</option>
              <option value="Accessoires">Accessoires</option>
            </select>
            <input placeholder="Tailles (S, M, L, XL)" value={form.tailles} onChange={(e) => setForm({ ...form, tailles: e.target.value })} />
            <input placeholder="URL image" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
            <div className="modal-actions">
              <button type="button" className="btn-clear" onClick={() => setShowForm(false)}>Annuler</button>
              <button type="submit" className="btn-primary">{editProd ? "Modifier" : "Ajouter"}</button>
            </div>
          </form>
        </div>
      )}

      <h3>Produits ({products.length})</h3>
      <div className="dash-table">
        {products.slice(0, 10).map((p) => (
          <div key={p.id} className="dash-row">
            <span><strong>{p.nom}</strong> — {p.prix?.toLocaleString()} FCFA <span className="dash-cat">{p.categorie}</span></span>
            <div className="dash-row-actions">
              <button className="btn-small" onClick={() => openEdit(p)}>Modifier</button>
              <button className="btn-small btn-danger" onClick={() => handleDelete(p.id)}>Supprimer</button>
            </div>
          </div>
        ))}
      </div>

      <h3 style={{ marginTop: 32 }}>Commandes récentes</h3>
      <div className="dash-table">
        {orders.slice(0, 10).map((order) => (
          <div key={order.id} className="dash-row">
            <div>
              <strong>#{order.id?.slice(0, 8)}</strong> — {order.client?.nom} — {order.total?.toLocaleString()} FCFA
              <span className={`badge-status ${order.status?.toLowerCase()}`}>{order.status}</span>
            </div>
            {nextStatus[order.status] && (
              <button className="btn-small" onClick={() => handleStatus(order)}>→ {nextStatus[order.status]}</button>
            )}
          </div>
        ))}
      </div>

      <h3 style={{ marginTop: 32 }}>Offres des clients ({offres.length})</h3>
      <div className="dash-table">
        {offres.slice(0, 20).map((offre) => (
          <div key={offre.id} className="dash-row">
            <div>
              <strong>{offre.clientNom}</strong> — {offre.produitNom} — <strong>{offre.montant?.toLocaleString()} FCFA</strong>
              <span className={`badge-status ${offre.status?.toLowerCase()}`}>{offre.status}</span>
            </div>
            {offre.status === "en_attente" && (
              <div className="dash-row-actions">
                <button className="btn-small" onClick={() => handleOffreStatus(offre, "acceptée")}>✅ Accepter</button>
                <button className="btn-small btn-danger" onClick={() => handleOffreStatus(offre, "refusée")}>❌ Refuser</button>
              </div>
            )}
          </div>
        ))}
        {offres.length === 0 && <p className="no-results" style={{ padding: 16 }}>Aucune offre pour le moment</p>}
      </div>

      <h3 style={{ marginTop: 32 }}>Utilisateurs ({users.length})</h3>
      <div className="dash-table">
        {users.map((u) => (
          <div key={u.id} className="dash-row">
            <div>
              <strong>{u.nom || "N/A"}</strong> — {u.email}
              <span className={`badge-status ${u.role}`}>{u.role}</span>
            </div>
            {u.role !== "admin" && (
              <div className="dash-row-actions">
                <button className="btn-small" onClick={() => handleRoleChange(u, u.role === "vendeur" ? "client" : "vendeur")}>
                  Passer {u.role === "vendeur" ? "client" : "vendeur"}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
