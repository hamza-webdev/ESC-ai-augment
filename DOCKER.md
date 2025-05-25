# 🐳 ESC Football App - Guide Docker

**Configuration Docker complète pour l'Espoir Sportif de Chorbane**

## 📋 Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Fichiers Docker Compose](#fichiers-docker-compose)
- [Commandes rapides](#commandes-rapides)
- [Environnements](#environnements)
- [Services disponibles](#services-disponibles)
- [Volumes et données](#volumes-et-données)
- [Réseaux](#réseaux)
- [Troubleshooting](#troubleshooting)

## 🏗️ Vue d'ensemble

L'application ESC Football utilise Docker Compose pour orchestrer tous les services nécessaires. Plusieurs fichiers de configuration sont disponibles selon l'environnement :

```
📁 Configuration Docker
├── docker-compose.yml           # Configuration principale
├── docker-compose.dev.yml       # Développement
├── docker-compose.prod.yml      # Production
├── docker-compose.test.yml      # Tests
├── docker-compose.monitoring.yml # Monitoring
├── docker-compose.override.yml  # Overrides locaux
└── .env.prod.example            # Variables de production
```

## 📄 Fichiers Docker Compose

### `docker-compose.yml` - Configuration principale
- Services de base (PostgreSQL, Redis, Backend, Frontend)
- Configuration par défaut pour le développement
- Services optionnels avec profiles

### `docker-compose.dev.yml` - Développement
- Hot reload pour backend et frontend
- Outils de développement (pgAdmin, Redis Commander, Mailhog)
- Configuration optimisée pour le développement

### `docker-compose.prod.yml` - Production
- Configuration optimisée pour la production
- Nginx reverse proxy
- Celery workers
- Logging et monitoring
- Sauvegardes automatiques

### `docker-compose.test.yml` - Tests
- Tests unitaires et d'intégration
- Tests end-to-end avec Cypress
- Tests de performance avec Artillery
- Tests de sécurité avec OWASP ZAP

### `docker-compose.monitoring.yml` - Monitoring
- Prometheus + Grafana
- Alertmanager
- Loki + Promtail
- Jaeger tracing
- Uptime monitoring

### `docker-compose.override.yml` - Overrides locaux
- Configurations spécifiques au développement local
- Montages de volumes pour hot reload
- Ports exposés pour debugging

## ⚡ Commandes rapides

### Développement
```bash
# Démarrage rapide
make quick-start

# Développement avec Docker
make dev-docker

# Services de base seulement
docker-compose up -d db redis

# Avec outils de développement
make tools-up
```

### Production
```bash
# Déploiement production
make prod-docker

# Avec monitoring
make monitoring-up
```

### Tests
```bash
# Tests complets
make test-docker

# Tests unitaires seulement
docker-compose -f docker-compose.test.yml up backend-test frontend-test
```

### Maintenance
```bash
# Logs en temps réel
make docker-logs

# Statut des services
make docker-ps

# Nettoyage complet
make clean-docker
```

## 🌍 Environnements

### 🔧 Développement
**Fichiers utilisés :** `docker-compose.yml` + `docker-compose.override.yml`

**Services inclus :**
- PostgreSQL (port 5432)
- Redis (port 6379)
- Backend Flask (port 5000)
- Frontend Angular (port 4200)
- pgAdmin (port 5050)
- Redis Commander (port 8081)
- Mailhog (ports 1025, 8025)

**Commande :**
```bash
docker-compose up -d
# ou
make dev-docker
```

### 🚀 Production
**Fichiers utilisés :** `docker-compose.yml` + `docker-compose.prod.yml`

**Services inclus :**
- PostgreSQL avec configuration optimisée
- Redis avec authentification
- Backend Flask avec Gunicorn
- Frontend Angular optimisé
- Nginx reverse proxy (ports 80, 443)
- Celery workers
- Service de sauvegarde automatique

**Commande :**
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
# ou
make prod-docker
```

### 🧪 Tests
**Fichiers utilisés :** `docker-compose.test.yml`

**Services inclus :**
- Base de données de test (en mémoire)
- Redis de test
- Tests backend (pytest)
- Tests frontend (Karma/Jasmine)
- Tests E2E (Cypress)
- Tests de performance (Artillery)
- Tests de sécurité (OWASP ZAP)

**Commande :**
```bash
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
# ou
make test-docker
```

### 📊 Monitoring
**Fichiers utilisés :** `docker-compose.monitoring.yml`

**Services inclus :**
- Prometheus (port 9090)
- Grafana (port 3000)
- AlertManager (port 9093)
- Loki (port 3100)
- Jaeger (port 16686)
- Node Exporter (port 9100)
- cAdvisor (port 8080)

**Commande :**
```bash
docker-compose -f docker-compose.monitoring.yml up -d
# ou
make monitoring-up
```

## 🔧 Services disponibles

### Services principaux
| Service | Port | Description |
|---------|------|-------------|
| **Backend** | 5000 | API Flask |
| **Frontend** | 4200 | Application Angular |
| **PostgreSQL** | 5432 | Base de données |
| **Redis** | 6379 | Cache et sessions |

### Outils de développement
| Service | Port | Accès | Credentials |
|---------|------|-------|-------------|
| **pgAdmin** | 5050 | http://localhost:5050 | admin@esc.tn / admin123 |
| **Redis Commander** | 8081 | http://localhost:8081 | admin / admin123 |
| **Mailhog** | 8025 | http://localhost:8025 | - |
| **Adminer** | 8080 | http://localhost:8080 | - |

### Services de monitoring
| Service | Port | Accès | Credentials |
|---------|------|-------|-------------|
| **Grafana** | 3000 | http://localhost:3000 | admin / admin123 |
| **Prometheus** | 9090 | http://localhost:9090 | - |
| **Jaeger** | 16686 | http://localhost:16686 | - |
| **AlertManager** | 9093 | http://localhost:9093 | - |

## 💾 Volumes et données

### Volumes persistants
```bash
# Données de production
esc_postgres_prod_data     # Base de données PostgreSQL
esc_redis_prod_data        # Données Redis
esc_backend_prod_uploads   # Fichiers uploadés
esc_backend_prod_logs      # Logs de l'application

# Données de développement
esc_postgres_dev_data      # Base de données de développement
esc_redis_dev_data         # Redis de développement
esc_pip_cache             # Cache pip Python
esc_npm_cache             # Cache npm Node.js

# Monitoring
esc_prometheus_data        # Métriques Prometheus
esc_grafana_data          # Configuration Grafana
```

### Gestion des volumes
```bash
# Lister les volumes
docker volume ls | grep esc

# Sauvegarder un volume
docker run --rm -v esc_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz /data

# Restaurer un volume
docker run --rm -v esc_postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres_backup.tar.gz -C /

# Supprimer tous les volumes ESC
docker volume ls | grep esc | awk '{print $2}' | xargs docker volume rm
```

## 🌐 Réseaux

### Réseaux Docker
- **esc_network** (172.20.0.0/16) - Réseau principal
- **esc_dev_network** (172.21.0.0/16) - Développement
- **esc_prod_network** (172.22.0.0/16) - Production
- **esc_test_network** (172.23.0.0/16) - Tests
- **esc_monitoring_network** (172.24.0.0/16) - Monitoring

### Communication inter-services
```bash
# Backend vers PostgreSQL
DATABASE_URL=postgresql://user:pass@db:5432/database

# Backend vers Redis
REDIS_URL=redis://redis:6379/0

# Frontend vers Backend
API_URL=http://backend:5000/api
```

## 🔍 Troubleshooting

### Problèmes courants

#### Services qui ne démarrent pas
```bash
# Vérifier les logs
docker-compose logs service_name

# Vérifier l'état des services
docker-compose ps

# Redémarrer un service
docker-compose restart service_name
```

#### Problèmes de base de données
```bash
# Réinitialiser la base de données
docker-compose down -v
docker-compose up -d db
make db-reset
```

#### Problèmes de cache
```bash
# Vider le cache Redis
docker-compose exec redis redis-cli FLUSHALL

# Reconstruire les images
docker-compose build --no-cache
```

#### Problèmes de réseau
```bash
# Recréer les réseaux
docker-compose down
docker network prune
docker-compose up -d
```

### Commandes de diagnostic
```bash
# Santé des services
make health

# Utilisation des ressources
docker stats

# Espace disque utilisé
docker system df

# Nettoyage complet
docker system prune -a --volumes
```

### Logs et debugging
```bash
# Logs en temps réel
docker-compose logs -f

# Logs d'un service spécifique
docker-compose logs -f backend

# Accéder au shell d'un conteneur
docker-compose exec backend bash
docker-compose exec frontend sh

# Debugging Python
docker-compose exec backend python -m pdb app.py
```

## 📚 Ressources supplémentaires

- [Documentation Docker Compose](https://docs.docker.com/compose/)
- [Guide des bonnes pratiques Docker](https://docs.docker.com/develop/best-practices/)
- [Sécurité Docker](https://docs.docker.com/engine/security/)
- [Monitoring avec Prometheus](https://prometheus.io/docs/)
- [Grafana Dashboards](https://grafana.com/grafana/dashboards/)

---

**🏈 ESC Football App - Dockerisé pour tous les environnements !**
