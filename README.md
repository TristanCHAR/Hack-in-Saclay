# Épilepsie - KidoKinetics PWA

Application Progressive Web App (PWA) pour collecter des données cognitives et motrices via des mini-jeux, conçue pour la recherche sur les épilepsies développementales rares pédiatriques.

## 🎯 Objectif

Développer des méthodes moins contraignantes et non invasives pour mesurer l'efficacité des médicaments et la réponse au traitement dans les épilepsies développementales rares pédiatriques.

## 🚀 Installation et Lancement

### Prérequis
- Node.js (version 16 ou supérieure)
- npm ou yarn

### Étapes

1. **Installer les dépendances** :
```bash
npm install
```

2. **Lancer l'application en mode développement** :
```bash
npm start
```

L'application sera accessible sur `http://localhost:3000`

3. **Créer une version de production** :
```bash
npm run build
```

## 📱 Comment ça fonctionne ?

### C'est quoi une PWA ?
Une **Progressive Web App** est une application web qui peut être installée et utilisée comme une app mobile native, mais c'est en fait un site web amélioré.

### Architecture de l'application

**Il n'y a qu'UNE SEULE APPLICATION WEB** avec deux sections :

#### 1. Site Web (Landing Page) - Route `/`
- C'est la **page d'accueil publique**
- Visible quand on arrive sur `http://localhost:3000/`
- Contient le texte d'introduction et un bouton
- Quand on clique sur le bouton → Redirection vers `/app`

#### 2. Application PWA - Route `/app`
- C'est la **partie application** avec la navbar en bas
- Accessible via `http://localhost:3000/app`
- Contient :
  - **Navbar en bas** avec 2 onglets (Admin / Jeux)
  - **Page Admin** (`/app/admin`) - Affiche "Admin" centré
  - **Page Jeux** (`/app/jeux`) - Liste des jeux disponibles
  - **Pages de jeux** :
    - `/app/jeux/fruit-ninja` - Jeu Fruit Ninja
    - `/app/jeux/jeu-du-bruit` - Jeu du bruit

## 🧪 Comment tester ?

### Option 1 : Navigateur de bureau (Chrome/Safari)
```bash
npm start
```
1. Ouvrir `http://localhost:3000` → Tu vois la landing page
2. Cliquer sur "Accéder à l'application" → Tu passes à `/app` avec la navbar en bas
3. Naviguer entre les onglets Admin et Jeux

### Option 2 : Simulateur iOS (Xcode)
```bash
npm start
```
1. Ouvrir le simulateur iOS (Xcode)
2. Ouvrir **Safari** dans le simulateur
3. Aller sur `http://localhost:3000` (ou l'IP de ton Mac : `http://192.168.x.x:3000`)
4. Tu verras la landing page
5. Clique sur le bouton → Tu arrives sur l'app avec la navbar

**💡 Astuce** : Pour trouver l'IP de ton Mac :
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

### Option 3 : Téléphone réel (iPhone/Android)
1. Assure-toi que ton téléphone est sur le même WiFi que ton Mac
2. Lance `npm start`
3. Trouve l'IP de ton Mac (voir astuce ci-dessus)
4. Sur ton téléphone, ouvre Safari/Chrome
5. Va sur `http://[IP-DE-TON-MAC]:3000`
6. **Pour installer la PWA sur iPhone** :
   - Clique sur le bouton "Partager" (carré avec flèche vers le haut)
   - Sélectionne "Sur l'écran d'accueil"
   - Une icône apparaîtra sur ton écran d'accueil
   - L'app s'ouvrira en mode standalone (plein écran, sans barre Safari)

## 🎨 Structure des Pages

## 🎨 Design et UX

### Couleurs (Safe pour épileptiques)
- Palette pastel douce : `#b8d4e8`, `#f5f9fc`, `#5a8fb8`
- Pas de flashs ou de contrastes agressifs
- Transitions douces

### Responsive
- ✅ Optimisé pour iPhone (Safari)
- ✅ Optimisé pour tablettes
- ✅ Fonctionne aussi sur desktop

### Navigation
- Navbar fixée en bas (facile d'accès au pouce)
- Rectangles cliquables larges pour les jeux
- Design épuré et clair

## 🛠️ Technologies

- **React 18** avec **TypeScript** (`.tsx` uniquement, pas de `.jsx`)
- **React Router v6** pour la navigation
- **Service Worker** pour PWA (offline, cache)
- **CSS** personnalisé (pas de framework)

## 📦 Scripts

| Commande | Description |
|----------|-------------|
| `npm start` | Lance le serveur de dev (port 3000) |
| `npm run build` | Build de production optimisé |
| `npm test` | Lance les tests |

## 🌐 Fonctionnalités PWA

Quand l'app est **installée** sur un téléphone :
- ✅ Icône sur l'écran d'accueil
- ✅ Mode standalone (pas de barre Safari)
- ✅ Fonctionne hors ligne (après 1ère visite)
- ✅ Splash screen au démarrage

## 📝 Prochaines étapes

- Implémenter les jeux interactifs
- Ajouter la collecte de données
- Développer la page Admin avec statistiques
- Intégrer un backend pour stocker les données

## 🔒 Considérations de sécurité

- Données sensibles (santé)
- Conformité RGPD
- Consentement éclairé des participants

## 📄 Licence

Ce projet est développé dans le cadre de la recherche médicale sur les épilepsies pédiatriques.
