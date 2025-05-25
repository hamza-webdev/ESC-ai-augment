#!/bin/bash

# ESC Football App - Script de démarrage rapide
# Espoir Sportif de Chorbane

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${BLUE}"
    echo "=================================================="
    echo "🏈 ESC Football App - Démarrage Rapide"
    echo "   Espoir Sportif de Chorbane"
    echo "=================================================="
    echo -e "${NC}"
}

print_step() {
    echo -e "${YELLOW}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

check_requirements() {
    print_step "Vérification des prérequis..."

    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker n'est pas installé. Veuillez l'installer d'abord."
        exit 1
    fi

    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose n'est pas installé. Veuillez l'installer d'abord."
        exit 1
    fi

    # Check Make (optional)
    if command -v make &> /dev/null; then
        MAKE_AVAILABLE=true
        print_success "Make est disponible"
    else
        MAKE_AVAILABLE=false
        print_info "Make n'est pas disponible, utilisation des commandes Docker directes"
    fi

    print_success "Prérequis vérifiés"
}

setup_environment() {
    print_step "Configuration de l'environnement..."

    # Create .env file for backend if it doesn't exist
    if [ ! -f backend/.env ]; then
        print_info "Création du fichier .env pour le backend..."
        cp backend/.env.example backend/.env 2>/dev/null || {
            cat > backend/.env << EOF
# Flask Configuration
FLASK_ENV=development
FLASK_DEBUG=1
SECRET_KEY=dev-secret-key-change-in-production
JWT_SECRET_KEY=dev-jwt-secret-key-change-in-production

# Database Configuration
DATABASE_URL=postgresql://esc_user:esc_password@localhost:5432/esc_db
REDIS_URL=redis://localhost:6379/0

# CORS Configuration
CORS_ORIGINS=http://localhost:4200,http://localhost:3000

# Upload Configuration
UPLOAD_FOLDER=uploads
MAX_CONTENT_LENGTH=16777216

# Email Configuration (optional)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=1
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
EOF
        }
        print_success "Fichier .env créé"
    else
        print_info "Fichier .env existe déjà"
    fi

    # Create uploads directory
    mkdir -p backend/uploads
    mkdir -p backups

    print_success "Environnement configuré"
}

start_database() {
    print_step "Démarrage des services de base de données..."

    # Start database services
    docker-compose up -d db redis

    # Wait for database to be ready
    print_info "Attente de la disponibilité de PostgreSQL..."
    sleep 10

    # Check if database is ready
    for i in {1..30}; do
        if docker-compose exec -T db pg_isready -U esc_user -d esc_db &> /dev/null; then
            print_success "PostgreSQL est prêt"
            break
        fi

        if [ $i -eq 30 ]; then
            print_error "Timeout: PostgreSQL n'est pas disponible"
            exit 1
        fi

        echo -n "."
        sleep 2
    done

    print_success "Services de base de données démarrés"
}

initialize_database() {
    print_step "Initialisation de la base de données..."

    # Check if database is already initialized
    if docker-compose exec -T db psql -U esc_user -d esc_db -c "SELECT 1 FROM users LIMIT 1;" &> /dev/null; then
        print_info "Base de données déjà initialisée"
        return
    fi

    # Initialize database
    if [ -f backend/init_db.py ]; then
        print_info "Exécution du script d'initialisation..."
        cd backend && python init_db.py && cd ..
        print_success "Base de données initialisée avec succès"
    else
        print_info "Script d'initialisation non trouvé, création des tables de base..."
        # Create basic tables using SQL
        docker-compose exec -T db psql -U esc_user -d esc_db -c "
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(80) UNIQUE NOT NULL,
                email VARCHAR(120) UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(20) DEFAULT 'player',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            INSERT INTO users (username, email, password_hash, role)
            VALUES ('admin', 'admin@esc.tn', 'pbkdf2:sha256:260000\$salt\$hash', 'admin')
            ON CONFLICT (username) DO NOTHING;
        "
        print_success "Tables de base créées"
    fi
}

install_dependencies() {
    print_step "Installation des dépendances..."

    # Backend dependencies
    if [ -f backend/requirements.txt ]; then
        print_info "Installation des dépendances Python..."
        cd backend
        if command -v python3 &> /dev/null; then
            python3 -m pip install -r requirements.txt &> /dev/null || true
        fi
        cd ..
    fi

    # Frontend dependencies
    if [ -f frontend/package.json ]; then
        print_info "Installation des dépendances Node.js..."
        cd frontend
        if command -v npm &> /dev/null; then
            npm install &> /dev/null || true
        fi
        cd ..
    fi

    print_success "Dépendances installées"
}

start_services() {
    print_step "Démarrage des services de l'application..."

    if [ "$MAKE_AVAILABLE" = true ]; then
        print_info "Utilisation de Make pour démarrer les services..."
        make docker-up &> /dev/null || docker-compose up -d
    else
        print_info "Démarrage avec Docker Compose..."
        docker-compose up -d
    fi

    print_success "Services démarrés"
}

show_status() {
    print_step "Vérification du statut des services..."

    echo ""
    docker-compose ps
    echo ""

    print_success "Application ESC Football démarrée avec succès !"
    echo ""
    print_info "🌐 Accès aux services :"
    echo "   • Frontend Angular: http://localhost:4200"
    echo "   • Backend API: http://localhost:5000"
    echo "   • API Health Check: http://localhost:5000/api/health"
    echo "   • pgAdmin: http://localhost:5050"
    echo "     - Email: admin@esc.tn"
    echo "     - Mot de passe: admin123"
    echo ""
    print_info "📚 Commandes utiles :"
    if [ "$MAKE_AVAILABLE" = true ]; then
        echo "   • Voir l'aide: make help"
        echo "   • Démarrer le développement: make dev"
        echo "   • Voir les logs: make logs"
        echo "   • Arrêter les services: make stop"
        echo "   • Statut: make status"
    else
        echo "   • Voir les logs: docker-compose logs -f"
        echo "   • Arrêter les services: docker-compose down"
        echo "   • Statut: docker-compose ps"
    fi
    echo ""
    print_info "🔐 Comptes par défaut :"
    echo "   • Admin: admin / admin123"
    echo "   • Coach: coach / coach123"
    echo ""
}

cleanup_on_error() {
    print_error "Erreur détectée, nettoyage..."
    docker-compose down &> /dev/null || true
    exit 1
}

# Main execution
main() {
    # Set up error handling
    trap cleanup_on_error ERR

    print_header

    check_requirements
    setup_environment
    start_database
    initialize_database
    install_dependencies
    start_services

    # Wait a bit for services to start
    sleep 5

    show_status
}

# Run main function
main "$@"
