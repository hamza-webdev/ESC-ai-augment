# ESC Football App - Makefile
# Espoir Sportif de Chorbane - Application de gestion d'équipe de football

# Variables
DOCKER_COMPOSE = docker-compose
BACKEND_DIR = backend
FRONTEND_DIR = frontend
PYTHON = python
NPM = npm
NG = ng

# Colors for output
RED = \033[0;31m
GREEN = \033[0;32m
YELLOW = \033[1;33m
BLUE = \033[0;34m
NC = \033[0m # No Color

# Default target
.DEFAULT_GOAL := help

# Help target
.PHONY: help
help: ## Affiche l'aide
	@echo "$(BLUE)ESC Football App - Commandes disponibles:$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(GREEN)%-20s$(NC) %s\n", $$1, $$2}'

# =============================================================================
# SETUP & INSTALLATION
# =============================================================================

.PHONY: install
install: ## Installation complète du projet
	@echo "$(YELLOW)🚀 Installation de l'application ESC Football...$(NC)"
	@$(MAKE) install-backend
	@$(MAKE) install-frontend
	@echo "$(GREEN)✅ Installation terminée !$(NC)"

.PHONY: install-backend
install-backend: ## Installation des dépendances backend
	@echo "$(YELLOW)📦 Installation des dépendances Python...$(NC)"
	cd $(BACKEND_DIR) && pip install -r requirements.txt
	@echo "$(GREEN)✅ Dépendances backend installées$(NC)"

.PHONY: install-frontend
install-frontend: ## Installation des dépendances frontend
	@echo "$(YELLOW)📦 Installation des dépendances Angular...$(NC)"
	cd $(FRONTEND_DIR) && $(NPM) install
	@echo "$(GREEN)✅ Dépendances frontend installées$(NC)"

.PHONY: setup
setup: ## Configuration initiale du projet
	@echo "$(YELLOW)🔧 Configuration du projet ESC...$(NC)"
	@$(MAKE) setup-env
	@$(MAKE) setup-db
	@echo "$(GREEN)✅ Configuration terminée !$(NC)"

.PHONY: setup-env
setup-env: ## Création des fichiers d'environnement
	@echo "$(YELLOW)📝 Création des fichiers d'environnement...$(NC)"
	@if [ ! -f $(BACKEND_DIR)/.env ]; then \
		cp $(BACKEND_DIR)/.env.example $(BACKEND_DIR)/.env; \
		echo "$(GREEN)✅ Fichier .env créé pour le backend$(NC)"; \
	else \
		echo "$(BLUE)ℹ️  Fichier .env existe déjà$(NC)"; \
	fi

.PHONY: setup-db
setup-db: ## Initialisation de la base de données
	@echo "$(YELLOW)🗄️  Initialisation de la base de données...$(NC)"
	@$(MAKE) db-start
	@sleep 5
	cd $(BACKEND_DIR) && $(PYTHON) init_db.py
	@echo "$(GREEN)✅ Base de données initialisée$(NC)"

# =============================================================================
# DEVELOPMENT
# =============================================================================

.PHONY: dev
dev: ## Démarrage en mode développement (backend + frontend)
	@echo "$(YELLOW)🚀 Démarrage en mode développement...$(NC)"
	@$(MAKE) -j2 dev-backend dev-frontend

.PHONY: dev-backend
dev-backend: ## Démarrage du backend en mode développement
	@echo "$(YELLOW)🐍 Démarrage du backend Flask...$(NC)"
	cd $(BACKEND_DIR) && $(PYTHON) app.py

.PHONY: dev-frontend
dev-frontend: ## Démarrage du frontend en mode développement
	@echo "$(YELLOW)🅰️  Démarrage du frontend Angular...$(NC)"
	cd $(FRONTEND_DIR) && $(NG) serve --host 0.0.0.0 --port 4200

.PHONY: dev-watch
dev-watch: ## Démarrage avec rechargement automatique
	@echo "$(YELLOW)👀 Démarrage avec surveillance des fichiers...$(NC)"
	@$(MAKE) -j2 dev-backend-watch dev-frontend

.PHONY: dev-backend-watch
dev-backend-watch: ## Backend avec rechargement automatique
	cd $(BACKEND_DIR) && $(PYTHON) -m flask run --reload --host=0.0.0.0 --port=5000

# =============================================================================
# DATABASE
# =============================================================================

.PHONY: db-start
db-start: ## Démarrage des services de base de données
	@echo "$(YELLOW)🗄️  Démarrage de PostgreSQL et Redis...$(NC)"
	$(DOCKER_COMPOSE) up -d db redis
	@echo "$(GREEN)✅ Services de base de données démarrés$(NC)"

.PHONY: db-stop
db-stop: ## Arrêt des services de base de données
	@echo "$(YELLOW)🛑 Arrêt des services de base de données...$(NC)"
	$(DOCKER_COMPOSE) stop db redis
	@echo "$(GREEN)✅ Services de base de données arrêtés$(NC)"

.PHONY: db-reset
db-reset: ## Réinitialisation complète de la base de données
	@echo "$(RED)⚠️  Réinitialisation de la base de données...$(NC)"
	@read -p "Êtes-vous sûr de vouloir supprimer toutes les données ? (y/N): " confirm && [ "$$confirm" = "y" ]
	$(DOCKER_COMPOSE) down -v
	$(DOCKER_COMPOSE) up -d db redis
	@sleep 5
	cd $(BACKEND_DIR) && $(PYTHON) init_db.py
	@echo "$(GREEN)✅ Base de données réinitialisée$(NC)"

.PHONY: db-backup
db-backup: ## Sauvegarde de la base de données
	@echo "$(YELLOW)💾 Sauvegarde de la base de données...$(NC)"
	@mkdir -p backups
	$(DOCKER_COMPOSE) exec db pg_dump -U esc_user esc_db > backups/esc_backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)✅ Sauvegarde créée dans le dossier backups/$(NC)"

.PHONY: db-restore
db-restore: ## Restauration de la base de données (usage: make db-restore FILE=backup.sql)
	@echo "$(YELLOW)🔄 Restauration de la base de données...$(NC)"
	@if [ -z "$(FILE)" ]; then echo "$(RED)❌ Veuillez spécifier le fichier: make db-restore FILE=backup.sql$(NC)"; exit 1; fi
	$(DOCKER_COMPOSE) exec -T db psql -U esc_user -d esc_db < $(FILE)
	@echo "$(GREEN)✅ Base de données restaurée$(NC)"

.PHONY: db-shell
db-shell: ## Connexion au shell PostgreSQL
	@echo "$(YELLOW)🐘 Connexion à PostgreSQL...$(NC)"
	$(DOCKER_COMPOSE) exec db psql -U esc_user -d esc_db

# =============================================================================
# DOCKER
# =============================================================================

.PHONY: docker-build
docker-build: ## Construction des images Docker
	@echo "$(YELLOW)🐳 Construction des images Docker...$(NC)"
	$(DOCKER_COMPOSE) build
	@echo "$(GREEN)✅ Images Docker construites$(NC)"

.PHONY: docker-up
docker-up: ## Démarrage de tous les services Docker
	@echo "$(YELLOW)🐳 Démarrage de tous les services...$(NC)"
	$(DOCKER_COMPOSE) up -d
	@echo "$(GREEN)✅ Tous les services sont démarrés$(NC)"

.PHONY: docker-down
docker-down: ## Arrêt de tous les services Docker
	@echo "$(YELLOW)🛑 Arrêt de tous les services...$(NC)"
	$(DOCKER_COMPOSE) down
	@echo "$(GREEN)✅ Tous les services sont arrêtés$(NC)"

.PHONY: docker-logs
docker-logs: ## Affichage des logs Docker
	$(DOCKER_COMPOSE) logs -f

.PHONY: docker-ps
docker-ps: ## Statut des conteneurs Docker
	$(DOCKER_COMPOSE) ps

# =============================================================================
# DOCKER COMPOSE SPÉCIALISÉS
# =============================================================================

.PHONY: dev-docker
dev-docker: ## Démarrage avec docker-compose.dev.yml
	@echo "$(YELLOW)🐳 Démarrage en mode développement Docker...$(NC)"
	docker-compose -f docker-compose.dev.yml up -d
	@echo "$(GREEN)✅ Services de développement démarrés$(NC)"

.PHONY: prod-docker
prod-docker: ## Démarrage avec docker-compose.prod.yml
	@echo "$(YELLOW)🐳 Démarrage en mode production Docker...$(NC)"
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
	@echo "$(GREEN)✅ Services de production démarrés$(NC)"

.PHONY: test-docker
test-docker: ## Exécution des tests avec Docker
	@echo "$(YELLOW)🐳 Exécution des tests avec Docker...$(NC)"
	docker-compose -f docker-compose.test.yml up --abort-on-container-exit
	@echo "$(GREEN)✅ Tests terminés$(NC)"

.PHONY: monitoring-up
monitoring-up: ## Démarrage des services de monitoring
	@echo "$(YELLOW)🐳 Démarrage du monitoring...$(NC)"
	docker-compose -f docker-compose.monitoring.yml up -d
	@echo "$(GREEN)✅ Services de monitoring démarrés$(NC)"

.PHONY: monitoring-down
monitoring-down: ## Arrêt des services de monitoring
	@echo "$(YELLOW)🛑 Arrêt du monitoring...$(NC)"
	docker-compose -f docker-compose.monitoring.yml down
	@echo "$(GREEN)✅ Services de monitoring arrêtés$(NC)"

.PHONY: tools-up
tools-up: ## Démarrage des outils de développement
	@echo "$(YELLOW)🐳 Démarrage des outils...$(NC)"
	$(DOCKER_COMPOSE) --profile tools up -d
	@echo "$(GREEN)✅ Outils de développement démarrés$(NC)"

# =============================================================================
# TESTING
# =============================================================================

.PHONY: test
test: ## Exécution de tous les tests
	@echo "$(YELLOW)🧪 Exécution des tests...$(NC)"
	@$(MAKE) test-backend
	@$(MAKE) test-frontend
	@echo "$(GREEN)✅ Tous les tests terminés$(NC)"

.PHONY: test-backend
test-backend: ## Tests backend Python
	@echo "$(YELLOW)🐍 Tests backend...$(NC)"
	cd $(BACKEND_DIR) && $(PYTHON) -m pytest tests/ -v
	@echo "$(GREEN)✅ Tests backend terminés$(NC)"

.PHONY: test-frontend
test-frontend: ## Tests frontend Angular
	@echo "$(YELLOW)🅰️  Tests frontend...$(NC)"
	cd $(FRONTEND_DIR) && $(NPM) test
	@echo "$(GREEN)✅ Tests frontend terminés$(NC)"

.PHONY: test-e2e
test-e2e: ## Tests end-to-end
	@echo "$(YELLOW)🔄 Tests end-to-end...$(NC)"
	cd $(FRONTEND_DIR) && $(NPM) run e2e
	@echo "$(GREEN)✅ Tests e2e terminés$(NC)"

# =============================================================================
# BUILD & DEPLOYMENT
# =============================================================================

.PHONY: build
build: ## Construction pour la production
	@echo "$(YELLOW)🏗️  Construction pour la production...$(NC)"
	@$(MAKE) build-frontend
	@echo "$(GREEN)✅ Construction terminée$(NC)"

.PHONY: build-frontend
build-frontend: ## Construction du frontend
	@echo "$(YELLOW)🅰️  Construction du frontend Angular...$(NC)"
	cd $(FRONTEND_DIR) && $(NG) build --configuration production
	@echo "$(GREEN)✅ Frontend construit$(NC)"

.PHONY: deploy-prod
deploy-prod: ## Déploiement en production
	@echo "$(YELLOW)🚀 Déploiement en production...$(NC)"
	@$(MAKE) build
	$(DOCKER_COMPOSE) -f docker-compose.yml --profile production up -d
	@echo "$(GREEN)✅ Déploiement terminé$(NC)"

# =============================================================================
# MAINTENANCE
# =============================================================================

.PHONY: clean
clean: ## Nettoyage des fichiers temporaires
	@echo "$(YELLOW)🧹 Nettoyage...$(NC)"
	@$(MAKE) clean-backend
	@$(MAKE) clean-frontend
	@echo "$(GREEN)✅ Nettoyage terminé$(NC)"

.PHONY: clean-backend
clean-backend: ## Nettoyage backend
	@echo "$(YELLOW)🐍 Nettoyage backend...$(NC)"
	cd $(BACKEND_DIR) && find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	cd $(BACKEND_DIR) && find . -name "*.pyc" -delete 2>/dev/null || true
	@echo "$(GREEN)✅ Backend nettoyé$(NC)"

.PHONY: clean-frontend
clean-frontend: ## Nettoyage frontend
	@echo "$(YELLOW)🅰️  Nettoyage frontend...$(NC)"
	cd $(FRONTEND_DIR) && rm -rf dist/ node_modules/.cache/ 2>/dev/null || true
	@echo "$(GREEN)✅ Frontend nettoyé$(NC)"

.PHONY: clean-docker
clean-docker: ## Nettoyage Docker complet
	@echo "$(YELLOW)🐳 Nettoyage Docker...$(NC)"
	$(DOCKER_COMPOSE) down -v --remove-orphans
	docker system prune -f
	@echo "$(GREEN)✅ Docker nettoyé$(NC)"

.PHONY: update
update: ## Mise à jour des dépendances
	@echo "$(YELLOW)🔄 Mise à jour des dépendances...$(NC)"
	cd $(BACKEND_DIR) && pip install --upgrade -r requirements.txt
	cd $(FRONTEND_DIR) && $(NPM) update
	@echo "$(GREEN)✅ Dépendances mises à jour$(NC)"

# =============================================================================
# UTILITIES
# =============================================================================

.PHONY: status
status: ## Statut de l'application
	@echo "$(BLUE)📊 Statut de l'application ESC Football:$(NC)"
	@echo ""
	@echo "$(YELLOW)🐳 Services Docker:$(NC)"
	@$(DOCKER_COMPOSE) ps || echo "$(RED)❌ Docker Compose non disponible$(NC)"
	@echo ""
	@echo "$(YELLOW)🌐 Endpoints:$(NC)"
	@echo "  • Backend API: http://localhost:5000"
	@echo "  • Frontend:    http://localhost:4200"
	@echo "  • pgAdmin:     http://localhost:5050"
	@echo ""

.PHONY: logs
logs: ## Affichage des logs en temps réel
	@echo "$(YELLOW)📋 Logs de l'application...$(NC)"
	$(DOCKER_COMPOSE) logs -f backend frontend

.PHONY: shell-backend
shell-backend: ## Shell dans le conteneur backend
	$(DOCKER_COMPOSE) exec backend bash

.PHONY: shell-frontend
shell-frontend: ## Shell dans le conteneur frontend
	$(DOCKER_COMPOSE) exec frontend bash

.PHONY: health
health: ## Vérification de la santé de l'application
	@echo "$(YELLOW)🏥 Vérification de la santé...$(NC)"
	@curl -s http://localhost:5000/api/health || echo "$(RED)❌ Backend non accessible$(NC)"
	@curl -s http://localhost:4200 > /dev/null && echo "$(GREEN)✅ Frontend accessible$(NC)" || echo "$(RED)❌ Frontend non accessible$(NC)"

# =============================================================================
# QUICK START
# =============================================================================

.PHONY: quick-start
quick-start: ## Démarrage rapide complet
	@echo "$(BLUE)🏈 ESC Football App - Démarrage rapide$(NC)"
	@echo "$(YELLOW)🚀 Installation et démarrage...$(NC)"
	@$(MAKE) setup-env
	@$(MAKE) db-start
	@sleep 5
	@$(MAKE) setup-db
	@echo "$(GREEN)✅ Application prête !$(NC)"
	@echo ""
	@echo "$(BLUE)Pour démarrer le développement:$(NC)"
	@echo "  make dev"
	@echo ""
	@echo "$(BLUE)Endpoints disponibles:$(NC)"
	@echo "  • API: http://localhost:5000/api/health"
	@echo "  • Frontend: http://localhost:4200 (après 'make dev-frontend')"
	@echo ""

# =============================================================================
# ALIASES
# =============================================================================

.PHONY: start
start: dev ## Alias pour 'dev'

.PHONY: stop
stop: docker-down ## Alias pour 'docker-down'

.PHONY: restart
restart: ## Redémarrage complet
	@$(MAKE) stop
	@$(MAKE) start

.PHONY: init
init: quick-start ## Alias pour 'quick-start'
