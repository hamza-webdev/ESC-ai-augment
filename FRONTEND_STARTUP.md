# 🅰️ ESC Football App - Guide de démarrage du Frontend

**Méthodes pour démarrer la partie frontend de l'application ESC Football**

*Espoir Sportif de Chorbane*

---

## 🚀 **Méthodes pour démarrer le frontend**

### 1. **Démarrage rapide avec Makefile (Recommandé)**
```bash
# Démarrer uniquement le frontend
make dev-frontend
```

### 2. **Démarrage manuel (développement local)**
```bash
# Naviguer vers le dossier frontend
cd frontend

# Démarrer le serveur Angular
ng serve --port 4200
```

### 3. **Démarrage avec Docker**
```bash
# Frontend avec Docker
docker-compose up -d frontend
```

### 4. **Démarrage complet (frontend + backend)**
```bash
# Démarrage de tous les services
make dev

# Ou séparément
make dev-backend
make dev-frontend
```

---

## 🔧 **Prérequis avant le démarrage**

### **Vérifier les outils installés :**
```bash
# Node.js (version 18+ recommandée)
node --version

# npm (gestionnaire de paquets)
npm --version

# Angular CLI
ng version
```

### **Si Angular CLI n'est pas installé :**
```bash
# Installation globale d'Angular CLI
npm install -g @angular/cli
```

---

## 📋 **Démarrage étape par étape**

### **1. Naviguer vers le dossier frontend**
```bash
cd frontend
```

### **2. Installer les dépendances (si pas encore fait)**
```bash
# Installation des dépendances npm
npm install
```

### **3. Démarrer le serveur de développement**
```bash
# Démarrage avec configuration par défaut
ng serve --port 4200 --host 0.0.0.0

# Ou avec live reload activé
ng serve --port 4200 --host 0.0.0.0 --live-reload
```

### **4. Ouvrir dans le navigateur**
```bash
# URL du frontend
http://localhost:4200
```

---

## 🌐 **Vérification que le frontend fonctionne**

Une fois démarré, vous devriez voir :

### **Dans le terminal :**
```
✔ Compiled successfully.
✔ Browser application bundle generation complete.

Initial Chunk Files | Names         |  Raw Size
vendor.js           | vendor        |   2.50 MB | 
main.js             | main          | 500.00 kB |
styles.css          | styles        |  50.00 kB |

Application bundle generation complete. Watching for file changes...

Local:   http://localhost:4200/
Network: http://192.168.1.100:4200/

** Angular Live Development Server is listening on localhost:4200, open your browser on http://localhost:4200/ **
```

### **Dans le navigateur :**
- Page de connexion ESC Football
- Interface Angular Material
- Formulaire de connexion fonctionnel

---

## 🐳 **Démarrage avec Docker (Alternative)**

### **Développement avec Docker :**
```bash
# Démarrage complet avec Docker
make dev-docker

# Ou manuellement
docker-compose -f docker-compose.dev.yml up -d frontend
```

### **Production avec Docker :**
```bash
# Démarrage en mode production
make prod-docker
```

---

## 📊 **Monitoring du frontend**

### **Voir les logs en temps réel :**
```bash
# Logs du frontend avec Docker
docker-compose logs -f frontend

# Ou directement dans le terminal où ng serve est lancé
```

### **Vérifier la compilation :**
```bash
# Build de production pour tester
ng build --configuration production

# Analyse du bundle
ng build --stats-json
npx webpack-bundle-analyzer dist/frontend/stats.json
```

### **Tests du frontend :**
```bash
# Tests unitaires
ng test

# Tests end-to-end
ng e2e

# Linting du code
ng lint
```

---

## 🔍 **Troubleshooting**

### **Si le frontend ne démarre pas :**

#### 1. **Vérifier Node.js et Angular CLI :**
```bash
# Versions recommandées
node --version  # v18.x.x ou plus récent
npm --version   # v9.x.x ou plus récent
ng version      # Angular CLI 17.x.x ou plus récent
```

#### 2. **Installer/Réinstaller les dépendances :**
```bash
cd frontend

# Nettoyer le cache npm
npm cache clean --force

# Supprimer node_modules et package-lock.json
rm -rf node_modules package-lock.json

# Réinstaller les dépendances
npm install
```

#### 3. **Vérifier le port :**
```bash
# Si le port 4200 est occupé
ng serve --port 4201

# Ou tuer le processus utilisant le port 4200
lsof -ti:4200 | xargs kill -9  # Linux/Mac
netstat -ano | findstr :4200   # Windows
```

#### 4. **Problèmes de compilation :**
```bash
# Nettoyer le cache Angular
ng cache clean

# Rebuild complet
rm -rf dist/
ng build
```

### **Erreurs courantes et solutions :**

#### **Erreur : "ng: command not found"**
```bash
# Solution : Installer Angular CLI globalement
npm install -g @angular/cli
```

#### **Erreur : "Port 4200 is already in use"**
```bash
# Solution 1 : Utiliser un autre port
ng serve --port 4201

# Solution 2 : Tuer le processus existant
npx kill-port 4200
```

#### **Erreur : "Cannot resolve dependency"**
```bash
# Solution : Réinstaller les dépendances
rm -rf node_modules package-lock.json
npm install
```

#### **Erreur : "Memory limit exceeded"**
```bash
# Solution : Augmenter la limite mémoire Node.js
export NODE_OPTIONS="--max-old-space-size=8192"
ng serve
```

---

## 🎯 **Commandes recommandées pour démarrer rapidement**

### **Démarrage simple :**
```bash
cd frontend
ng serve --port 4200
```

### **Démarrage avec toutes les options :**
```bash
cd frontend
ng serve --port 4200 --host 0.0.0.0 --live-reload --open
```

### **Démarrage complet (backend + frontend) :**
```bash
# Démarrage automatique de tout
make dev
```

---

## 🌐 **URLs et fonctionnalités disponibles**

Une fois le frontend démarré :

| Page | URL | Description |
|------|-----|-------------|
| **Accueil** | http://localhost:4200 | Page de connexion |
| **Dashboard** | http://localhost:4200/dashboard | Tableau de bord (après connexion) |
| **Joueurs** | http://localhost:4200/players | Gestion des joueurs |
| **Matchs** | http://localhost:4200/matches | Gestion des matchs |
| **Entraînements** | http://localhost:4200/trainings | Gestion des entraînements |
| **Finances** | http://localhost:4200/finances | Gestion financière |
| **Actualités** | http://localhost:4200/news | Gestion des actualités |

### **Fonctionnalités disponibles :**
- ✅ Interface Angular Material moderne
- ✅ Authentification avec JWT
- ✅ Navigation responsive
- ✅ Hot reload pour le développement
- ✅ Gestion d'état réactive avec RxJS
- ✅ Formulaires réactifs
- ✅ Intercepteurs HTTP automatiques

---

## 📝 **Configuration importante**

### **Fichiers de configuration :**
- `angular.json` - Configuration Angular
- `package.json` - Dépendances npm
- `src/environments/environment.ts` - Variables d'environnement
- `src/app/app.config.ts` - Configuration de l'application

### **Variables d'environnement :**
```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api',
  appName: 'ESC Football App',
  version: '1.0.0'
};
```

### **Port et configuration :**
```json
// angular.json - Configuration du serveur de développement
"serve": {
  "builder": "@angular-devkit/build-angular:dev-server",
  "options": {
    "port": 4200,
    "host": "0.0.0.0"
  }
}
```

---

## 🔧 **Commandes utiles pour le développement**

```bash
# Démarrage avec ouverture automatique du navigateur
ng serve --open

# Démarrage avec polling (utile pour Docker/VM)
ng serve --poll=2000

# Build de production
ng build --configuration production

# Analyse de la taille du bundle
ng build --stats-json
npx webpack-bundle-analyzer dist/frontend/stats.json

# Génération de composants
ng generate component features/players/player-list
ng generate service core/services/player

# Tests
ng test --watch=false --browsers=ChromeHeadless
ng e2e

# Linting et formatage
ng lint
npm run format
```

---

## 🎉 **Résumé des commandes essentielles**

```bash
# 🚀 Démarrage rapide complet
make dev

# 🅰️ Démarrage frontend seulement
make dev-frontend

# 🐳 Démarrage avec Docker
make dev-docker

# 📊 Vérification du statut
make status

# 🔍 Voir les logs
docker-compose logs -f frontend

# 🧹 Nettoyage et redémarrage
cd frontend && npm cache clean --force && npm install
```

---

## 🔗 **Intégration avec le backend**

Le frontend communique avec le backend via :

- **API URL :** http://localhost:5000/api
- **Authentification :** JWT tokens
- **CORS :** Configuré pour http://localhost:4200
- **Intercepteurs :** Ajout automatique des tokens
- **Services :** AuthService, ApiService, etc.

---

**🏈 Frontend ESC Football - Interface moderne et réactive !**

**URL du frontend :** http://localhost:4200 🚀
