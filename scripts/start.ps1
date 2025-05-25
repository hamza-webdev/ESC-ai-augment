# ESC Football App - Script de démarrage rapide (PowerShell)
# Espoir Sportif de Chorbane

param(
    [switch]$SkipChecks,
    [switch]$Verbose
)

# Configuration
$ErrorActionPreference = "Stop"

# Colors for output
function Write-Header {
    param([string]$Message)
    Write-Host "==================================================" -ForegroundColor Blue
    Write-Host "🏈 ESC Football App - Démarrage Rapide" -ForegroundColor Blue
    Write-Host "   Espoir Sportif de Chorbane" -ForegroundColor Blue
    Write-Host "==================================================" -ForegroundColor Blue
}

function Write-Step {
    param([string]$Message)
    Write-Host "📋 $Message" -ForegroundColor Yellow
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Cyan
}

function Test-CommandExists {
    param([string]$Command)
    $null = Get-Command $Command -ErrorAction SilentlyContinue
    return $?
}

function Test-Requirements {
    Write-Step "Vérification des prérequis..."

    $allGood = $true

    # Check Docker
    if (-not (Test-CommandExists "docker")) {
        Write-Error "Docker n'est pas installé. Veuillez l'installer d'abord."
        $allGood = $false
    }

    # Check Docker Compose
    if (-not (Test-CommandExists "docker-compose")) {
        Write-Error "Docker Compose n'est pas installé. Veuillez l'installer d'abord."
        $allGood = $false
    }

    # Check if Docker is running
    try {
        docker version | Out-Null
        Write-Success "Docker est en cours d'exécution"
    }
    catch {
        Write-Error "Docker n'est pas en cours d'exécution. Veuillez le démarrer."
        $allGood = $false
    }

    if (-not $allGood) {
        exit 1
    }

    Write-Success "Prérequis vérifiés"
}

function Initialize-Environment {
    Write-Step "Configuration de l'environnement..."

    # Create .env file for backend if it doesn't exist
    $envFile = "backend\.env"
    if (-not (Test-Path $envFile)) {
        Write-Info "Création du fichier .env pour le backend..."

        $envContent = @"
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
"@

        $envContent | Out-File -FilePath $envFile -Encoding UTF8
        Write-Success "Fichier .env créé"
    }
    else {
        Write-Info "Fichier .env existe déjà"
    }

    # Create directories
    if (-not (Test-Path "backend\uploads")) {
        New-Item -ItemType Directory -Path "backend\uploads" -Force | Out-Null
    }

    if (-not (Test-Path "backups")) {
        New-Item -ItemType Directory -Path "backups" -Force | Out-Null
    }

    Write-Success "Environnement configuré"
}

function Start-DatabaseServices {
    Write-Step "Démarrage des services de base de données..."

    # Start database services
    docker-compose up -d db redis

    # Wait for database to be ready
    Write-Info "Attente de la disponibilité de PostgreSQL..."
    Start-Sleep -Seconds 10

    # Check if database is ready
    $maxAttempts = 30
    $attempt = 0

    do {
        $attempt++
        try {
            docker-compose exec -T db pg_isready -U esc_user -d esc_db | Out-Null
            Write-Success "PostgreSQL est prêt"
            break
        }
        catch {
            if ($attempt -eq $maxAttempts) {
                Write-Error "Timeout: PostgreSQL n'est pas disponible"
                exit 1
            }
            Write-Host "." -NoNewline
            Start-Sleep -Seconds 2
        }
    } while ($attempt -lt $maxAttempts)

    Write-Success "Services de base de données démarrés"
}

function Initialize-Database {
    Write-Step "Initialisation de la base de données..."

    # Check if database is already initialized
    try {
        docker-compose exec -T db psql -U esc_user -d esc_db -c "SELECT 1 FROM users LIMIT 1;" | Out-Null
        Write-Info "Base de données déjà initialisée"
        return
    }
    catch {
        # Database not initialized, continue
    }

    # Initialize database
    if (Test-Path "backend\init_db.py") {
        Write-Info "Exécution du script d'initialisation..."
        Push-Location backend
        try {
            python init_db.py
            Write-Success "Base de données initialisée avec succès"
        }
        catch {
            Write-Error "Erreur lors de l'initialisation de la base de données"
        }
        finally {
            Pop-Location
        }
    }
    else {
        Write-Info "Script d'initialisation non trouvé, création des tables de base..."

        $sql = @"
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(80) UNIQUE NOT NULL,
    email VARCHAR(120) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'player',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (username, email, password_hash, role)
VALUES ('admin', 'admin@esc.tn', 'pbkdf2:sha256:260000$salt$hash', 'admin')
ON CONFLICT (username) DO NOTHING;
"@

        docker-compose exec -T db psql -U esc_user -d esc_db -c $sql
        Write-Success "Tables de base créées"
    }
}

function Start-AllServices {
    Write-Step "Démarrage de tous les services..."

    docker-compose up -d

    Write-Success "Services démarrés"
}

function Show-Status {
    Write-Step "Vérification du statut des services..."

    Write-Host ""
    docker-compose ps
    Write-Host ""

    Write-Success "Application ESC Football démarrée avec succès !"
    Write-Host ""
    Write-Info "🌐 Accès aux services :"
    Write-Host "   • Frontend Angular: http://localhost:5005" -ForegroundColor White
    Write-Host "   • Backend API: http://localhost:5000" -ForegroundColor White
    Write-Host "   • API Health Check: http://localhost:5000/api/health" -ForegroundColor White
    Write-Host "   • pgAdmin: http://localhost:5050" -ForegroundColor White
    Write-Host "     - Email: admin@esc.tn" -ForegroundColor Gray
    Write-Host "     - Mot de passe: admin123" -ForegroundColor Gray
    Write-Host ""
    Write-Info "📚 Commandes utiles :"
    Write-Host "   • Voir les logs: docker-compose logs -f" -ForegroundColor White
    Write-Host "   • Arrêter les services: docker-compose down" -ForegroundColor White
    Write-Host "   • Statut: docker-compose ps" -ForegroundColor White
    Write-Host ""
    Write-Info "🔐 Comptes par défaut :"
    Write-Host "   • Admin: admin / admin123" -ForegroundColor White
    Write-Host "   • Coach: coach / coach123" -ForegroundColor White
    Write-Host ""
}

function Main {
    try {
        Write-Header

        if (-not $SkipChecks) {
            Test-Requirements
        }

        Initialize-Environment
        Start-DatabaseServices
        Initialize-Database
        Start-AllServices

        # Wait a bit for services to start
        Start-Sleep -Seconds 5

        Show-Status
    }
    catch {
        Write-Error "Erreur détectée: $($_.Exception.Message)"
        Write-Info "Nettoyage..."
        docker-compose down 2>$null
        exit 1
    }
}

# Execute main function
Main
