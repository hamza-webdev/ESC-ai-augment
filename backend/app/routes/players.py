from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import Schema, fields, ValidationError
from datetime import date

from app import db
from app.models.user import User
from app.models.player import Player

players_bp = Blueprint('players', __name__)

# Validation schemas
class PlayerCreateSchema(Schema):
    user_id = fields.Int(required=True)
    position = fields.Str(required=True, validate=lambda x: x in [
        'GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'CF', 'ST'
    ])
    birth_date = fields.Date(required=True)
    nationality = fields.Str(required=True)
    jersey_number = fields.Int(missing=None)
    height = fields.Float(missing=None)
    weight = fields.Float(missing=None)
    preferred_foot = fields.Str(missing='right', validate=lambda x: x in ['left', 'right', 'both'])
    contract_start = fields.Date(missing=None)
    contract_end = fields.Date(missing=None)
    salary = fields.Decimal(missing=None)
    market_value = fields.Decimal(missing=None)
    blood_type = fields.Str(missing=None)
    emergency_contact_name = fields.Str(missing=None)
    emergency_contact_phone = fields.Str(missing=None)
    address = fields.Str(missing=None)

class PlayerUpdateSchema(Schema):
    position = fields.Str(missing=None, validate=lambda x: x in [
        'GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'CF', 'ST'
    ] if x else True)
    jersey_number = fields.Int(missing=None)
    height = fields.Float(missing=None)
    weight = fields.Float(missing=None)
    preferred_foot = fields.Str(missing=None, validate=lambda x: x in ['left', 'right', 'both'] if x else True)
    status = fields.Str(missing=None, validate=lambda x: x in [
        'active', 'injured', 'suspended', 'loaned', 'retired'
    ] if x else True)
    contract_start = fields.Date(missing=None)
    contract_end = fields.Date(missing=None)
    salary = fields.Decimal(missing=None)
    market_value = fields.Decimal(missing=None)
    blood_type = fields.Str(missing=None)
    medical_notes = fields.Str(missing=None)
    emergency_contact_name = fields.Str(missing=None)
    emergency_contact_phone = fields.Str(missing=None)
    address = fields.Str(missing=None)

def check_permission(current_user, action, target_player=None):
    """Check if user has permission to perform action."""
    if current_user.is_admin or current_user.is_coach:
        return True
    
    if action == 'read':
        return True  # Everyone can read player info
    
    if action == 'update' and target_player:
        # Players can only update their own profile
        return current_user.is_player and current_user.player_profile and current_user.player_profile.id == target_player.id
    
    return False

@players_bp.route('', methods=['GET'])
@jwt_required()
def get_players():
    """Get list of players."""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user:
        return jsonify({'error': 'User not found'}), 404
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    position_filter = request.args.get('position')
    status_filter = request.args.get('status', 'active')
    search = request.args.get('search')
    
    query = Player.query.join(User)
    
    if position_filter:
        query = query.filter(Player.position == position_filter)
    
    if status_filter:
        query = query.filter(Player.status == status_filter)
    
    if search:
        query = query.filter(
            (User.first_name.ilike(f'%{search}%')) |
            (User.last_name.ilike(f'%{search}%')) |
            (Player.nationality.ilike(f'%{search}%'))
        )
    
    players = query.order_by(Player.jersey_number.asc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    # Include sensitive data only for authorized users
    include_sensitive = current_user.is_admin or current_user.is_coach
    
    return jsonify({
        'players': [player.to_dict(include_sensitive=include_sensitive) for player in players.items],
        'pagination': {
            'page': page,
            'pages': players.pages,
            'per_page': per_page,
            'total': players.total,
            'has_next': players.has_next,
            'has_prev': players.has_prev
        }
    }), 200

@players_bp.route('/<int:player_id>', methods=['GET'])
@jwt_required()
def get_player(player_id):
    """Get specific player details."""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user:
        return jsonify({'error': 'User not found'}), 404
    
    player = Player.query.get(player_id)
    if not player:
        return jsonify({'error': 'Player not found'}), 404
    
    if not check_permission(current_user, 'read', player):
        return jsonify({'error': 'Permission denied'}), 403
    
    include_sensitive = current_user.is_admin or current_user.is_coach or (
        current_user.is_player and current_user.player_profile and current_user.player_profile.id == player.id
    )
    
    player_data = player.to_dict(include_sensitive=include_sensitive)
    
    # Include statistics
    player_data['total_stats'] = player.calculate_total_stats()
    
    return jsonify(player_data), 200

@players_bp.route('', methods=['POST'])
@jwt_required()
def create_player():
    """Create a new player profile."""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user or not (current_user.is_admin or current_user.is_coach):
        return jsonify({'error': 'Admin or coach access required'}), 403
    
    schema = PlayerCreateSchema()
    
    try:
        data = schema.load(request.json)
    except ValidationError as err:
        return jsonify({'error': 'Validation failed', 'messages': err.messages}), 400
    
    # Check if user exists and doesn't already have a player profile
    user = User.query.get(data['user_id'])
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    if user.player_profile:
        return jsonify({'error': 'User already has a player profile'}), 409
    
    # Check jersey number uniqueness
    if data.get('jersey_number'):
        existing_player = Player.query.filter_by(jersey_number=data['jersey_number']).first()
        if existing_player:
            return jsonify({'error': 'Jersey number already taken'}), 409
    
    try:
        player = Player(**data)
        db.session.add(player)
        
        # Update user role to player if not already
        if user.role != 'player':
            user.role = 'player'
        
        db.session.commit()
        
        return jsonify({
            'message': 'Player created successfully',
            'player': player.to_dict(include_sensitive=True)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Player creation failed', 'message': str(e)}), 500

@players_bp.route('/<int:player_id>', methods=['PUT'])
@jwt_required()
def update_player(player_id):
    """Update player information."""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user:
        return jsonify({'error': 'User not found'}), 404
    
    player = Player.query.get(player_id)
    if not player:
        return jsonify({'error': 'Player not found'}), 404
    
    if not check_permission(current_user, 'update', player):
        return jsonify({'error': 'Permission denied'}), 403
    
    schema = PlayerUpdateSchema()
    
    try:
        data = schema.load(request.json)
    except ValidationError as err:
        return jsonify({'error': 'Validation failed', 'messages': err.messages}), 400
    
    # Check jersey number uniqueness if being updated
    if data.get('jersey_number') and data['jersey_number'] != player.jersey_number:
        existing_player = Player.query.filter_by(jersey_number=data['jersey_number']).first()
        if existing_player:
            return jsonify({'error': 'Jersey number already taken'}), 409
    
    try:
        # Update player fields
        for field, value in data.items():
            if value is not None and hasattr(player, field):
                setattr(player, field, value)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Player updated successfully',
            'player': player.to_dict(include_sensitive=True)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Player update failed', 'message': str(e)}), 500

@players_bp.route('/<int:player_id>', methods=['DELETE'])
@jwt_required()
def delete_player(player_id):
    """Delete player profile (admin only)."""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user or not current_user.is_admin:
        return jsonify({'error': 'Admin access required'}), 403
    
    player = Player.query.get(player_id)
    if not player:
        return jsonify({'error': 'Player not found'}), 404
    
    try:
        # Update user role back to supporter
        if player.user_account:
            player.user_account.role = 'supporter'
        
        db.session.delete(player)
        db.session.commit()
        
        return jsonify({'message': 'Player deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Player deletion failed', 'message': str(e)}), 500

@players_bp.route('/<int:player_id>/stats', methods=['GET'])
@jwt_required()
def get_player_stats(player_id):
    """Get player statistics."""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user:
        return jsonify({'error': 'User not found'}), 404
    
    player = Player.query.get(player_id)
    if not player:
        return jsonify({'error': 'Player not found'}), 404
    
    season_year = request.args.get('season', type=int)
    
    # Get season stats
    season_stats = player.get_season_stats(season_year)
    total_stats = player.calculate_total_stats()
    
    return jsonify({
        'player_id': player_id,
        'player_name': player.full_name,
        'season_year': season_year,
        'season_stats': [stat.to_dict() for stat in season_stats],
        'total_stats': total_stats,
        'current_rating': player.rating
    }), 200

@players_bp.route('/positions', methods=['GET'])
@jwt_required()
def get_positions():
    """Get available player positions."""
    positions = {
        'GK': 'Goalkeeper',
        'CB': 'Centre Back',
        'LB': 'Left Back',
        'RB': 'Right Back',
        'CDM': 'Defensive Midfielder',
        'CM': 'Central Midfielder',
        'CAM': 'Attacking Midfielder',
        'LM': 'Left Midfielder',
        'RM': 'Right Midfielder',
        'LW': 'Left Winger',
        'RW': 'Right Winger',
        'CF': 'Centre Forward',
        'ST': 'Striker'
    }
    
    return jsonify(positions), 200
