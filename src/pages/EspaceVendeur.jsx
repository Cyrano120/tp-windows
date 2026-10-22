import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  addDoc, collection, deleteDoc, doc, getDocs, query, serverTimestamp, updateDoc, where,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { uploadImage } from "../firebase/upload";
import { addProduct, deleteProduct, setProducts, updateProduct } from "../store/productsSlice";
import { setOffres, updateOffreStatus } from "../store/offresSlice";
import { ETATS } from "../data/catalogue";
import { statutSlug } from "../utils/statut";
import toast from "react-hot-toast";

const FORM_VIDE = {
  nom: "", prix: "", categorie: "Homme", etat: "Très bon état", marque: "",
  tailles: "", stock: "1", desc: "", image: "",
};

const ONGLETS = [
  { id: "produits", label: "Mes produits" },
  { id: "offres", label: "Offres reçues" },
  { id: "commandes", label: "Commandes" },
];

export default function EspaceVendeur() {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const produitsStore = useSelector((s) => s.products.items);
  const offres = useSelector((s) => s.offres.items);

  const [commandes, setCommandes] = useState([]);
  const [onglet, setOnglet] = useState("produits");
  const [showForm, setShowForm] = useState(false);
  const [editProd, setEditProd] = useState(null);
  const [form, setForm] = useState(FORM_VIDE);
  const [uploadEnCours, setUploadEnCours] = useState(false);
  const [chargement, setChargement] = useState(true);

  const mesProduits = useMemo(
    () => produitsStore.filter((p) => p.vendeurId === user?.uid),
    [produitsStore, user]
  );
  const mesOffres = useMemo(() => offres.filter((o) => o.vendeurId === user?.uid), [offres, user]);

  const revenus = useMemo(() => {
    let total = 0;
    commandes.forEach((cmd) => {
      (cmd.articles || []).forEach((a) => {
        if (a.vendeurId === user?.uid) total += Number(a.prix) * Number(a.quantity);
      });
    });
    return total;
  }, [commandes, user]);

  useEffect(() => {
    if (!user) return;
    let actif = true;
    (async () => {
      try {
        const [prodsSnap, offresSnap, cmdSnap] = await Promise.all([
          getDocs(query(collection(db, "produits"), where("vendeurId", "==", user.uid))),
          getDocs(query(collection(db, "offres"), where("vendeurId", "==", user.uid))),
          getDocs(query(collection(db, "commandes"), where("vendeurs", "array-contains", user.uid))),
        ]);
        if (!actif) return;
        dispatch(setProducts(prodsSnap.docs.map((d) => ({ id: d.id, ...d.data() }))));
        dispatch(setOffres(offresSnap.docs.map((d) => ({ id: d.id, ...d.data() }))));
        setCommandes(cmdSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch {
        if (actif) toast.error("Erreur de chargement de ton espace vendeur.");
      } finally {
        if (actif) setChargement(false);
      }
    })();
    return () => { actif = false; };
  }, [user, dispatch]);

  const ouvrirCreation = () => {
    setEditProd(null);
    setForm(FORM_VIDE);
    setShowForm(true);
  };

  const openEdit = (prod) => {
    setEditProd(prod);
    setForm({
      nom: prod.nom || "",
      prix: prod.prix?.toString() || "",
      categorie: prod.categorie || "Homme",
      etat: prod.etat || "Très bon état",
      marque: prod.marque || "",
      tailles: (prod.tailles || []).join(", "),
      stock: String(prod.stock ?? 1),
      desc: prod.desc || "",
      image: prod.image || "",
    });
    setShowForm(true);
  };

  const uploaderImage = async (e) => {
    const fichier = e.target.files?.[0];
    if (!fichier) return;
    if (!fichier.type.startsWith("image/")) return toast.error("Choisis un fichier image.");
    if (fichier.size > 5 * 1024 * 1024) return toast.error("Image trop lourde (5 Mo maximum).");
    setUploadEnCours(true);
    try {
      const url = await uploadImage(fichier, `produits/${user.uid}`);
      setForm((f) => ({ ...f, image: url }));
      toast.success("Image envoyée");
    } catch {
      toast.error("Échec de l'envoi de l'image. Tu peux coller une URL.");
    } finally {
      setUploadEnCours(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const prix = Number(form.prix);
    if (!form.nom.trim() || form.nom.trim().length < 3) return toast.error("Nom du produit trop court.");
    if (!Number.isFinite(prix) || prix <= 0) return toast.error("Le prix doit être supérieur à 0.");
    if (!Number.isInteger(Number(form.stock)) || Number(form.stock) < 0) return toast.error("Stock invalide.");

    const data = {
      nom: form.nom.trim(),
      prix,
      categorie: form.categorie,
      etat: form.etat,
      marque: form.marque.trim(),
      tailles: form.tailles.split(",").map((t) => t.trim()).filter(Boolean),
      stock: Number(form.stock),
      desc: form.desc.trim(),
      image: form.image.trim() || "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=700&h=900&fit=crop",
      vendeurId: user.uid,
      vendeurNom: user.nom || user.email,
      ville: user.ville || "",
      note: editProd?.note ?? 0,
      nbAvis: editProd?.nbAvis ?? 0,
    };

    try {
      if (editProd) {
        await updateDoc(doc(db, "produits", editProd.id), data);
        dispatch(updateProduct({ ...editProd, ...data }));
        toast.success("Produit modifié");
      } else {
        const ref = await addDoc(collection(db, "produits"), { ...data, createdAt: serverTimestamp() });
        dispatch(addProduct({ id: ref.id, ...data }));
        toast.success("Produit ajouté au catalogue !");
      }
      setShowForm(false);
      setEditProd(null);
      setForm(FORM_VIDE);
    } catch {
      toast.error("Erreur lors de l'enregistrement.");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Supprimer définitivement ce produit ?")) return;
    try {
      await deleteDoc(doc(db, "produits", id));
      dispatch(deleteProduct(id));
      toast.success("Produit supprimé");
    } catch {
      toast.error("Erreur lors de la suppression.");
    }
  };

  const handleOffreStatus = async (offre, newStatus) => {
    try {
      await updateDoc(doc(db, "offres", offre.id), { status: newStatus });
      dispatch(updateOffreStatus({ id: offre.id, status: newStatus }));
      toast.success(`Offre ${newStatus === "acceptée" ? "acceptée ✅" : "refusée ❌"}`);
    } catch {
      toast.error("Erreur lors de la mise à jour de l'offre.");
    }
  };

  if (user?.role === "admin") {
    return (
      <div className="empty-state">
        <span className="empty-emoji">🛠️</span>
        <h2>Espace vendeur</h2>
        <p>Tu es connecté en tant qu'administrateur. Utilise le tableau de bord pour superviser la plateforme.</p>
        <Link to="/dashboard" className="btn-primary">Aller au tableau de bord</Link>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dash-header">
        <div>
          <h2>Mon espace vendeur</h2>
          <p className="dash-sub">Gère tes articles, répondez aux offres et suis tes ventes.</p>
        </div>
        <button className="btn-primary" onClick={ouvrirCreation}>+ Ajouter un produit</button>
      </div>

      <div className="stats-grid">
        <div className="stat-card" style={{ "--stat-color": "#007782" }}>
          <h3>Produits en ligne</h3><p>{mesProduits.length}</p>
        </div>
        <div className="stat-card" style={{ "--stat-color": "#b54708" }}>
          <h3>Offres en attente</h3><p>{mesOffres.filter((o) => o.status === "en_attente").length}</p>
        </div>
        <div className="stat-card" style={{ "--stat-color": "#175cd3" }}>
          <h3>Commandes reçues</h3><p>{commandes.length}</p>
        </div>
        <div className="stat-card" style={{ "--stat-color": "#067647" }}>
          <h3>Revenus</h3><p style={{ fontSize: 20 }}>{revenus.toLocaleString("fr-FR")} FCFA</p>
        </div>
      </div>

      <div className="tabs" role="tablist">
        {ONGLETS.map((o) => (
          <button key={o.id} role="tab" aria-selected={onglet === o.id} className={`tab ${onglet === o.id ? "active" : ""}`} onClick={() => setOnglet(o.id)}>
            {o.label}
            {o.id === "offres" && mesOffres.filter((x) => x.status === "en_attente").length > 0 && (
              <span className="badge" style={{ marginLeft: 6 }}>{mesOffres.filter((x) => x.status === "en_attente").length}</span>
            )}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit} style={{ maxWidth: 560 }}>
            <h3>{editProd ? "Modifier l'article" : "Ajouter un article"}</h3>
            <label htmlFor="p-nom">Titre</label>
            <input id="p-nom" placeholder="Ex. Chemise en lin beige" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label htmlFor="p-prix">Prix (FCFA)</label>
                <input id="p-prix" type="number" min="1" placeholder="15000" value={form.prix} onChange={(e) => setForm({ ...form, prix: e.target.value })} required />
              </div>
              <div>
                <label htmlFor="p-stock">Stock</label>
                <input id="p-stock" type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} required />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label htmlFor="p-cat">Catégorie</label>
                <select id="p-cat" value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })}>
                  <option>Homme</option><option>Femme</option><option>Accessoires</option>
                </select>
              </div>
              <div>
                <label htmlFor="p-etat">État</label>
                <select id="p-etat" value={form.etat} onChange={(e) => setForm({ ...form, etat: e.target.value })}>
                  {ETATS.map((etat) => <option key={etat}>{etat}</option>)}
                </select>
              </div>
            </div>

            <label htmlFor="p-marque">Marque (optionnel)</label>
            <input id="p-marque" placeholder="Zara, Nike…" value={form.marque} onChange={(e) => setForm({ ...form, marque: e.target.value })} />

            <label htmlFor="p-tailles">Tailles (séparées par des virgules)</label>
            <input id="p-tailles" placeholder="S, M, L" value={form.tailles} onChange={(e) => setForm({ ...form, tailles: e.target.value })} />

            <label htmlFor="p-desc">Description</label>
            <textarea id="p-desc" placeholder="Décris l'article, sa matière, ses défauts éventuels…" value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} />

            <label htmlFor="p-image">Photo</label>
            <input id="p-image" placeholder="URL de l'image" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
            <input type="file" accept="image/*" onChange={uploaderImage} aria-label="Téléverser une photo" />
            {uploadEnCours && <p style={{ fontSize: 12.5, color: "var(--c-primary)" }}>Envoi de l'image…</p>}
            {form.image && <img src={form.image} alt="Aperçu" style={{ width: "100%", height: 170, objectFit: "cover", borderRadius: 10 }} />}

            <div className="modal-actions">
              <button type="button" className="btn-clear" onClick={() => setShowForm(false)}>Annuler</button>
              <button type="submit" className="btn-primary" disabled={uploadEnCours}>{editProd ? "Enregistrer" : "Publier l'article"}</button>
            </div>
          </form>
        </div>
      )}

      {chargement ? (
        <p className="loading">Chargement…</p>
      ) : (
        <>
          {onglet === "produits" && (
            <div className="dash-table">
              {mesProduits.length === 0 && (
                <div className="dash-empty">
                  <p>Tu n'as pas encore de produit.</p>
                  <button className="btn-primary btn-sm" onClick={ouvrirCreation} style={{ marginTop: 12 }}>Publier mon premier article</button>
                </div>
              )}
              {mesProduits.map((p) => (
                <div key={p.id} className="dash-row">
                  <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                    <img src={p.image} alt="" style={{ width: 42, height: 54, objectFit: "cover", borderRadius: 8 }} />
                    <div>
                      <strong>{p.nom}</strong>
                      <div className="dash-cat">{p.categorie} · {p.etat} · stock {p.stock ?? 1}</div>
                    </div>
                  </div>
                  <div className="dash-row-actions">
                    <span style={{ fontWeight: 700, marginRight: 6 }}>{p.prix?.toLocaleString("fr-FR")} FCFA</span>
                    <Link to={`/produit/${p.id}`} className="btn-small">Voir</Link>
                    <button className="btn-small" onClick={() => openEdit(p)}>Modifier</button>
                    <button className="btn-small btn-danger" onClick={() => handleDelete(p.id)}>Supprimer</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {onglet === "offres" && (
            <div className="dash-table">
              {mesOffres.length === 0 && <div className="dash-empty">Aucune offre reçue pour le moment.</div>}
              {mesOffres.map((offre) => (
                <div key={offre.id} className="dash-row">
                  <div>
                    <strong>{offre.clientNom}</strong> propose <strong>{offre.montant?.toLocaleString("fr-FR")} FCFA</strong> pour {offre.produitNom}
                    <span className={`badge-status ${statutSlug(offre.status)}`}>{offre.status}</span>
                    <div className="dash-cat">{offre.date ? new Date(offre.date).toLocaleDateString("fr-FR") : ""}</div>
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
          )}

          {onglet === "commandes" && (
            <div className="dash-table">
              {commandes.length === 0 && <div className="dash-empty">Aucune commande reçue pour le moment.</div>}
              {commandes.map((cmd) => {
                const mesLignes = (cmd.articles || []).filter((a) => a.vendeurId === user.uid);
                const totalVendeur = mesLignes.reduce((s, a) => s + a.prix * a.quantity, 0);
                return (
                  <div key={cmd.id} className="dash-row" style={{ alignItems: "flex-start" }}>
                    <div>
                      <strong>#{cmd.id.slice(0, 8).toUpperCase()}</strong> — {cmd.client?.nom || cmd.clientNom || "Client"}
                      <span className={`badge-status ${statutSlug(cmd.status)}`}>{cmd.status}</span>
                      <div className="dash-cat" style={{ margin: "4px 0" }}>
                        {mesLignes.map((a) => `${a.nom}${a.taille ? ` (${a.taille})` : ""} × ${a.quantity}`).join(" · ")}
                      </div>
                      <div className="dash-cat">
                        📞 {cmd.client?.tel || "—"} · 📍 {cmd.client?.adresse || "—"}
                      </div>
                    </div>
                    <strong>{totalVendeur.toLocaleString("fr-FR")} FCFA</strong>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
