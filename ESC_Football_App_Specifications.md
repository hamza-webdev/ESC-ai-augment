# Application Web ESC (Espoir Sportif de Chorbane) - Spécifications Détaillées

## Vue d'ensemble du projet

Développer une application web moderne pour la gestion complète de l'équipe de football Espoir Sportif de Chorbane, avec une architecture full-stack comprenant :
- **Frontend** : Angular (dernière version stable)
- **Backend** : Python Flask avec API REST
- **Base de données** : PostgreSQL
- **Authentification** : JWT tokens
- **Déploiement** : Docker containers

## Fonctionnalités principales

### 1. Gestion des joueurs
- Profils détaillés des joueurs (informations personnelles, statistiques, photos)
- Historique des performances et blessures
- Contrats et statuts (actif, prêté, suspendu)
- Système de notation et évaluation

### 2. Gestion de l'équipe technique
- Profils des entraîneurs, staff médical, dirigeants
- Rôles et permissions différenciés
- Planning des responsabilités

### 3. Calendrier et matchs
- Planification des matchs (championnat, coupes, amicaux)
- Résultats et statistiques détaillées
- Compositions d'équipe et remplacements
- Rapports de match

### 4. Entraînements
- Planification des séances d'entraînement
- Présences et absences
- Programmes d'entraînement personnalisés
- Suivi de la condition physique

### 5. Finances
- Gestion du budget du club
- Salaires des joueurs et staff
- Revenus (sponsors, billetterie, transferts)
- Dépenses (équipements, déplacements, infrastructures)

### 6. Communication
- Actualités du club
- Galerie photos/vidéos
- Système de notifications
- Interface publique pour les supporters

## Architecture technique détaillée

### Frontend Angular

```
src/
├── app/
│   ├── core/                 # Services singleton, guards, interceptors
│   │   ├── auth/
│   │   ├── guards/
│   │   └── services/
│   ├── shared/               # Composants, pipes, directives réutilisables
│   │   ├── components/
│   │   ├── pipes/
│   │   └── directives/
│   ├── features/             # Modules fonctionnels
│   │   ├── players/
│   │   ├── matches/
│   │   ├── training/
│   │   ├── finances/
│   │   └── dashboard/
│   ├── layout/               # Composants de mise en page
│   └── models/               # Interfaces TypeScript
├── assets/
└── environments/
```

**Technologies Angular à utiliser :**
- Angular Material pour l'UI
- NgRx pour la gestion d'état
- Angular Router avec lazy loading
- Reactive Forms
- HttpClient avec interceptors
- Angular PWA pour le mode hors-ligne

### Backend Flask

```
backend/
├── app/
│   ├── __init__.py
│   ├── models/               # Modèles SQLAlchemy
│   │   ├── user.py
│   │   ├── player.py
│   │   ├── match.py
│   │   └── training.py
│   ├── routes/               # Routes API
│   │   ├── auth.py
│   │   ├── players.py
│   │   ├── matches.py
│   │   └── training.py
│   ├── services/             # Logique métier
│   ├── utils/                # Utilitaires
│   └── config.py
├── migrations/               # Migrations Alembic
├── tests/
└── requirements.txt
```

**Technologies Flask à utiliser :**
- Flask-SQLAlchemy pour l'ORM
- Flask-Migrate pour les migrations
- Flask-JWT-Extended pour l'authentification
- Flask-CORS pour les requêtes cross-origin
- Flask-Mail pour les emails
- Marshmallow pour la sérialisation
- Celery pour les tâches asynchrones

### Base de données PostgreSQL

```sql
-- Tables principales
- users (id, username, email, password_hash, role, created_at)
- players (id, user_id, first_name, last_name, position, jersey_number, birth_date, nationality)
- matches (id, opponent, date, location, competition, result, goals_for, goals_against)
- trainings (id, date, duration, type, attendance, notes)
- player_stats (id, player_id, match_id, goals, assists, yellow_cards, red_cards)
- finances (id, type, amount, description, date, category)
- news (id, title, content, author_id, published_at, featured_image)
```

## Spécifications techniques détaillées

### API REST Endpoints

```
Authentication:
POST /api/auth/login
POST /api/auth/register
POST /api/auth/refresh
POST /api/auth/logout

Players:
GET /api/players
GET /api/players/{id}
POST /api/players
PUT /api/players/{id}
DELETE /api/players/{id}
GET /api/players/{id}/stats

Matches:
GET /api/matches
GET /api/matches/{id}
POST /api/matches
PUT /api/matches/{id}
GET /api/matches/upcoming
GET /api/matches/results

Training:
GET /api/trainings
POST /api/trainings
PUT /api/trainings/{id}
GET /api/trainings/{id}/attendance
```

### Sécurité
- Authentification JWT avec refresh tokens
- Hachage des mots de passe avec bcrypt
- Validation des données côté client et serveur
- Protection CSRF
- Rate limiting sur les API
- HTTPS obligatoire en production

### Performance
- Pagination pour les listes
- Cache Redis pour les données fréquemment consultées
- Optimisation des requêtes SQL
- Lazy loading des modules Angular
- Compression des images
- CDN pour les assets statiques

## Interface utilisateur

### Dashboard principal
- Vue d'ensemble des statistiques clés
- Prochains matchs et entraînements
- Actualités récentes
- Graphiques de performance

### Design responsive
- Mobile-first approach
- Breakpoints : mobile (< 768px), tablet (768-1024px), desktop (> 1024px)
- Navigation adaptative
- Thème aux couleurs du club

### Accessibilité
- Conformité WCAG 2.1 AA
- Support des lecteurs d'écran
- Navigation au clavier
- Contrastes suffisants

## Déploiement et DevOps

### Containerisation Docker

```dockerfile
# Frontend Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
FROM nginx:alpine
COPY --from=0 /app/dist /usr/share/nginx/html

# Backend Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]
```

### Docker Compose

```yaml
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "4200:80"
  
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/esc_db
  
  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=esc_db
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

## Plan de développement

### Phase 1 : Infrastructure (2 semaines)
1. Configuration de l'environnement de développement
2. Setup des projets Angular et Flask
3. Configuration de la base de données PostgreSQL
4. Mise en place de l'authentification JWT

### Phase 2 : Fonctionnalités core (4 semaines)
1. Gestion des utilisateurs et authentification
2. CRUD des joueurs
3. Gestion des matchs
4. Dashboard principal

### Phase 3 : Fonctionnalités avancées (4 semaines)
1. Système d'entraînements
2. Gestion financière
3. Module de communication
4. Statistiques avancées

### Phase 4 : Finalisation (2 semaines)
1. Tests complets
2. Optimisations performance
3. Documentation
4. Déploiement production
