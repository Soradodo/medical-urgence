# 🚑 Guide d'installation — Fiche médicale d'urgence sécurisée
### Durée estimée : 20-30 minutes | Aucune connaissance en code requise

---

## 📋 Ce dont tu as besoin avant de commencer
- Un compte **GitHub** (github.com) ✅ tu l'as déjà
- Un compte **Vercel** (vercel.com) ✅ tu l'as déjà  
- Un compte **Resend** (resend.com) — gratuit, pour les emails d'alerte
- **Visual Studio Code** ✅ tu l'as déjà

---

## ÉTAPE 1 — Mettre le projet sur GitHub

1. Ouvre **Visual Studio Code**
2. Clique sur **"Open Folder"** et ouvre le dossier `medical-urgence`
3. En haut, clique sur **Terminal → New Terminal**
4. Dans le terminal (la fenêtre noire en bas), tape ces commandes **une par une**, appuie sur Entrée après chaque ligne :

```
git init
git add .
git commit -m "Initial commit"
```

5. Va sur **github.com** → clique sur le **"+"** en haut à droite → **"New repository"**
6. Nom du dépôt : `medical-urgence` | Choisis **Privé (Private)** ⚠️ IMPORTANT
7. Clique **"Create repository"**
8. GitHub te donne 2-3 commandes — copie-les et colle-les dans le terminal VS Code

---

## ÉTAPE 2 — Créer ton token secret (l'adresse unique)

Ton lien d'urgence ressemblera à :
`https://ton-site.vercel.app/u/TON_TOKEN_SECRET`

Pour générer un token aléatoire sécurisé :
1. Va sur ce site : **https://generate-secret.now.sh/32**
2. Copie la longue suite de lettres et chiffres affichée
3. Garde-la de côté (tu en auras besoin à l'étape 4)

Exemple de token : `a3f9k2m8e1b4c7d2f6a1e9b3c8d5f2a4`

---

## ÉTAPE 3 — Créer un compte Resend (pour les emails d'alerte)

1. Va sur **resend.com** → "Get Started" → crée un compte gratuit
2. Une fois connecté, va dans **"API Keys"** → clique **"Create API Key"**
3. Nom : `urgence-medicale` | Permission : **Sending access**
4. Copie la clé générée (commence par `re_...`) — tu en auras besoin à l'étape 4

---

## ÉTAPE 4 — Déployer sur Vercel et configurer les données

1. Va sur **vercel.com** → connecte-toi avec ton compte GitHub
2. Clique **"New Project"** → trouve `medical-urgence` → clique **"Import"**
3. **AVANT de cliquer "Deploy"**, clique sur **"Environment Variables"**
4. Ajoute chaque variable ci-dessous une par une :

| Nom de la variable | Valeur (ton exemple) |
|---|---|
| `MEDICAL_TOKEN` | *(le token copié à l'étape 2)* |
| `MEDICAL_PIN` | *(4 chiffres de ton choix, ex: 1847)* |
| `MEDICAL_EXPIRY` | *(date au format 2026-12-31 ou laisser vide)* |
| `MEDICAL_PRENOM` | Martin |
| `MEDICAL_NOM` | Dupont |
| `MEDICAL_AGE` | 42 |
| `MEDICAL_GROUPE_SANGUIN` | A+ |
| `MEDICAL_POIDS` | 78 |
| `MEDICAL_ALLERGIES` | Pénicilline\|Arachides\|Aspirine |
| `MEDICAL_CONDITIONS` | Diabète de type 1 — insulino-dépendant\|Épilepsie |
| `MEDICAL_TRAITEMENTS` | Insuline Glargine:20 UI matin\|Lévétiracétam:500mg 2x/jour |
| `MEDICAL_CONTACT_NOM` | Sophie Dupont |
| `MEDICAL_CONTACT_TEL` | +33612345678 |
| `MEDICAL_CONTACT_TEL_DISPLAY` | +33 6 12 34 56 78 |
| `MEDICAL_MEDECIN` | Dr. Élise Bernard |
| `MEDICAL_MEDECIN_TEL` | +33123456789 |
| `MEDICAL_NOTES` | En cas de crise : ne pas retenir, appeler le 15 |
| `RESEND_API_KEY` | *(la clé re_... de l'étape 3)* |
| `ALERT_EMAIL` | *(ton adresse email pour les alertes)* |

⚠️ **Format des listes** : sépare les éléments avec `|` (exemple : `Allergie1|Allergie2`)
⚠️ **Format traitements** : `NomMédicament:Dosage` séparé par `|`

5. Clique **"Deploy"** — attends 2-3 minutes

---

## ÉTAPE 5 — Tester et créer ton lien NFC

Ton lien d'urgence est :
```
https://TON-PROJET.vercel.app/u/TON_TOKEN_SECRET
```
*(remplace TON-PROJET et TON_TOKEN_SECRET par tes vraies valeurs)*

**Test :**
1. Ouvre ce lien dans ton navigateur
2. Entre ton PIN → tu dois voir ta fiche médicale
3. Vérifie que tu reçois un email d'alerte

**Créer une étiquette NFC (optionnel mais recommandé) :**
1. Achète des étiquettes NFC sur Amazon (cherche "étiquettes NFC NTAG213") — ~10€ pour 10 étiquettes
2. Télécharge l'app **NFC Tools** sur ton smartphone
3. Ouvre NFC Tools → "Write" → "Add a record" → "URL/URI"
4. Colle ton lien d'urgence → écris sur l'étiquette
5. Colle l'étiquette sur ta carte d'identité, ta montre, ou ton téléphone

---

## ÉTAPE 6 — Mettre à jour les données

Si tes informations médicales changent :
1. Va sur **vercel.com** → ton projet → **"Settings"** → **"Environment Variables"**
2. Clique sur la variable à modifier → change la valeur → **"Save"**
3. Va dans **"Deployments"** → clique les 3 points sur le dernier déploiement → **"Redeploy"**

---

## 🔒 Récapitulatif de la sécurité mise en place

- ✅ **URL secrète** : sans le lien exact, la page est introuvable
- ✅ **Code PIN** : protection supplémentaire à 4 chiffres (5 essais max)
- ✅ **Données hors du code** : jamais sur GitHub, uniquement sur Vercel
- ✅ **Expiration automatique** : le lien peut devenir invalide à une date donnée
- ✅ **Email d'alerte** : tu sais chaque fois que ta fiche est consultée
- ✅ **Rate limiting** : bloque les tentatives de scan automatique
- ✅ **Headers de sécurité** : empêche les attaques courantes (XSS, clickjacking)
- ✅ **Non indexé** : Google et autres moteurs ne peuvent pas trouver la page
- ✅ **HTTPS** : tout est chiffré en transit (fourni par Vercel gratuitement)

---

## ⚠️ Ce qui reste à risque (honnêteté totale)

- Le lien URL peut être partagé ou vu sur un écran
- Vercel a accès à tes données (comme tout hébergeur)
- Pas certifié HDS (hébergement de données de santé) — usage personnel uniquement
- Pour un usage professionnel/médical officiel, il faudrait une infrastructure certifiée

---

## 🆘 En cas de problème

- **La page ne s'affiche pas** : vérifie que le TOKEN dans l'URL est identique à MEDICAL_TOKEN dans Vercel
- **PIN refusé** : vérifie MEDICAL_PIN dans les variables d'environnement Vercel
- **Pas d'email** : vérifie RESEND_API_KEY et ALERT_EMAIL
- **Erreur de déploiement** : dans Vercel → "Deployments" → clique sur le déploiement rouge pour voir l'erreur

---

*Pour toute question, contacte le support Vercel (vercel.com/support) ou la communauté Next.js (nextjs.org/discord).*
