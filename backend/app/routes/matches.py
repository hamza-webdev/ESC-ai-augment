from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import Schema, fields, ValidationError
from datetime import datetime

from app import db
from app.models.user import User
from app.models.match import Match, PlayerStats

matches_bp = Blueprint('matches', __name__)

# Validation schemas
class MatchCreateSchema(Schema):
    opponent = fields.Str(required=True)
    date = fields.DateTime(required=True)
    location = fields.Str(required=True)
    is_home = fields.Bool(missing=True)
    competition = fields.Str(missing='league', validate=lambda x: x in ['league', 'cup', 'friendly', 'playoff'])
    referee = fields.Str(missing=None)
    weather = fields.Str(missing=None)
    temperature = fields.Float(missing=None)

class MatchUpdateSchema(Schema):
    opponent = fields.Str(missing=None)
    date = fields.DateTime(missing=None)
    location = fields.Str(missing=None)
    is_home = fields.Bool(missing=None)
    competition = fields.Str(missing=None, validate=lambda x: x in ['league', 'cup', 'friendly', 'playoff'] if x else True)
    goals_for = fields.Int(missing=None)
    goals_against = fields.Int(missing=None)
    attendance = fields.Int(missing=None)
    referee = fields.Str(missing=None)
    weather = fields.Str(missing=None)
    temperature = fields.Float(missing=None)
    match_report = fields.Str(missing=None)

class PlayerStatsSchema(Schema):
    player_id = fields.Int(required=True)
    minutes_played = fields.Int(missing=0)
    started = fields.Bool(missing=False)
    substituted_in = fields.Int(missing=None)
    substituted_out = fields.Int(missing=None)
    goals = fields.Int(missing=0)
    assists = fields.Int(missing=0)
    yellow_cards = fields.Int(missing=0)
    red_cards = fields.Int(missing=0)
    shots = fields.Int(missing=0)
    shots_on_target = fields.Int(missing=0)
    passes_completed = fields.Int(missing=0)
    passes_attempted = fields.Int(missing=0)
    tackles = fields.Int(missing=0)
    interceptions = fields.Int(missing=0)
    fouls_committed = fields.Int(missing=0)
    fouls_suffered = fields.Int(missing=0)
    performance_rating = fields.Float(missing=None)
    notes = fields.Str(missing=None)

def check_permission(current_user, action):
    """Check if user has permission to perform action."""
    if action == 'read':
        return True  # Everyone can read match info
    
    if action in ['create', 'update', 'delete']:
        return current_user.is_admin or current_user.is_coach
    
    return False

@matches_bp.route('', methods=['GET'])
@jwt_required()
def get_matches():
    """Get list of matches."""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user:
        return jsonify({'error': 'User not found'}), 404
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    competition_filter = request.args.get('competition')
    status_filter = request.args.get('status')  # upcoming, finished, all
    year = request.args.get('year', type=int)
    
    query = Match.query
    
    if competition_filter:
        query = query.filter(Match.competition == competition_filter)
    
    if year:
        query = query.filter(db.extract('year', Match.date) == year)
    
    if status_filter == 'upcoming':
        query = query.filter(Match.date > datetime.utcnow(), Match.result == 'pending')
    elif status_filter == 'finished':
        query = query.filter(Match.result != 'pending')
    
    matches = query.order_by(Match.date.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    return jsonify({
        'matches': [match.to_dict() for match in matches.items],
        'pagination': {
            'page': page,
            'pages': matches.pages,
            'per_page': per_page,
            'total': matches.total,
            'has_next': matches.has_next,
            'has_prev': matches.has_prev
        }
    }), 200

@matches_bp.route('/<int:match_id>', methods=['GET'])
@jwt_required()
def get_match(match_id):
    """Get specific match details."""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user:
        return jsonify({'error': 'User not found'}), 404
    
    match = Match.query.get(match_id)
    if not match:
        return jsonify({'error': 'Match not found'}), 404
    
    return jsonify(match.to_dict(include_stats=True)), 200

@matches_bp.route('', methods=['POST'])
@jwt_required()
def create_match():
    """Create a new match."""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user or not check_permission(current_user, 'create'):
        return jsonify({'error': 'Admin or coach access required'}), 403
    
    schema = MatchCreateSchema()
    
    try:
        data = schema.load(request.json)
    except ValidationError as err:
        return jsonify({'error': 'Validation failed', 'messages': err.messages}), 400
    
    try:
        match = Match(**data)
        db.session.add(match)
        db.session.commit()
        
        return jsonify({
            'message': 'Match created successfully',
            'match': match.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Match creation failed', 'message': str(e)}), 500

@matches_bp.route('/<int:match_id>', methods=['PUT'])
@jwt_required()
def update_match(match_id):
    """Update match information."""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user or not check_permission(current_user, 'update'):
        return jsonify({'error': 'Admin or coach access required'}), 403
    
    match = Match.query.get(match_id)
    if not match:
        return jsonify({'error': 'Match not found'}), 404
    
    schema = MatchUpdateSchema()
    
    try:
        data = schema.load(request.json)
    except ValidationError as err:
        return jsonify({'error': 'Validation failed', 'messages': err.messages}), 400
    
    try:
        # Update match fields
        for field, value in data.items():
            if value is not None and hasattr(match, field):
                setattr(match, field, value)
        
        # Auto-calculate result if goals are provided
        if data.get('goals_for') is not None and data.get('goals_against') is not None:
            match.set_result(data['goals_for'], data['goals_against'])
        
        db.session.commit()
        
        return jsonify({
            'message': 'Match updated successfully',
            'match': match.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Match update failed', 'message': str(e)}), 500

@matches_bp.route('/<int:match_id>', methods=['DELETE'])
@jwt_required()
def delete_match(match_id):
    """Delete match (admin only)."""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user or not current_user.is_admin:
        return jsonify({'error': 'Admin access required'}), 403
    
    match = Match.query.get(match_id)
    if not match:
        return jsonify({'error': 'Match not found'}), 404
    
    try:
        db.session.delete(match)
        db.session.commit()
        
        return jsonify({'message': 'Match deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Match deletion failed', 'message': str(e)}), 500

@matches_bp.route('/<int:match_id>/stats', methods=['POST'])
@jwt_required()
def add_player_stats(match_id):
    """Add or update player statistics for a match."""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user or not check_permission(current_user, 'update'):
        return jsonify({'error': 'Admin or coach access required'}), 403
    
    match = Match.query.get(match_id)
    if not match:
        return jsonify({'error': 'Match not found'}), 404
    
    schema = PlayerStatsSchema()
    
    try:
        data = schema.load(request.json)
    except ValidationError as err:
        return jsonify({'error': 'Validation failed', 'messages': err.messages}), 400
    
    try:
        # Check if stats already exist for this player in this match
        existing_stats = PlayerStats.query.filter_by(
            player_id=data['player_id'],
            match_id=match_id
        ).first()
        
        if existing_stats:
            # Update existing stats
            for field, value in data.items():
                if hasattr(existing_stats, field):
                    setattr(existing_stats, field, value)
            stats = existing_stats
        else:
            # Create new stats
            stats = PlayerStats(match_id=match_id, **data)
            db.session.add(stats)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Player stats updated successfully',
            'stats': stats.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Stats update failed', 'message': str(e)}), 500

@matches_bp.route('/<int:match_id>/stats', methods=['GET'])
@jwt_required()
def get_match_stats(match_id):
    """Get all player statistics for a match."""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user:
        return jsonify({'error': 'User not found'}), 404
    
    match = Match.query.get(match_id)
    if not match:
        return jsonify({'error': 'Match not found'}), 404
    
    stats = PlayerStats.query.filter_by(match_id=match_id).all()
    
    return jsonify({
        'match_id': match_id,
        'match_info': {
            'opponent': match.opponent,
            'date': match.date.isoformat() if match.date else None,
            'score': match.score,
            'result': match.result
        },
        'player_stats': [stat.to_dict() for stat in stats],
        'team_stats': match.get_team_stats()
    }), 200

@matches_bp.route('/upcoming', methods=['GET'])
@jwt_required()
def get_upcoming_matches():
    """Get upcoming matches."""
    limit = request.args.get('limit', 5, type=int)
    
    matches = Match.query.filter(
        Match.date > datetime.utcnow(),
        Match.result == 'pending'
    ).order_by(Match.date.asc()).limit(limit).all()
    
    return jsonify({
        'upcoming_matches': [match.to_dict() for match in matches]
    }), 200

@matches_bp.route('/results', methods=['GET'])
@jwt_required()
def get_recent_results():
    """Get recent match results."""
    limit = request.args.get('limit', 5, type=int)
    
    matches = Match.query.filter(
        Match.result != 'pending'
    ).order_by(Match.date.desc()).limit(limit).all()
    
    return jsonify({
        'recent_results': [match.to_dict() for match in matches]
    }), 200
