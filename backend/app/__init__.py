from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_mail import Mail
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
cors = CORS()
mail = Mail()

def create_app(config_name='development'):
    app = Flask(__name__)

    # Configuration
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'postgresql://esc_user:esc_password@localhost:5432/esc_db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # JWT Configuration
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', 3600))
    app.config['JWT_REFRESH_TOKEN_EXPIRES'] = int(os.getenv('JWT_REFRESH_TOKEN_EXPIRES', 2592000))

    # Mail Configuration
    app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
    app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
    app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', 'True').lower() == 'true'
    app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
    app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')

    # Upload Configuration
    app.config['UPLOAD_FOLDER'] = os.getenv('UPLOAD_FOLDER', 'uploads')
    app.config['MAX_CONTENT_LENGTH'] = int(os.getenv('MAX_CONTENT_LENGTH', 16777216))

    # CORS Configuration
    cors_origins = os.getenv('CORS_ORIGINS', 'http://localhost:4200').split(',')

    # Initialize extensions with app
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cors.init_app(app, origins=cors_origins)
    mail.init_app(app)

    # Create upload directory
    upload_dir = os.path.join(app.instance_path, app.config['UPLOAD_FOLDER'])
    os.makedirs(upload_dir, exist_ok=True)

    # Configure JWT token blacklist
    from app.routes.auth import check_if_token_revoked
    jwt.token_in_blocklist_loader(check_if_token_revoked)

    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.players import players_bp
    from app.routes.matches import matches_bp
    from app.routes.trainings import trainings_bp
    from app.routes.finances import finances_bp
    from app.routes.news import news_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(players_bp, url_prefix='/api/players')
    app.register_blueprint(matches_bp, url_prefix='/api/matches')
    app.register_blueprint(trainings_bp, url_prefix='/api/trainings')
    app.register_blueprint(finances_bp, url_prefix='/api/finances')
    app.register_blueprint(news_bp, url_prefix='/api/news')

    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return {'error': 'Resource not found'}, 404

    @app.errorhandler(500)
    def internal_error(error):
        return {'error': 'Internal server error'}, 500

    # Root endpoint
    @app.route('/')
    def index():
        return {
            'message': 'ESC Football App API',
            'version': '1.0.0',
            'club': 'Espoir Sportif de Chorbane',
            'status': 'running',
            'endpoints': {
                'health': '/api/health',
                'auth': '/api/auth',
                'players': '/api/players',
                'matches': '/api/matches',
                'trainings': '/api/trainings',
                'finances': '/api/finances',
                'news': '/api/news'
            }
        }

    # Health check endpoint
    @app.route('/api/health')
    def health_check():
        return {'status': 'healthy', 'message': 'ESC Football App API is running'}

    # API info endpoint
    @app.route('/api/info')
    def api_info():
        return {
            'name': 'ESC Football App API',
            'version': '1.0.0',
            'description': 'API pour la gestion de l\'équipe de football ESC',
            'club': 'Espoir Sportif de Chorbane',
            'environment': os.getenv('FLASK_ENV', 'development'),
            'endpoints': {
                'auth': '/api/auth',
                'players': '/api/players',
                'matches': '/api/matches',
                'trainings': '/api/trainings',
                'finances': '/api/finances',
                'news': '/api/news'
            }
        }

    return app
