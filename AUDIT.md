# Audit Cyrano — sécurité, logique métier et architecture

**Date :** 22 octobre 2026  
**Périmètre :** application React/Vite, Redux Toolkit, Firebase Auth + Firestore, règles de sécurité, hébergement.  
**Version auditée :** `cyrano` (commit `7221c74` + changements en cours)  
**Application :** https://cyrano-ecommerce.web.app

---

## 1. Synthèse

L'application est solide pour un projet académique : interface complète, rôles client / vendeur / admin, règles Firestore au moindre privilège, en-têtes de sécurité, build découpé et tests unitaires.

Les risques restants ne sont pas cosmétiques : **la confiance accordée au client pour créer une commande** et **le bootstrap admin par email** sont les deux points à corriger avant toute mise en production réelle. La messagerie, bien que présentée dans l'interface, **ne fonctionne pas entre deux utilisateurs** (elle reste dans le Redux local).

| Sévérité | Nombre | À traiter |
|---|---:|---|
| 🔴 Critique | 2 | Avant production |
| 🟠 Élevé | 4 | Sprint suivant |
| 🟡 Moyen | 7 | Backlog priorisé |
| 🔵 Faible | 6 | Amélioration continue |

**Top 3 des priorités :**

1. Déplacer la création de commande dans une **Cloud Function transactionnelle** (prix, stock, totaux, décrément).
2. Remplacer le bootstrap admin `admin@cyrano.com` par des **custom claims** Firebase.
3. Soit **implémenter la messagerie Firestore**, soit retirer la promesse fonctionnelle de l'interface.

---

## 2. Ce qui a déjà été renforcé

Ces points sont vérifiés dans le code et/ou en production :

- **Règles Firestore au moindre privilège** (`firestore.rules`) : lecture des commandes limitée au client, aux vendeurs concernés et à l'admin ; offres limitées au client/vendeur/admin ; refus par défaut.
- **En-têtes de sécurité** (`firebase.json`) : CSP, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`.
- **Cache corrigé** : `index.html` et routes SPA en `no-cache`, assets hachés en `immutable`. Les nouveaux déploiements sont visibles immédiatement.
- **Checkout** : les prix sont rechargés depuis le catalogue, l'auto-achat est bloqué, les quantités sont bornées au stock, une rupture de stock (`stock: 0`) est refusée.
- **Injection CSV** neutralisée dans l'export admin (`=`, `+`, `-`, `@`).
- **Routes protégées** par `RequireAuth` et chargement différé des pages.
- **Admin sans liens client** dans l'en-tête (panier, favoris, messages).
- **Tests** : 13 tests unitaires (totaux, normalisation produit, panier, stock).
- **Build** : découpage `react` / `firebase` / `charts`, pages en lazy loading.

---

## 3. Risques critiques

### C1. Les commandes sont créées directement par le client

**Constat.** `Checkout.jsx` recalcule les prix côté navigateur, ce qui protège contre un panier local falsifié, mais l'écriture finale reste un `addDoc` direct :

```js
const ref = await addDoc(collection(db, "commandes"), commande);
```

Les règles Firestore vérifient `clientId`, `total >= 0`, `status === "Reçue"` et l'absence d'auto-achat, mais **pas** la cohérence entre `articles`, les prix des produits et `total`. Un utilisateur authentifié peut appeler le SDK Firestore directement et écrire :

```json
{
  "clientId": "<son uid>",
  "articles": [{ "id": "1", "prix": 1, "quantity": 1 }],
  "total": 1,
  "status": "Reçue",
  "vendeurs": ["<uid d'un vendeur>"]
}
```

**Impact.** Fausses commandes, faux revenus dans le dashboard, spam de vendeurs, perte de confiance dans les données. Le problème est structurel : **une règle Firestore ne peut pas reconstruire un panier complexe de façon fiable**.

**Correctif recommandé.**

1. Créer une Cloud Function callable `creerCommande` (ou un trigger HTTPS) qui :
   - relit chaque produit avec `getDoc` / transaction ;
   - vérifie le stock, le vendeur et les prix ;
   - recalcule `sousTotal`, `livraison`, `total` ;
   - décrémente le stock dans une **transaction** ;
   - écrit la commande avec l'identité issue de `request.auth`.
2. Dans `firestore.rules`, passer `allow create: if false` sur `commandes` pour les clients (seul le service account Admin SDK écrit).
3. Le client appelle la fonction et n'envoie que `{ items: [{ id, taille, quantity }], adresse, paiement }`.

**Variante sans Cloud Functions (moins robuste).** Valider dans les règles avec `get()` produit par produit et un tableau `articles` de taille bornée. Cela reste limité (pas de décrément atomique multi-documents) et coûteux en lectures.

**Fichiers :** `src/pages/Checkout.jsx`, `firestore.rules`.

---

### C2. Bootstrap admin par adresse email

**Constat.** `estAdmin()` et `chargerProfil()` considèrent `admin@cyrano.com` comme admin, sans vérifier `email_verified` ni custom claim :

```js
request.auth.token.email == 'admin@cyrano.com' || role() == 'admin'
```

`Register.jsx` attribue aussi `roleFinal = "admin"` pour cet email.

**Impact.** Si le compte `admin@cyrano.com` n'existe pas encore (ou est supprimé), **le premier inscrit avec cet email devient administrateur**. L'email n'est pas vérifié, il n'y a pas de 2FA, et le mot de passe est inconnu de l'équipe. C'est une prise de contrôle totale possible de la supervision.

**Correctif recommandé.**

1. Créer l'admin manuellement dans Firebase Authentication (ou via Admin SDK).
2. Poser un **custom claim** `admin: true` avec l'Admin SDK / `firebase auth:import`, puis vérifier dans les règles :
   ```
   request.auth.token.admin == true
   ```
3. Supprimer la branche email de `estAdmin()`, `chargerProfil()` et `Register.jsx`.
4. Pour les rôles vendeur, conserver Firestore (`utilisateurs/{uid}.role`) ou migrer aussi vers des claims (`role: "vendeur"`).
5. Ajouter `email_verified` pour les actions sensibles (vente, offre, avis).

**Fichiers :** `firestore.rules`, `src/services/profil.js`, `src/pages/Register.jsx`, `src/pages/Login.jsx`.

> ⚠️ Ne pas supprimer le fallback email avant d'avoir posé le custom claim, sous peine de verrouiller l'admin actuel.

---

## 4. Risques élevés

### H1. Stock non décrémenté et commandes non atomiques

**Constat.** Une commande peut être passée plusieurs fois pour le même article. Aucun décrément de `stock` n'est effectué après l'achat, et deux clients peuvent acheter le dernier exemplaire.

**Impact.** Survente, stock affiché faux, litiges.

**Correctif.** Dans la même transaction que C1 : lire le produit, vérifier `stock >= quantity`, écrire `stock = stock - quantity`, refuser si insuffisant. Ajouter un champ `vendu` / `statut` pour l'historique. Pour les produits de démonstration (non Firestore), garder un stock local ou les marquer non achetables.

### H2. Messagerie non fonctionnelle

**Constat.** `messagesSlice` stocke les conversations **uniquement dans Redux**, sans persistance ni Firestore. `Messagerie.jsx` affiche les messages du navigateur courant. Le destinataire ne reçoit rien, et tout disparaît au rechargement.

**Impact.** Fonctionnalité cœur annoncée mais absente ; risque de confiance et de support.

**Correctif.** Deux options :

- **Implémenter** : collection `conversations` (participants, productId, lastMessageAt) + sous-collection `messages`, `onSnapshot` pour le temps réel, règles déjà esquissées dans `firestore.rules`. Ajouter un bouton « Contacter » qui crée/retrouve la conversation.
- **Retirer** : masquer les liens Messages et le formulaire tant que ce n'est pas implémenté, pour ne pas promettre une fonctionnalité inexistante.

**Fichiers :** `src/store/messagesSlice.js`, `src/pages/Messagerie.jsx`, `src/pages/ProduitDetails.jsx`, `firestore.rules`.

### H3. Avis non vérifiés et modifiables sans contrôle

**Constat.** Tout utilisateur connecté peut noter n'importe quel produit, plusieurs fois, sans preuve d'achat. La règle `update` autorise l'auteur à modifier `produitId`, `note` ou `clientId` (aucune validation sur `update`).

**Impact.** Manipulation de la réputation, faux avis, déplacement d'un avis vers un autre produit.

**Correctif.**

1. Exiger une commande livrée contenant le produit et le client (Cloud Function ou document de preuve `achats/{uid_produit}`).
2. Un seul avis par couple `(clientId, produitId)` : ID de document déterministe ou contrainte côté fonction.
3. Valider `update` : `clientId`, `produitId` immuables, `note` entre 1 et 5, `texte` entre 5 et 1000 caractères.
4. Ne pas exposer `clientId` en lecture publique : stocker `auteur` public et `clientId` privé, ou restreindre la lecture.

**Fichiers :** `src/pages/ProduitDetails.jsx`, `firestore.rules`.

### H4. Absence d'App Check, de rate limiting et de vérification email

**Constat.** La clé API Firebase est publique par nature. Aucun App Check, CAPTCHA ou quota applicatif. L'inscription ne vérifie pas l'email. Pas de réinitialisation de mot de passe.

**Impact.** Spam de produits / offres / avis, création de comptes jetables, usurpation d'email, coûts Firestore.

**Correctif.**

- Activer **Firebase App Check** (reCAPTCHA Enterprise pour le web) et l'exiger sur Firestore/Storage.
- Ajouter une limitation applicative (une offre par produit et par utilisateur, quotas de création) et des alertes de budget.
- Implémenter `sendEmailVerification` et `sendPasswordResetEmail`.
- Ajouter un CAPTCHA sur l'inscription si le spam persiste.

---

## 5. Risques moyens

### M1. Règles Firestore incomplètes sur les mises à jour

`produits` : la mise à jour vendeur ne valide ni `prix > 0`, ni `stock >= 0`, ni les types. Un vendeur peut mettre un prix négatif ou un stock incohérent.  
`offres` : le vendeur peut passer une offre `acceptée` à `refusée` (pas de machine à états).  
`utilisateurs` : l'utilisateur peut modifier son `email` Firestore (désynchronisation avec Auth) et d'autres champs non prévus.  
`conversations` : tout participant peut modifier la liste des participants.

**Correctif.** Valider les champs avec `request.resource.data.diff(resource.data).affectedKeys().hasOnly([...])`, les types et les bornes. Pour les offres, n'autoriser que `en_attente → acceptée|refusée`. Pour les commandes, n'autoriser que la transition suivante.

### M2. Rôles et données chargés en entier

`Dashboard.jsx` fait `getDocs` sur **toutes** les commandes, tous les produits, toutes les offres et tous les utilisateurs, sans `limit`. `EspaceVendeur.jsx` charge toutes les commandes du vendeur. `Catalogue.jsx` charge tous les produits puis filtre côté client.

**Impact.** Coût Firestore, lenteur et mémoire qui augmentent linéairement ; un admin peut bloquer son navigateur.

**Correctif.** Pagination `limit` + `startAfter`, filtres/tri côté Firestore, index composites, recherche via Algolia/Typesense si besoin. Pour le catalogue, garder les 12 démos locales et paginer uniquement Firestore.

### M3. Panier et favoris globaux au navigateur, pas au compte

`localStorage` utilise les clés `cyrano.cart.v1` / `cyrano.favoris.v1` sans UID. Deux comptes sur le même appareil partagent le même panier et les mêmes favoris ; la déconnexion ne les efface pas.

**Impact.** Fuite d'habitudes d'achat entre comptes, panier inattendu après changement d'utilisateur.

**Correctif.** Clé par `uid` et nettoyage à la déconnexion, ou stockage Firestore (`favoris` existe déjà dans les règles). Pour le panier, un doc `paniers/{uid}` ou un localStorage par uid suffit.

### M4. Produits de démonstration sans vendeur identifiable

Les 12 produits démo ont `vendeur` (nom) mais pas `vendeurId`. Une offre sur ces produits est créée avec `vendeurId: null` : **aucun vendeur ne peut la voir ni l'accepter**, seul l'admin la voit. La page d'accueil n'affiche d'ailleurs que les démos, pas les produits Firestore.

**Correctif.** Créer un compte « Cyrano Officiel » avec un UID fixe et l'utiliser comme vendeur des démos, ou désactiver le bouton d'offre sur les démos. Charger aussi les produits Firestore sur l'accueil (avec un fallback si Firestore est lent).

### M5. Suppression de compte incomplète

`Profil.jsx` supprime le document `utilisateurs/{uid}` et le compte Auth, mais laisse les produits, offres, avis, commandes et images Storage. Les commandes d'un client supprimé restent visibles par les vendeurs (nécessaire comptablement), mais les données personnelles devraient être anonymisées.

**Correctif.** Cloud Function de suppression : anonymiser les commandes (`client` remplacé par « Compte supprimé »), supprimer les produits/offres/avis/favoris, supprimer les fichiers Storage, conserver les agrégats financiers. Documenter la politique de rétention.

### M6. Pas de vraie vérification vendeur ni de protection acheteur

L'interface affiche « vendeurs vérifiés » et « protection acheteur », mais il n'existe ni KYC, ni escrow, ni procédure de remboursement, ni vérification d'identité. Le paiement est simulé.

**Impact.** Promesse commerciale non tenue ; risque juridique et réputationnel.

**Correctif.** Soit retirer ces mentions tant que le processus n'existe pas, soit mettre en place : vérification téléphone/identité, séquestre Mobile Money, médiation et remboursement, CGU/CGV.

### M7. Observabilité et CI absentes

Pas de Sentry/monitoring, pas de logs structurés, pas de CI, pas de tests des règles Firestore ni des parcours d'authentification. Le déploiement est manuel.

**Correctif.** GitHub Actions : `lint`, `test`, `build`, `firebase deploy --only hosting` sur `main`. Tests des règles avec l'émulateur (`@firebase/rules-unit-testing`). Sentry + alertes Firebase.

**Dépendances.** `npm audit --omit=dev` signale encore 4 vulnérabilités hautes transitives via `@grpc/grpc-js`, dépendance **Node** de Firestore qui n'est pas utilisée par le bundle web. Ne pas lancer `npm audit fix --force` : npm propose de rétrograder Firebase vers 9.x, ce qui casserait l'application. Les autres alertes (React Router, Vite, PostCSS, `nanoid`, `undici`, etc.) ont été corrigées par `npm update` ; surveiller les prochaines versions de Firebase.

---

## 6. Risques faibles

| # | Point | Correctif |
|---|---|---|
| L1 | Modal sans `role="dialog"`, sans focus trap ni fermeture Échap (`EspaceVendeur`, `Dashboard`). | Composant Dialog accessible (Radix/shadcn) ou gestion focus + `keydown`. |
| L2 | Liste infinie sans bouton « Charger plus » : dépend du scroll, peu accessible. | Bouton explicite + `aria-live` ; garder le scroll comme bonus. |
| L3 | SEO limité à la page d'accueil : pas de meta dynamiques par produit, sitemap statique. | Pré-rendu/SSR (Next/Remix) ou meta injectées + sitemap généré. |
| L4 | CSP `img-src https:` et `connect-src https:` très larges. | Allowlist explicite (Unsplash, Firebase, domaines de paiement) ou proxy d'images. |
| L5 | `firebase.js` initialise Storage même s'il n'est pas provisionné. | Initialisation paresseuse dans `upload.js` ou retrait tant que Storage est désactivé. |
| L6 | `isAdmin` duplique `user.role` dans `authSlice` et n'est pas utilisé. | Supprimer le champ ou l'utiliser partout via un sélecteur unique. |

---

## 7. Architecture — recommandations

### 7.1 Séparer le métier du transport

Aujourd'hui, les pages mélangent UI, accès Firestore, calculs et règles métier. Extraire :

```
src/domain/          # entités + règles pures (prix, stock, statuts, offres)
src/services/        # Firebase : commandes, produits, offres, profils
src/features/        # slices Redux ou hooks de requête
src/pages/           # composition UI uniquement
```

Les fonctions pures (`calculerTotaux`, transitions de statut, validation d'offre) sont déjà testables ; il faut généraliser ce pattern.

### 7.2 Choisir une stratégie de données serveur

Deux options :

- **RTK Query** (recommandé si on reste sur Redux) : cache, invalidation, pagination, états de chargement standardisés.
- **TanStack Query** : plus léger, très adapté aux lectures Firestore et aux mutations.

Cela supprimerait la duplication `useEffect + getDocs + dispatch` présente dans `Catalogue`, `Dashboard`, `EspaceVendeur`, `Suivi`, `Vendeur`.

### 7.3 Typage et validation aux frontières

Passer progressivement à TypeScript, ou au minimum valider les documents Firestore avec **Zod** (`produitSchema`, `commandeSchema`) avant de les mettre dans le store. Cela évite les `Number(undefined)`, les dates invalides et les champs manquants.

### 7.4 Identité vendeur stable

`/vendeur/:nom` utilise le nom affiché. Deux vendeurs homonymes fusionnent, un renommage casse les liens. Utiliser `vendeurId` (UID) dans l'URL et résoudre le nom depuis le profil.

---

## 8. Plan d'action

### P0 — avant toute production

1. Cloud Function `creerCommande` transactionnelle + `allow create: if false` côté client.
2. Custom claim admin + suppression du bootstrap email + email vérifié.
3. Décrément de stock atomique et refus de survente.
4. App Check + quotas + alertes budget.
5. Messagerie : implémentation Firestore ou retrait de l'interface.

### P1 — qualité et confiance

6. Validation complète des règles `update` (produits, offres, avis, utilisateurs).
7. Vérification d'achat pour les avis et unicité.
8. Pagination admin/vendeur et index Firestore.
9. Panier/favoris par UID et nettoyage à la déconnexion.
10. Réinitialisation de mot de passe + vérification email.
11. Suppression de compte complète (anonymisation + Storage).
12. Storage activé et déployé, ou upload retiré.

### P2 — produit et exploitation

13. CI/CD + tests des règles + tests E2E Playwright.
14. Monitoring Sentry, logs, budget.
15. SEO par route, pré-rendu.
16. Accessibilité des modales et de la liste infinie.
17. TypeScript/Zod, RTK Query, découpage domaine.
18. Mentions « vendeurs vérifiés » / « protection acheteur » alignées avec la réalité.

---

## 9. Vérifications

```bash
npm run lint
npm test
npm run build
firebase deploy --only hosting --project cyrano-ecommerce
```

Contrôles manuels utiles :

- Créer une commande, vérifier `clientId`, `vendeurs[]`, les prix et le total dans Firestore.
- Tenter un `addDoc` direct avec un prix falsifié : doit être refusé après C1.
- Tester `stock: 0` : l'ajout au panier et le checkout doivent échouer proprement.
- Vérifier les en-têtes : HTML `no-cache`, assets `immutable`, CSP présente.
- Tester les rôles : admin sans panier/favoris/messages, vendeur sans offres des autres, client sans dashboard.

---

## 10. Conclusion

La base est saine et l'interface est aboutie. Le principal écart entre l'apparence et la réalité concerne **la confiance serveur** : tant que les commandes, le stock et les rôles admin reposent sur le client ou sur un email, la plateforme ne peut pas être considérée comme sécurisée pour de l'argent réel. Les correctifs P0 sont concentrés et réalisables ; le reste relève de la montée en charge et de la qualité opérationnelle.
