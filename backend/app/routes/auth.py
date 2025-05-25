from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, create_refresh_token, jwt_required, 
    get_jwt_identity, get_jwt
)
from marshmallow import Schema, fields, ValidationError
from datetime import datetime, timedelta
import re

from app import db
from app.models.user import User
from app.models.player import Player

auth_bp = Blueprint('auth', __name__)

# Validation schemas
class RegisterSchema(Schema):
    username = fields.Str(required=True, validate=lambda x: len(x) >= 3)
    email = fields.Email(required=True)
    password = fields.Str(required=True, validate=lambda x: len(x) >= 6)
    first_name = fields.Str(required=True, validate=lambda x: len(x) >= 2)
    last_name = fields.Str(required=True, validate=lambda x: len(x) >= 2)
    role = fields.Str(missing='supporter', validate=lambda x: x in ['admin', 'coach', 'player', 'staff', 'supporter'])
    phone = fields.Str(missing=None)

class LoginSchema(Schema):
    username = fields.Str(required=True)
    password = fields.Str(required=True)

class ChangePasswordSchema(Schema):
    current_password = fields.Str(required=True)
    new_password = fields.Str(required=True, validate=lambda x: len(x) >= 6)

class UpdateProfileSchema(Schema):
    first_name = fields.Str(missing=None, validate=lambda x: len(x) >= 2 if x else True)
    last_name = fields.Str(missing=None, validate=lambda x: len(x) >= 2 if x else True)
    email = fields.Email(missing=None)
    phone = fields.Str(missing=None)

# JWT blacklist (in production, use Redis or database)
blacklisted_tokens = set()

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user."""
    schema = RegisterSchema()
    
    try:
        data = schema.load(request.json)
    except ValidationError as err:
        return jsonify({'error': 'Validation failed', 'messages': err.messages}), 400
    
    # Check if username already exists
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 409
    
    # Check if email already exists
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 409
    
    # Validate password strength
    if not is_strong_password(data['password']):
        return jsonify({
            'error': 'Password must contain at least 8 characters, including uppercase, lowercase, and numbers'
        }), 400
    
    try:
        # Create new user
        user = User(
            username=data['username'],
            email=data['email'],
            password=data['password'],
            first_name=data['first_name'],
            last_name=data['last_name'],
            role=data['role'],
            phone=data.get('phone')
        )
        
        db.session.add(user)
        db.session.commit()
        
        # Create access and refresh tokens
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)
        
        return jsonify({
            'message': 'User registered successfully',
            'user': user.to_dict(),
            'access_token': access_token,
            'refresh_token': refresh_token
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Registration failed', 'message': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Authenticate user and return tokens."""
    schema = LoginSchema()
    
    try:
        data = schema.load(request.json)
    except ValidationError as err:
        return jsonify({'error': 'Validation failed', 'messages': err.messages}), 400
    
    # Find user by username or email
    user = User.query.filter(
        (User.username == data['username']) | (User.email == data['username'])
    ).first()
    
    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    if not user.is_active:
        return jsonify({'error': 'Account is deactivated'}), 401
    
    # Update last login
    user.update_last_login()
    
    # Create tokens
    access_token = create_access_token(identity=user.id)
    refresh_token = create_refresh_token(identity=user.id)
    
    return jsonify({
        'message': 'Login successful',
        'user': user.to_dict(include_sensitive=True),
        'access_token': access_token,
        'refresh_token': refresh_token
    }), 200

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token."""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.is_active:
        return jsonify({'error': 'User not found or inactive'}), 404
    
    new_access_token = create_access_token(identity=current_user_id)
    
    return jsonify({
        'access_token': new_access_token
    }), 200

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout user and blacklist token."""
    jti = get_jwt()['jti']
    blacklisted_tokens.add(jti)
    
    return jsonify({'message': 'Successfully logged out'}), 200

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get current user profile."""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    profile_data = user.to_dict(include_sensitive=True)
    
    # Include player profile if user is a player
    if user.is_player and user.player_profile:
        profile_data['player_profile'] = user.player_profile.to_dict(include_sensitive=True)
    
    return jsonify(profile_data), 200

@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update current user profile."""
    schema = UpdateProfileSchema()
    
    try:
        data = schema.load(request.json)
    except ValidationError as err:
        return jsonify({'error': 'Validation failed', 'messages': err.messages}), 400
    
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Check if email is being changed and if it's already taken
    if data.get('email') and data['email'] != user.email:
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already exists'}), 409
    
    try:
        # Update user fields
        for field, value in data.items():
            if value is not None and hasattr(user, field):
                setattr(user, field, value)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Profile updated successfully',
            'user': user.to_dict(include_sensitive=True)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Update failed', 'message': str(e)}), 500

@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Change user password."""
    schema = ChangePasswordSchema()
    
    try:
        data = schema.load(request.json)
    except ValidationError as err:
        return jsonify({'error': 'Validation failed', 'messages': err.messages}), 400
    
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Verify current password
    if not user.check_password(data['current_password']):
        return jsonify({'error': 'Current password is incorrect'}), 400
    
    # Validate new password strength
    if not is_strong_password(data['new_password']):
        return jsonify({
            'error': 'New password must contain at least 8 characters, including uppercase, lowercase, and numbers'
        }), 400
    
    try:
        user.set_password(data['new_password'])
        db.session.commit()
        
        return jsonify({'message': 'Password changed successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Password change failed', 'message': str(e)}), 500

@auth_bp.route('/users', methods=['GET'])
@jwt_required()
def get_users():
    """Get list of users (admin only)."""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user or not current_user.is_admin:
        return jsonify({'error': 'Admin access required'}), 403
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    role_filter = request.args.get('role')
    search = request.args.get('search')
    
    query = User.query
    
    if role_filter:
        query = query.filter_by(role=role_filter)
    
    if search:
        query = query.filter(
            (User.username.ilike(f'%{search}%')) |
            (User.first_name.ilike(f'%{search}%')) |
            (User.last_name.ilike(f'%{search}%')) |
            (User.email.ilike(f'%{search}%'))
        )
    
    users = query.order_by(User.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    return jsonify({
        'users': [user.to_dict() for user in users.items],
        'pagination': {
            'page': page,
            'pages': users.pages,
            'per_page': per_page,
            'total': users.total,
            'has_next': users.has_next,
            'has_prev': users.has_prev
        }
    }), 200

def is_strong_password(password):
    """Check if password meets strength requirements."""
    if len(password) < 8:
        return False
    
    # Check for uppercase, lowercase, and numbers
    has_upper = re.search(r'[A-Z]', password)
    has_lower = re.search(r'[a-z]', password)
    has_digit = re.search(r'\d', password)
    
    return bool(has_upper and has_lower and has_digit)

# JWT token blacklist checker
@auth_bp.before_app_request
def check_if_token_revoked():
    """Check if JWT token is blacklisted."""
    try:
        jti = get_jwt()['jti']
        return jti in blacklisted_tokens
    except:
        return False
