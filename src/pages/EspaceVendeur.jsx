import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc, query, where } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { setProducts, addProduct, updateProduct, deleteProduct } from "../store/productsSlice";
import { setOffres, updateOffreStatus } from "../store/offresSlice";
import toast from "react-hot-toast";

function EspaceVendeur() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const productsStore = useSelector((state) => state.products.items);
  const offres = useSelector((state) => state.offres.items);
  const [showForm, setShowForm] = useState(false);
  const [editProd, setEditProd] = useState(null);
  const [form, setForm] = useState({ nom: "", prix: "", categorie: "Homme", tailles: "", image: "" });

  const mesProduits = productsStore.filter((p) => p.vendeurId === user?.uid);
  const mesOffres = offres.filter((o) => o.vendeurId === user?.uid);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        const [prodsSnap, offresSnap] = await Promise.all([
          getDocs(query(collection(db, "produits"), where("vendeurId", "==", user.uid))),
          getDocs(query(collection(db, "offres"), where("vendeurId", "==", user.uid))),
        ]);
        const allProds = await getDocs(collection(db, "produits"));
        dispatch(setProducts(allProds.docs.map((d) => ({ id: d.id, ...d.data() }))));
        dispatch(setOffres(offresSnap.docs.map((d) => ({ id: d.id, ...d.data() }))));
      } catch { console.error("Erreur chargement"); }
    };
    fetchData();
  }, [user, dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return toast.error("Connecte-toi d'abord");
    const data = {
      nom: form.nom,
      prix: Number(form.prix),
      categorie: form.categorie,
      tailles: form.tailles.split(",").map((t) => t.trim()).filter(Boolean),
      image: form.image || "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop",
      vendeurId: user.uid,
      vendeurNom: user.nom || user.email,
    };
    try {
      if (editProd) {
        await updateDoc(doc(db, "produits", editProd.id), data);
        dispatch(updateProduct({ id: editProd.id, ...data }));
        toast.success("Produit modifié");
      } else {
        const ref = await addDoc(collection(db, "produits"), data);
        dispatch(addProduct({ id: ref.id, ...data }));
        toast.success("Produit ajouté ! Il apparaît dans le catalogue.");
      }
      setShowForm(false);
      setEditProd(null);
    } catch { toast.error("Erreur enregistrement"); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Supprimer ce produit ?")) return;
    try {
      await deleteDoc(doc(db, "produits", id));
      dispatch(deleteProduct(id));
      toast.success("Produit supprimé");
    } catch { toast.error("Erreur suppression"); }
  };

  const handleOffreStatus = async (offre, newStatus) => {
    try {
      await updateDoc(doc(db, "offres", offre.id), { status: newStatus });
      dispatch(updateOffreStatus({ id: offre.id, status: newStatus }));
      toast.success(`Offre ${newStatus === "acceptée" ? "acceptée ✅" : "refusée ❌"}`);
    } catch { toast.error("Erreur"); }
  };

  const openEdit = (prod) => {
    setEditProd(prod);
    setForm({
      nom: prod.nom,
      prix: prod.prix?.toString() || "",
      categorie: prod.categorie || "Homme",
      tailles: (prod.tailles || []).join(", "),
      image: prod.image || "",
    });
    setShowForm(true);
  };

  return (
    <div className="dashboard">
      <div className="dash-header">
        <h2>Mon Espace Vendeur</h2>
        <button className="btn-primary" onClick={() => { setEditProd(null); setForm({ nom: "", prix: "", categorie: "Homme", tailles: "", image: "" }); setShowForm(true); }}>
          + Ajouter un produit
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
            <h3>{editProd ? "Modifier" : "Ajouter"} un produit</h3>
            <input placeholder="Nom du produit" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required />
            <input type="number" placeholder="Prix (FCFA)" value={form.prix} onChange={(e) => setForm({ ...form, prix: e.target.value })} required />
            <select value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })}>
              <option value="Homme">Homme</option>
              <option value="Femme">Femme</option>
              <option value="Accessoires">Accessoires</option>
            </select>
            <input placeholder="Tailles (séparées par des virgules : S, M, L)" value={form.tailles} onChange={(e) => setForm({ ...form, tailles: e.target.value })} />
            <input placeholder="URL image (optionnelle)" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
            <div className="modal-actions">
              <button type="button" className="btn-clear" onClick={() => setShowForm(false)}>Annuler</button>
              <button type="submit" className="btn-primary">{editProd ? "Modifier" : "Ajouter"}</button>
            </div>
          </form>
        </div>
      )}

      <h3>Mes Produits ({mesProduits.length})</h3>
      <div className="dash-table">
        {mesProduits.length === 0 && <p className="no-results" style={{ padding: 16 }}>Tu n'as pas encore de produit. Ajoutes-en un !</p>}
        {mesProduits.map((p) => (
          <div key={p.id} className="dash-row">
            <span><strong>{p.nom}</strong> — {p.prix?.toLocaleString()} FCFA <span className="dash-cat">{p.categorie}</span></span>
            <div className="dash-row-actions">
              <button className="btn-small" onClick={() => openEdit(p)}>Modifier</button>
              <button className="btn-small btn-danger" onClick={() => handleDelete(p.id)}>Supprimer</button>
            </div>
          </div>
        ))}
      </div>

      <h3 style={{ marginTop: 32 }}>Offres reçues ({mesOffres.length})</h3>
      <div className="dash-table">
        {mesOffres.length === 0 && <p className="no-results" style={{ padding: 16 }}>Aucune offre reçue pour le moment</p>}
        {mesOffres.map((offre) => (
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
      </div>
    </div>
  );
}

export default EspaceVendeur;
