from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import Schema, fields, ValidationError
from datetime import date, time, datetime

from app import db
from app.models.user import User
from app.models.training import Training, TrainingAttendance

trainings_bp = Blueprint('trainings', __name__)

# Validation schemas
class TrainingCreateSchema(Schema):
    title = fields.Str(required=True)
    date = fields.Date(required=True)
    start_time = fields.Time(required=True)
    end_time = fields.Time(required=True)
    location = fields.Str(required=True)
    type = fields.Str(missing='technical', validate=lambda x: x in ['technical', 'physical', 'tactical', 'recovery', 'friendly'])
    intensity = fields.Str(missing='medium', validate=lambda x: x in ['low', 'medium', 'high'])
    objectives = fields.Str(missing=None)
    description = fields.Str(missing=None)
    exercises = fields.Str(missing=None)
    equipment_needed = fields.Str(missing=None)

class TrainingUpdateSchema(Schema):
    title = fields.Str(missing=None)
    date = fields.Date(missing=None)
    start_time = fields.Time(missing=None)
    end_time = fields.Time(missing=None)
    location = fields.Str(missing=None)
    type = fields.Str(missing=None, validate=lambda x: x in ['technical', 'physical', 'tactical', 'recovery', 'friendly'] if x else True)
    intensity = fields.Str(missing=None, validate=lambda x: x in ['low', 'medium', 'high'] if x else True)
    objectives = fields.Str(missing=None)
    description = fields.Str(missing=None)
    exercises = fields.Str(missing=None)
    equipment_needed = fields.Str(missing=None)
    weather = fields.Str(missing=None)
    temperature = fields.Float(missing=None)
    field_condition = fields.Str(missing=None, validate=lambda x: x in ['excellent', 'good', 'fair', 'poor'] if x else True)
    completed = fields.Bool(missing=None)
    notes = fields.Str(missing=None)
    coach_feedback = fields.Str(missing=None)

class AttendanceSchema(Schema):
    player_id = fields.Int(required=True)
    attended = fields.Bool(required=True)
    excuse = fields.Str(missing=None)
    late_arrival = fields.Bool(missing=False)
    early_departure = fields.Bool(missing=False)
    effort_level = fields.Str(missing=None, validate=lambda x: x in ['poor', 'fair', 'good', 'excellent'] if x else True)
    performance_rating = fields.Float(missing=None)
    notes = fields.Str(missing=None)

def check_permission(current_user, action):
    """Check if user has permission to perform action."""
    if action == 'read':
        return True  # Everyone can read training info
    
    if action in ['create', 'update', 'delete', 'attendance']:
        return current_user.is_admin or current_user.is_coach
    
    return False

@trainings_bp.route('', methods=['GET'])
@jwt_required()
def get_trainings():
    """Get list of trainings."""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user:
        return jsonify({'error': 'User not found'}), 404
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    type_filter = request.args.get('type')
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')
    upcoming_only = request.args.get('upcoming', 'false').lower() == 'true'
    
    query = Training.query
    
    if type_filter:
        query = query.filter(Training.type == type_filter)
    
    if date_from:
        try:
            from_date = datetime.strptime(date_from, '%Y-%m-%d').date()
            query = query.filter(Training.date >= from_date)
        except ValueError:
            return jsonify({'error': 'Invalid date_from format. Use YYYY-MM-DD'}), 400
    
    if date_to:
        try:
            to_date = datetime.strptime(date_to, '%Y-%m-%d').date()
            query = query.filter(Training.date <= to_date)
        except ValueError:
            return jsonify({'error': 'Invalid date_to format. Use YYYY-MM-DD'}), 400
    
    if upcoming_only:
        query = query.filter(Training.date >= date.today())
    
    trainings = query.order_by(Training.date.desc(), Training.start_time.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    return jsonify({
        'trainings': [training.to_dict() for training in trainings.items],
        'pagination': {
            'page': page,
            'pages': trainings.pages,
            'per_page': per_page,
            'total': trainings.total,
            'has_next': trainings.has_next,
            'has_prev': trainings.has_prev
        }
    }), 200

@trainings_bp.route('/<int:training_id>', methods=['GET'])
@jwt_required()
def get_training(training_id):
    """Get specific training details."""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user:
        return jsonify({'error': 'User not found'}), 404
    
    training = Training.query.get(training_id)
    if not training:
        return jsonify({'error': 'Training not found'}), 404
    
    return jsonify(training.to_dict(include_attendance=True)), 200

@trainings_bp.route('', methods=['POST'])
@jwt_required()
def create_training():
    """Create a new training session."""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user or not check_permission(current_user, 'create'):
        return jsonify({'error': 'Admin or coach access required'}), 403
    
    schema = TrainingCreateSchema()
    
    try:
        data = schema.load(request.json)
    except ValidationError as err:
        return jsonify({'error': 'Validation failed', 'messages': err.messages}), 400
    
    # Validate time logic
    if data['start_time'] >= data['end_time']:
        return jsonify({'error': 'Start time must be before end time'}), 400
    
    try:
        training = Training(**data)
        db.session.add(training)
        db.session.commit()
        
        return jsonify({
            'message': 'Training created successfully',
            'training': training.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Training creation failed', 'message': str(e)}), 500

@trainings_bp.route('/<int:training_id>', methods=['PUT'])
@jwt_required()
def update_training(training_id):
    """Update training information."""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user or not check_permission(current_user, 'update'):
        return jsonify({'error': 'Admin or coach access required'}), 403
    
    training = Training.query.get(training_id)
    if not training:
        return jsonify({'error': 'Training not found'}), 404
    
    schema = TrainingUpdateSchema()
    
    try:
        data = schema.load(request.json)
    except ValidationError as err:
        return jsonify({'error': 'Validation failed', 'messages': err.messages}), 400
    
    # Validate time logic if both times are provided
    start_time = data.get('start_time', training.start_time)
    end_time = data.get('end_time', training.end_time)
    if start_time and end_time and start_time >= end_time:
        return jsonify({'error': 'Start time must be before end time'}), 400
    
    try:
        # Update training fields
        for field, value in data.items():
            if value is not None and hasattr(training, field):
                setattr(training, field, value)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Training updated successfully',
            'training': training.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Training update failed', 'message': str(e)}), 500

@trainings_bp.route('/<int:training_id>', methods=['DELETE'])
@jwt_required()
def delete_training(training_id):
    """Delete training (admin only)."""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user or not current_user.is_admin:
        return jsonify({'error': 'Admin access required'}), 403
    
    training = Training.query.get(training_id)
    if not training:
        return jsonify({'error': 'Training not found'}), 404
    
    try:
        db.session.delete(training)
        db.session.commit()
        
        return jsonify({'message': 'Training deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Training deletion failed', 'message': str(e)}), 500

@trainings_bp.route('/<int:training_id>/attendance', methods=['POST'])
@jwt_required()
def mark_attendance(training_id):
    """Mark attendance for a training session."""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user or not check_permission(current_user, 'attendance'):
        return jsonify({'error': 'Admin or coach access required'}), 403
    
    training = Training.query.get(training_id)
    if not training:
        return jsonify({'error': 'Training not found'}), 404
    
    schema = AttendanceSchema()
    
    try:
        data = schema.load(request.json)
    except ValidationError as err:
        return jsonify({'error': 'Validation failed', 'messages': err.messages}), 400
    
    try:
        attendance = training.mark_attendance(**data)
        
        return jsonify({
            'message': 'Attendance marked successfully',
            'attendance': attendance.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Attendance marking failed', 'message': str(e)}), 500

@trainings_bp.route('/<int:training_id>/attendance', methods=['GET'])
@jwt_required()
def get_training_attendance(training_id):
    """Get attendance for a training session."""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user:
        return jsonify({'error': 'User not found'}), 404
    
    training = Training.query.get(training_id)
    if not training:
        return jsonify({'error': 'Training not found'}), 404
    
    attendances = TrainingAttendance.query.filter_by(training_id=training_id).all()
    
    return jsonify({
        'training_id': training_id,
        'training_info': {
            'title': training.title,
            'date': training.date.isoformat() if training.date else None,
            'start_time': training.start_time.strftime('%H:%M') if training.start_time else None,
            'location': training.location
        },
        'attendance_summary': {
            'total_invited': training.total_invited,
            'attendance_count': training.attendance_count,
            'attendance_rate': training.attendance_rate
        },
        'attendances': [att.to_dict() for att in attendances]
    }), 200

@trainings_bp.route('/upcoming', methods=['GET'])
@jwt_required()
def get_upcoming_trainings():
    """Get upcoming training sessions."""
    limit = request.args.get('limit', 5, type=int)
    
    trainings = Training.query.filter(
        Training.date >= date.today()
    ).order_by(Training.date.asc(), Training.start_time.asc()).limit(limit).all()
    
    return jsonify({
        'upcoming_trainings': [training.to_dict() for training in trainings]
    }), 200

@trainings_bp.route('/today', methods=['GET'])
@jwt_required()
def get_today_trainings():
    """Get today's training sessions."""
    today = date.today()
    
    trainings = Training.query.filter(
        Training.date == today
    ).order_by(Training.start_time.asc()).all()
    
    return jsonify({
        'today_trainings': [training.to_dict(include_attendance=True) for training in trainings]
    }), 200
