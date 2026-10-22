import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "./firebase";

/**
 * Téléverse une image dans Firebase Storage et renvoie son URL publique.
 * Le chemin est cloisonné par utilisateur pour éviter les collisions.
 */
export async function uploadImage(file, path = "produits") {
  const nomPropre = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storageRef = ref(storage, `${path}/${Date.now()}_${nomPropre}`);
  const snapshot = await uploadBytes(storageRef, file);
  return getDownloadURL(snapshot.ref);
}
