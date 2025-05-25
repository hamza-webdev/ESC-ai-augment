# 🚀 ESC Football App - Guide de démarrage du Backend

**Méthodes pour démarrer la partie backend de l'application ESC Football**

*Espoir Sportif de Chorbane*

---

## 🚀 **Méthodes pour démarrer le backend**

### 1. **Démarrage rapide avec Makefile (Recommandé)**
```bash
# Démarrer uniquement le backend
make dev-backend
```

### 2. **Démarrage manuel (développement local)**
```bash
# Naviguer vers le dossier backend
cd backend

# Démarrer le serveur Flask
python run.py
```

### 3. **Démarrage avec Docker**
```bash
# Services de base de données d'abord
docker-compose up -d db redis

# Puis le backend
docker-compose up -d backend
```

### 4. **Démarrage complet (backend + base de données)**
```bash
# Démarrage de tous les services nécessaires
make dev

# Ou seulement backend + DB
make db-start
make dev-backend
```

---

## 🔧 **Prérequis avant le démarrage**

### **Vérifier que les services de base de données sont démarrés :**
```bash
# Vérifier le statut
make status

# Ou avec Docker directement
docker-compose ps
```

### **Si les services ne sont pas démarrés :**
```bash
# Démarrer PostgreSQL et Redis
make db-start

# Ou avec Docker
docker-compose up -d db redis
```

---

## 📋 **Étapes détaillées pour un démarrage complet**

### **1. Démarrer les services de base de données**
```bash
make db-start
```

### **2. Attendre que les services soient prêts**
```bash
# Vérifier la santé des services
make health
```

### **3. Démarrer le backend**
```bash
make dev-backend
```

---

## 🌐 **Vérification que le backend fonctionne**

Une fois démarré, vous pouvez tester :

```bash
# Test de santé de l'API
curl http://localhost:5000/api/health

# Ou ouvrir dans le navigateur
# http://localhost:5000/api/health
```

**Réponse attendue :**
```json
{
  "message": "ESC Football App API is running",
  "status": "healthy",
  "timestamp": "2024-12-25T10:30:00.000Z"
}
```

---

## 🐳 **Démarrage avec Docker (Alternative)**

### **Développement avec Docker :**
```bash
# Démarrage complet avec Docker
make dev-docker

# Ou manuellement
docker-compose -f docker-compose.dev.yml up -d backend
```

### **Production avec Docker :**
```bash
# Démarrage en mode production
make prod-docker
```

---

## 📊 **Monitoring du backend**

### **Voir les logs en temps réel :**
```bash
# Logs du backend
make logs

# Ou spécifiquement le backend
docker-compose logs -f backend
```

### **Vérifier l'état des services :**
```bash
# Statut général
make status

# Santé de l'application
make health
```

---

## 🔍 **Troubleshooting**

### **Si le backend ne démarre pas :**

#### 1. **Vérifier les dépendances :**
```bash
cd backend
pip install -r requirements.txt
```

#### 2. **Vérifier la base de données :**
```bash
make db-start
# Attendre 10 secondes
make dev-backend
```

#### 3. **Vérifier les logs d'erreur :**
```bash
docker-compose logs backend
```

#### 4. **Redémarrer complètement :**
```bash
make clean
make quick-start
```

### **Erreurs courantes et solutions :**

#### **Erreur : "Connection refused" (PostgreSQL)**
```bash
# Solution : Démarrer PostgreSQL
make db-start
# Attendre 30 secondes puis réessayer
```

#### **Erreur : "Module not found"**
```bash
# Solution : Installer les dépendances
cd backend
pip install -r requirements.txt
```

#### **Erreur : "Port 5000 already in use"**
```bash
# Solution : Tuer le processus existant
lsof -ti:5000 | xargs kill -9
# Ou changer le port dans .env
```

#### **Erreur : "Redis connection failed"**
```bash
# Solution : Démarrer Redis
docker-compose up -d redis
```

---

## 🎯 **Commande recommandée pour démarrer rapidement**

```bash
# Démarrage complet et automatique
make quick-start
```

Cette commande :
- ✅ Démarre les services de base de données
- ✅ Initialise la base de données si nécessaire
- ✅ Configure l'environnement
- ✅ Démarre le backend
- ✅ Affiche les URLs d'accès

---

## 🌐 **URLs et endpoints disponibles**

Une fois le backend démarré, les endpoints suivants sont disponibles :

| Endpoint | URL | Description |
|----------|-----|-------------|
| **API Principal** | http://localhost:5000 | Page d'accueil de l'API |
| **Health Check** | http://localhost:5000/api/health | Vérification de santé |
| **Info API** | http://localhost:5000/api/info | Informations sur l'API |
| **Documentation** | http://localhost:5000/api/docs | Documentation Swagger (si configurée) |

### **Endpoints fonctionnels :**
- `GET /api/auth/login` - Connexion
- `GET /api/players` - Liste des joueurs
- `GET /api/matches` - Liste des matchs
- `GET /api/trainings` - Liste des entraînements
- `GET /api/finances` - Gestion financière
- `GET /api/news` - Actualités

---

## 📝 **Variables d'environnement importantes**

Le backend utilise les variables suivantes (fichier `.env`) :

```bash
# Configuration Flask
FLASK_ENV=development
FLASK_DEBUG=1
FLASK_HOST=0.0.0.0
FLASK_PORT=5000

# Base de données
DATABASE_URL=postgresql://esc_user:esc_password@localhost:5432/esc_db

# Redis
REDIS_URL=redis://localhost:6379/0

# Sécurité
SECRET_KEY=dev-secret-key
JWT_SECRET_KEY=dev-jwt-secret-key

# CORS
CORS_ORIGINS=http://localhost:4200,http://localhost:3000
```

---

## 🔧 **Commandes utiles pour le développement**

```bash
# Redémarrer le backend
make restart-backend

# Voir les logs du backend uniquement
docker-compose logs -f backend

# Accéder au shell du conteneur backend
docker-compose exec backend bash

# Exécuter des commandes Flask
docker-compose exec backend flask --help

# Tester la connectivité à la base de données
docker-compose exec backend python -c "from app import db; print(db.engine.execute('SELECT 1').scalar())"

# Vérifier les variables d'environnement
docker-compose exec backend env | grep -E "(FLASK|DATABASE|REDIS)"
```

---

## 🎉 **Résumé des commandes essentielles**

```bash
# 🚀 Démarrage rapide complet
make quick-start

# 🔧 Démarrage backend seulement
make dev-backend

# 🐳 Démarrage avec Docker
make dev-docker

# 📊 Vérification du statut
make status

# 🔍 Voir les logs
make logs

# 🧹 Nettoyage et redémarrage
make clean && make quick-start
```

---

**🏈 Backend ESC Football - Prêt pour le développement !**

**URL du backend :** http://localhost:5000 🚀
