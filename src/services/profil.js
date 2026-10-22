import { collection, doc, getDoc, getDocs, query, setDoc, where } from "firebase/firestore";
import { db } from "../firebase/firebase";

/**
 * Charge le profil applicatif d'un utilisateur Firebase.
 *
 * Cas couvert : les anciens comptes dont le document Firestore a été créé
 * avec un ID auto-généré (au lieu de l'UID). On retrouve alors le document
 * par email, puis on le migre vers un document dont l'ID = UID.
 * C'est ce qui pouvait empêcher un admin d'être reconnu comme tel.
 */
export async function chargerProfil(utilisateur) {
  const base = {
    uid: utilisateur.uid,
    email: utilisateur.email,
    nom: utilisateur.displayName || utilisateur.email,
    role: utilisateur.email === "admin@cyrano.com" ? "admin" : "client",
    ville: "",
  };

  try {
    const snap = await getDoc(doc(db, "utilisateurs", utilisateur.uid));
    if (snap.exists()) {
      const data = snap.data();
      return {
        ...base,
        nom: data.nom || base.nom,
        role: utilisateur.email === "admin@cyrano.com" ? "admin" : (data.role || "client"),
        ville: data.ville || "",
      };
    }

    if (utilisateur.email) {
      const recherche = await getDocs(
        query(collection(db, "utilisateurs"), where("email", "==", utilisateur.email))
      );
      if (!recherche.empty) {
        const data = recherche.docs[0].data();
        const profil = {
          ...base,
          nom: data.nom || base.nom,
          role: utilisateur.email === "admin@cyrano.com" ? "admin" : (data.role || "client"),
          ville: data.ville || "",
        };
        try {
          await setDoc(doc(db, "utilisateurs", utilisateur.uid), {
            nom: profil.nom,
            email: profil.email,
            role: profil.role,
            ville: profil.ville,
            migreLe: new Date().toISOString(),
          }, { merge: true });
        } catch {
          /* la migration est un bonus : on continue avec le profil trouvé */
        }
        return profil;
      }
    }
  } catch {
    /* profil illisible : on retombe sur un profil client minimal */
  }

  return base;
}
