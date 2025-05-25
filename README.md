# ESC Football App 🏈

Application web complète pour la gestion de l'équipe de football **Espoir Sportif de Chorbane (ESC)**.

## 🌟 Fonctionnalités

### 👥 Gestion des Utilisateurs
- Système d'authentification JWT
- Rôles multiples (Admin, Coach, Joueur, Staff, Supporter)
- Profils utilisateurs détaillés

### ⚽ Gestion des Joueurs
- Profils complets des joueurs
- Statistiques de performance
- Suivi des contrats et statuts
- Historique des blessures

### 🏆 Gestion des Matchs
- Calendrier des matchs
- Résultats et statistiques
- Compositions d'équipe
- Rapports de match détaillés

### 🏃‍♂️ Gestion des Entraînements
- Planification des séances
- Suivi des présences
- Évaluation des performances
- Programmes personnalisés

### 💰 Gestion Financière
- Budget du club
- Revenus et dépenses
- Salaires des joueurs
- Rapports financiers

### 📰 Actualités
- Système de news
- Articles avec catégories
- Galerie photos/vidéos
- Interface publique

## 🏗️ Architecture

### Backend (Flask + PostgreSQL)
```
backend/
├── app/
│   ├── models/          # Modèles SQLAlchemy
│   ├── routes/          # Routes API REST
│   ├── services/        # Logique métier
│   └── utils/           # Utilitaires
├── migrations/          # Migrations Alembic
└── tests/              # Tests unitaires
```

### Frontend (Angular - À venir)
```
frontend/
├── src/
│   ├── app/
│   │   ├── core/        # Services singleton
│   │   ├── shared/      # Composants partagés
│   │   ├── features/    # Modules fonctionnels
│   │   └── layout/      # Mise en page
│   └── assets/         # Ressources statiques
```

## 🚀 Installation Rapide

### Prérequis
- Python 3.11+
- Docker & Docker Compose
- Node.js 18+ (pour le frontend)

### Démarrage Automatique
```bash
# Cloner le repository
git clone <repository-url>
cd esc-football-app

# Lancer l'installation automatique
python start.py
```

### Démarrage Manuel

#### 1. Base de données
```bash
# Démarrer PostgreSQL et Redis
docker-compose up -d db redis

# Initialiser la base de données
cd backend
python init_db.py
```

#### 2. Backend
```bash
# Installer les dépendances
pip install -r requirements.txt

# Configurer l'environnement
cp .env.example .env

# Lancer l'application
python app.py
```

#### 3. Frontend (À venir)
```bash
cd frontend
npm install
ng serve
```

## 🔧 Configuration

### Variables d'Environnement
Copier `backend/.env.example` vers `backend/.env` et configurer :

```env
# Base de données
DATABASE_URL=postgresql://esc_user:esc_password@localhost:5432/esc_db

# JWT
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret-key

# Email
MAIL_SERVER=smtp.gmail.com
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password

# CORS
CORS_ORIGINS=http://localhost:4200
```

## 📊 API Endpoints

### Authentification
```
POST /api/auth/register    # Inscription
POST /api/auth/login       # Connexion
POST /api/auth/refresh     # Renouveler token
POST /api/auth/logout      # Déconnexion
GET  /api/auth/profile     # Profil utilisateur
```

### Joueurs
```
GET    /api/players        # Liste des joueurs
GET    /api/players/{id}   # Détails d'un joueur
POST   /api/players        # Créer un joueur
PUT    /api/players/{id}   # Modifier un joueur
DELETE /api/players/{id}   # Supprimer un joueur
GET    /api/players/{id}/stats # Statistiques
```

### Matchs
```
GET    /api/matches        # Liste des matchs
GET    /api/matches/{id}   # Détails d'un match
POST   /api/matches        # Créer un match
PUT    /api/matches/{id}   # Modifier un match
GET    /api/matches/upcoming # Prochains matchs
GET    /api/matches/results  # Résultats récents
```

### Entraînements
```
GET    /api/trainings      # Liste des entraînements
POST   /api/trainings      # Créer un entraînement
PUT    /api/trainings/{id} # Modifier un entraînement
POST   /api/trainings/{id}/attendance # Marquer présence
```

### Finances
```
GET    /api/finances       # Transactions
POST   /api/finances       # Nouvelle transaction
PUT    /api/finances/{id}  # Modifier transaction
GET    /api/finances/summary # Résumé financier
```

### Actualités
```
GET    /api/news           # Articles (public)
GET    /api/news/{id}      # Article détaillé
POST   /api/news           # Créer article
PUT    /api/news/{id}      # Modifier article
POST   /api/news/{id}/publish # Publier article
```

## 🔐 Authentification

L'application utilise JWT (JSON Web Tokens) pour l'authentification :

1. **Connexion** : `POST /api/auth/login`
2. **Token d'accès** : Valide 1 heure
3. **Token de rafraîchissement** : Valide 30 jours
4. **Headers** : `Authorization: Bearer <token>`

### Rôles et Permissions
- **Admin** : Accès complet
- **Coach** : Gestion joueurs, matchs, entraînements
- **Staff** : Gestion finances, actualités
- **Joueur** : Consultation + modification profil
- **Supporter** : Consultation publique

## 🐳 Docker

### Développement
```bash
# Services de base
docker-compose up -d db redis

# Avec pgAdmin
docker-compose --profile development up -d
```

### Production
```bash
# Stack complète avec Nginx
docker-compose --profile production up -d
```

## 🧪 Tests

```bash
cd backend

# Tests unitaires
python -m pytest tests/

# Tests avec couverture
python -m pytest --cov=app tests/

# Tests d'intégration
python -m pytest tests/integration/
```

## 📈 Monitoring

### Health Check
```bash
curl http://localhost:5000/api/health
```

### Logs
```bash
# Logs de l'application
docker-compose logs -f backend

# Logs de la base de données
docker-compose logs -f db
```

## 🔧 Développement

### Structure des Modèles
- **User** : Utilisateurs et authentification
- **Player** : Profils des joueurs
- **Match** : Matchs et résultats
- **PlayerStats** : Statistiques par match
- **Training** : Séances d'entraînement
- **TrainingAttendance** : Présences aux entraînements
- **Finance** : Transactions financières
- **News** : Articles et actualités

### Ajout de Fonctionnalités
1. Créer le modèle dans `app/models/`
2. Ajouter les routes dans `app/routes/`
3. Créer les tests dans `tests/`
4. Mettre à jour la documentation

## 🚀 Déploiement

### Production avec Docker
```bash
# Build et déploiement
docker-compose -f docker-compose.yml --profile production up -d

# Mise à jour
docker-compose pull
docker-compose up -d --force-recreate
```

### Variables de Production
```env
FLASK_ENV=production
SECRET_KEY=<strong-secret-key>
JWT_SECRET_KEY=<strong-jwt-secret>
DATABASE_URL=<production-db-url>
```

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit les changements (`git commit -am 'Ajout nouvelle fonctionnalité'`)
4. Push vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Créer une Pull Request

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 👥 Équipe

- **Développement** : Équipe ESC Tech
- **Design** : À définir
- **Tests** : À définir

## 📞 Support

Pour toute question ou problème :
- 📧 Email : support@esc.tn
- 🐛 Issues : [GitHub Issues](repository-url/issues)
- 📖 Documentation : [Wiki](repository-url/wiki)

---

**Allez l'ESC ! 🏈⚽**
