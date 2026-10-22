# Cyrano — marketplace mode au Gabon

Cyrano est une application web de marketplace de seconde main : les clients parcourent le catalogue, ajoutent des articles au panier ou font une offre, les vendeurs gèrent leurs produits et les commandes reçues, et l'administration supervise la plateforme.

**Application en ligne :** https://cyrano-ecommerce.web.app  
**Projet Firebase :** `cyrano-ecommerce`

---

## Sommaire

- [Fonctionnalités](#fonctionnalités)
- [Stack](#stack)
- [Démarrage rapide](#démarrage-rapide)
- [Variables d'environnement](#variables-denvironnement)
- [Scripts](#scripts)
- [Rôles et accès](#rôles-et-accès)
- [Règles métier](#règles-métier)
- [Architecture](#architecture)
- [Modèle de données Firestore](#modèle-de-données-firestore)
- [Sécurité](#sécurité)
- [Déploiement](#déploiement)
- [Tests](#tests)
- [Limites connues](#limites-connues)

---

## Fonctionnalités

### Client

- Catalogue avec recherche, catégories, tailles, fourchette de prix, tri et liste progressive.
- Fiche produit : galerie, état, tailles, stock, vendeur, avis, articles similaires.
- Panier persistant (`localStorage`) avec quantités bornées au stock.
- Favoris persistants et page dédiée.
- Checkout : adresse, téléphone, ville, moyen de paiement simulé (Airtel Money, Moov Money, livraison).
- Suivi de commande par étapes : Reçue → En cours → Expédiée → Livrée.
- Offres de prix envoyées au vendeur du produit.
- Espace profil, modification du nom, suppression du compte.

### Vendeur

- Inscription libre avec le rôle « vendeur ».
- Création, modification et suppression de ses produits.
- Upload d'image (Firebase Storage quand il est activé) ou URL d'image.
- Offres reçues : accepter / refuser.
- Commandes contenant ses articles, coordonnées de livraison, revenus.
- Statistiques : produits en ligne, offres en attente, commandes, revenus.

### Administrateur

- Tableau de bord : revenus, commandes, produits, utilisateurs, offres en attente.
- Graphiques (revenus par mois, statuts des commandes).
- Gestion des produits, des offres, des commandes et des rôles.
- Export CSV sécurisé contre l'injection de formules.
- Aucun lien client (panier, favoris, messages) dans la navigation.

### Transverse

- Design system responsive, thème clair teal `#007782`, navigation mobile + barre inférieure.
- Pages en chargement différé, découpage des bundles `react` / `firebase` / `charts`.
- Gestion des erreurs de rendu (`ErrorBoundary`), états de chargement, toasts.
- En-têtes de sécurité et CSP sur Firebase Hosting.
- Accessibilité : labels, `aria-*`, contrastes, navigation clavier, Lighthouse 100 sur l'accueil (accessibilité, bonnes pratiques, SEO).

---

## Stack

| Couche | Technologie |
|---|---|
| UI | React 19, React Router 7, CSS custom (design system) |
| État | Redux Toolkit, React Redux |
| Build | Vite 8, ESLint 10 |
| Backend | Firebase Authentication, Cloud Firestore |
| Images | Firebase Storage (optionnel), URLs externes |
| Graphiques | Chart.js / react-chartjs-2 |
| Tests | Vitest, Testing Library, jsdom |
| Hébergement | Firebase Hosting |

---

## Démarrage rapide

**Prérequis :** Node.js 20.19+ (ou 22.12+), npm, Firebase CLI (`npm i -g firebase-tools`).

```bash
git clone https://github.com/Cyrano120/tp-windows.git
cd tp-windows/cyrano
npm install
cp .env.example .env
# Renseigner les valeurs Firebase dans .env
npm run dev
```

L'application démarre sur `http://localhost:5173`.

### Configuration Firebase minimale

1. Créer un projet Firebase (ou utiliser `cyrano-ecommerce`).
2. Activer **Authentication → Email/Password**.
3. Créer une base **Firestore** en mode production.
4. Copier la configuration Web (Paramètres du projet → Vos applications).
5. Déployer les règles :

```bash
firebase login
firebase use cyrano-ecommerce
firebase deploy --only firestore:rules
```

> Le fichier `.env` est ignoré par Git. Les clés `VITE_*` sont visibles dans le bundle : ce n'est pas un secret. La sécurité repose sur les règles Firestore, l'authentification et App Check (à activer en production).

---

## Variables d'environnement

| Variable | Exemple | Rôle |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | `AIza...` | Clé Web Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | `cyrano-ecommerce.firebaseapp.com` | Domaine Auth |
| `VITE_FIREBASE_PROJECT_ID` | `cyrano-ecommerce` | ID du projet |
| `VITE_FIREBASE_STORAGE_BUCKET` | `cyrano-ecommerce.firebasestorage.app` | Bucket Storage |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `123456789` | Sender ID |
| `VITE_FIREBASE_APP_ID` | `1:123:web:abc` | App ID |

---

## Scripts

| Commande | Description |
|---|---|
| `npm run dev` | Serveur de développement Vite |
| `npm run build` | Build de production dans `dist/` |
| `npm run preview` | Prévisualisation du build |
| `npm run lint` | Analyse ESLint |
| `npm test` | Tests Vitest (une passe) |

---

## Rôles et accès

Le rôle est stocké dans `utilisateurs/{uid}.role` et chargé au login par `src/services/profil.js`.

| Route | Client | Vendeur | Admin |
|---|:---:|:---:|:---:|
| `/`, `/catalogue`, `/produit/:id`, `/vendeur/:nom` | ✅ | ✅ | ✅ |
| `/panier`, `/checkout`, `/suivi`, `/favoris`, `/messages` | ✅ | ✅* | ❌ |
| `/profil` | ✅ | ✅ | ✅ |
| `/espace-vendeur` | ❌ | ✅ | ✅ (redirigé vers le dashboard) |
| `/dashboard` | ❌ | ❌ | ✅ |

\* Les routes client sont techniquement accessibles à un vendeur par URL, mais les liens sont masqués. L'admin n'a aucun lien client dans l'interface.

**Compte administrateur :** `admin@cyrano.com` (bootstrap). Voir la section Sécurité : ce mécanisme doit être remplacé par un custom claim avant production.

---

## Règles métier

- **Livraison :** 1 500 FCFA, offerte à partir de 50 000 FCFA de sous-total.
- **Prix :** toujours recalculés depuis le catalogue au checkout, jamais depuis le panier local.
- **Stock :** quantité bornée au stock ; un produit à `stock: 0` ne peut pas être ajouté ni commandé.
- **Auto-achat :** un vendeur ne peut pas acheter son propre article.
- **Offres :** montant strictement inférieur au prix affiché, statut initial `en_attente`, seul le vendeur concerné peut accepter/refuser.
- **Commandes :** statut initial `Reçue`, progression `Reçue → En cours → Expédiée → Livrée`.
- **Avis :** note de 1 à 5, texte de 5 à 1 000 caractères.
- **Produits de démonstration :** 12 articles définis dans `src/data/catalogue.js`, fusionnés avec Firestore et dédoublonnés par `id`.

---

## Architecture

```
cyrano/
├── public/
│   ├── favicon.svg
│   ├── robots.txt
│   └── sitemap.xml
├── src/
│   ├── assets/                 # Images statiques
│   ├── components/             # Header, Footer, ArticleCard, guards, ErrorBoundary
│   ├── data/catalogue.js       # Catalogue démo + normalisation
│   ├── firebase/
│   │   ├── firebase.js         # Initialisation Firebase
│   │   └── upload.js           # Upload Storage
│   ├── hooks/useInfiniteScroll.js
│   ├── pages/                  # Une page = une route
│   ├── services/profil.js      # Chargement/migration du profil
│   ├── store/                  # Slices Redux + persistance localStorage
│   ├── utils/                  # totaux, statuts, maths
│   ├── __tests__/              # Tests Vitest
│   ├── App.jsx                 # Routeur + auth listener + lazy routes
│   ├── App.css                 # Design system
│   └── main.jsx
├── firestore.rules             # Règles Firestore
├── storage.rules               # Règles Storage (à déployer après activation)
├── firebase.json               # Hosting, CSP, cache, rewrites
├── vite.config.js              # Build + chunks + Vitest
├── AUDIT.md                    # Audit sécurité / architecture
└── README.md
```

### Principes

- **Séparation UI / métier :** les calculs purs sont dans `src/utils` et `src/data` ; les pages composent.
- **Source de vérité produit :** démos locales + Firestore, normalisées par `normaliserProduit`.
- **Source de vérité panier :** Redux + `localStorage` pour l'UX ; le checkout revalide tout côté serveur (Firestore) avant écriture.
- **Chargement différé :** chaque page est un chunk séparé ; les vendors sont découpés pour le cache.
- **Routes protégées :** `RequireAuth` attend que l'état d'authentification soit prêt avant de rediriger.

---

## Modèle de données Firestore

### `utilisateurs/{uid}`

```js
{
  nom: "Alice Mba",
  email: "alice@example.com",
  role: "client" | "vendeur" | "admin",
  ville: "Libreville",
  createdAt: Timestamp,
  dateInscription: "2026-10-22T..."
}
```

### `produits/{id}`

```js
{
  nom: "Chemise en lin",
  prix: 15000,
  categorie: "Homme",
  etat: "Très bon état",
  marque: "Zara",
  tailles: ["S", "M", "L"],
  stock: 3,
  desc: "...",
  image: "https://...",
  vendeurId: "<uid>",
  vendeurNom: "Alice Mode",
  ville: "Libreville",
  note: 0,
  nbAvis: 0,
  createdAt: Timestamp
}
```

### `offres/{id}`

```js
{
  produitId: "abc",
  produitNom: "Chemise en lin",
  clientId: "<uid>",
  clientNom: "Alice Mba",
  vendeurId: "<uid>",
  vendeurNom: "Alice Mode",
  montant: 12000,
  status: "en_attente" | "acceptée" | "refusée",
  date: "2026-10-22T...",
  createdAt: Timestamp
}
```

### `commandes/{id}`

```js
{
  clientId: "<uid>",
  clientEmail: "alice@example.com",
  client: { nom, tel, adresse, ville, note, email },
  articles: [{ id, nom, prix, quantity, taille, image, vendeurId, vendeurNom }],
  vendeurs: ["<uid>", "..."],
  sousTotal: 30000,
  livraison: 1500,
  total: 31500,
  paiement: "Airtel Money",
  status: "Reçue",
  date: "2026-10-22T...",
  createdAt: Timestamp
}
```

### `avis/{id}`

```js
{
  produitId: "abc",
  clientId: "<uid>",
  auteur: "Alice Mba",
  note: 5,
  texte: "Très bonne qualité.",
  date: "2026-10-22T...",
  createdAt: Timestamp
}
```

### `conversations/{id}`

Modèle prévu pour la messagerie temps réel (actuellement non utilisé par l'interface) :

```js
{
  participants: ["<uid1>", "<uid2>"],
  productId: "abc",
  productName: "Chemise en lin",
  lastMessageAt: Timestamp,
  messages: [{ id, from, text, date }]
}
```

---

## Sécurité

- Règles Firestore **au moindre privilège**, refus par défaut (`firestore.rules`).
- Lecture des commandes limitée au client, aux vendeurs du tableau `vendeurs`, et à l'admin.
- Un utilisateur ne peut pas se donner le rôle admin via `update` (rôle immuable côté client).
- Un vendeur ne peut modifier que ses propres produits et ne peut pas se réapproprier un produit.
- CSP, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`.
- `index.html` en `no-cache`, assets hachés en `immutable`.
- Export CSV protégé contre l'injection de formules.
- **À faire avant production :** validation serveur des commandes (Cloud Functions), custom claims admin, App Check, stock transactionnel, vérification d'achat pour les avis, email vérifié. Détails et priorités dans [`AUDIT.md`](./AUDIT.md).

---

## Déploiement

```bash
# 1. Vérifications
npm run lint
npm test
npm run build

# 2. Règles Firestore
firebase deploy --only firestore:rules --project cyrano-ecommerce

# 3. Hébergement
firebase deploy --only hosting --project cyrano-ecommerce

# 4. Tout (hors Storage tant qu'il n'est pas activé)
firebase deploy --only hosting,firestore:rules --project cyrano-ecommerce
```

### Activer Firebase Storage (optionnel)

L'upload d'image est déjà codé et les règles existent, mais Storage n'est pas provisionné sur le projet. Pour l'activer :

1. Console Firebase → **Storage** → **Get Started**.
2. Ajouter dans `firebase.json` :

```json
"storage": { "rules": "storage.rules" }
```

3. Déployer :

```bash
firebase deploy --only storage
```

Sans Storage, le vendeur peut toujours coller une URL d'image ; l'upload échoue avec un message explicite.

---

## Tests

```bash
npm test
```

Couverture actuelle :

- calcul des totaux et seuil de livraison gratuite ;
- normalisation des produits (démo et Firestore) ;
- panier : fusion par taille, plafonnement au stock, refus d'un article en rupture ;
- fonctions mathématiques.

Les tests des règles Firestore, des parcours d'authentification et du checkout serveur restent à ajouter (voir `AUDIT.md`).

---

## Limites connues

- **Messagerie** : locale au navigateur (Redux), pas encore temps réel entre utilisateurs.
- **Paiement** : simulé, aucune transaction Mobile Money réelle.
- **Commandes** : créées côté client ; la validation serveur et le décrément de stock sont à implémenter (priorité P0 de l'audit).
- **Storage** : non provisionné ; upload désactivé, fallback URL.
- **Admin** : bootstrap par email `admin@cyrano.com`, à remplacer par un custom claim.
- **SEO** : SPA, meta statiques pour l'accueil ; pas de pré-rendu par produit.
- **Produits démo** : pas de `vendeurId`, donc pas d'offre routée vers un vendeur réel.
- **Panier/favoris** : partagés par navigateur, pas par compte.
- **Pagination** : côté client ; l'admin charge tous les documents.
- **Dépendances** : `npm audit` signale 4 alertes hautes transitives `@grpc/grpc-js` (code Node de Firestore, absent du bundle web). Ne pas utiliser `npm audit fix --force`, qui rétrograde Firebase en 9.x.

---

## Licence

Projet pédagogique réalisé dans le cadre d'un TP Windows / développement web. Aucune licence commerciale n'est accordée par défaut.
