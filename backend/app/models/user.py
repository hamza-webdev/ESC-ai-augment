from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from app import db

class User(db.Model):
    """User model for authentication and authorization."""
    
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    role = db.Column(db.Enum('admin', 'coach', 'player', 'staff', 'supporter', name='user_roles'), 
                     nullable=False, default='supporter')
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    avatar = db.Column(db.String(255), nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    last_login = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    player_profile = db.relationship('Player', backref='user_account', uselist=False, cascade='all, delete-orphan')
    authored_news = db.relationship('News', backref='author', lazy='dynamic')
    
    def __init__(self, username, email, password, first_name, last_name, role='supporter'):
        self.username = username
        self.email = email
        self.set_password(password)
        self.first_name = first_name
        self.last_name = last_name
        self.role = role
    
    def set_password(self, password):
        """Hash and set the user's password."""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Check if the provided password matches the user's password."""
        return check_password_hash(self.password_hash, password)
    
    def update_last_login(self):
        """Update the last login timestamp."""
        self.last_login = datetime.utcnow()
        db.session.commit()
    
    @property
    def full_name(self):
        """Return the user's full name."""
        return f"{self.first_name} {self.last_name}"
    
    @property
    def is_admin(self):
        """Check if user is an admin."""
        return self.role == 'admin'
    
    @property
    def is_coach(self):
        """Check if user is a coach."""
        return self.role == 'coach'
    
    @property
    def is_player(self):
        """Check if user is a player."""
        return self.role == 'player'
    
    @property
    def is_staff(self):
        """Check if user is staff."""
        return self.role == 'staff'
    
    def has_permission(self, permission):
        """Check if user has specific permission based on role."""
        permissions = {
            'admin': ['read', 'write', 'delete', 'manage_users', 'manage_finances'],
            'coach': ['read', 'write', 'manage_players', 'manage_trainings'],
            'staff': ['read', 'write'],
            'player': ['read', 'update_profile'],
            'supporter': ['read']
        }
        return permission in permissions.get(self.role, [])
    
    def to_dict(self, include_sensitive=False):
        """Convert user object to dictionary."""
        data = {
            'id': self.id,
            'username': self.username,
            'email': self.email if include_sensitive else None,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'full_name': self.full_name,
            'role': self.role,
            'is_active': self.is_active,
            'avatar': self.avatar,
            'phone': self.phone if include_sensitive else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None
        }
        return data
    
    def __repr__(self):
        return f'<User {self.username}>'
