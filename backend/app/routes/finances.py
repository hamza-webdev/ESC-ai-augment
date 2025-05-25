from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import Schema, fields, ValidationError
from datetime import date, datetime
from decimal import Decimal

from app import db
from app.models.user import User
from app.models.finance import Finance

finances_bp = Blueprint('finances', __name__)

# Validation schemas
class FinanceCreateSchema(Schema):
    type = fields.Str(required=True, validate=lambda x: x in ['income', 'expense'])
    category = fields.Str(required=True, validate=lambda x: x in [
        # Income categories
        'sponsorship', 'ticket_sales', 'merchandise', 'transfer_fee', 'prize_money', 'donation', 'membership_fee', 'other_income',
        # Expense categories
        'salary', 'equipment', 'travel', 'facility', 'medical', 'training', 'transfer_fee_out', 'utilities', 'insurance', 'other_expense'
    ])
    amount = fields.Decimal(required=True, places=2)
    title = fields.Str(required=True)
    description = fields.Str(missing=None)
    transaction_date = fields.Date(required=True)
    due_date = fields.Date(missing=None)
    player_id = fields.Int(missing=None)
    match_id = fields.Int(missing=None)
    payment_method = fields.Str(missing=None, validate=lambda x: x in ['cash', 'bank_transfer', 'check', 'card', 'other'] if x else True)
    reference_number = fields.Str(missing=None)
    is_recurring = fields.Bool(missing=False)
    recurring_frequency = fields.Str(missing=None, validate=lambda x: x in ['weekly', 'monthly', 'quarterly', 'yearly'] if x else True)
    notes = fields.Str(missing=None)

class FinanceUpdateSchema(Schema):
    type = fields.Str(missing=None, validate=lambda x: x in ['income', 'expense'] if x else True)
    category = fields.Str(missing=None)
    amount = fields.Decimal(missing=None, places=2)
    title = fields.Str(missing=None)
    description = fields.Str(missing=None)
    transaction_date = fields.Date(missing=None)
    due_date = fields.Date(missing=None)
    status = fields.Str(missing=None, validate=lambda x: x in ['pending', 'approved', 'rejected', 'completed'] if x else True)
    payment_method = fields.Str(missing=None, validate=lambda x: x in ['cash', 'bank_transfer', 'check', 'card', 'other'] if x else True)
    reference_number = fields.Str(missing=None)
    receipt_number = fields.Str(missing=None)
    notes = fields.Str(missing=None)

def check_permission(current_user, action):
    """Check if user has permission to perform action."""
    if action == 'read':
        return current_user.is_admin or current_user.is_coach or current_user.is_staff
    
    if action in ['create', 'update']:
        return current_user.is_admin or current_user.is_staff
    
    if action in ['delete', 'approve']:
        return current_user.is_admin
    
    return False

@finances_bp.route('', methods=['GET'])
@jwt_required()
def get_finances():
    """Get list of financial transactions."""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user or not check_permission(current_user, 'read'):
        return jsonify({'error': 'Permission denied'}), 403
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    type_filter = request.args.get('type')
    category_filter = request.args.get('category')
    status_filter = request.args.get('status')
    year = request.args.get('year', type=int)
    month = request.args.get('month', type=int)
    
    query = Finance.query
    
    if type_filter:
        query = query.filter(Finance.type == type_filter)
    
    if category_filter:
        query = query.filter(Finance.category == category_filter)
    
    if status_filter:
        query = query.filter(Finance.status == status_filter)
    
    if year:
        query = query.filter(db.extract('year', Finance.transaction_date) == year)
        
        if month:
            query = query.filter(db.extract('month', Finance.transaction_date) == month)
    
    finances = query.order_by(Finance.transaction_date.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    include_sensitive = current_user.is_admin
    
    return jsonify({
        'transactions': [finance.to_dict(include_sensitive=include_sensitive) for finance in finances.items],
        'pagination': {
            'page': page,
            'pages': finances.pages,
            'per_page': per_page,
            'total': finances.total,
            'has_next': finances.has_next,
            'has_prev': finances.has_prev
        }
    }), 200

@finances_bp.route('/<int:finance_id>', methods=['GET'])
@jwt_required()
def get_finance(finance_id):
    """Get specific financial transaction."""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user or not check_permission(current_user, 'read'):
        return jsonify({'error': 'Permission denied'}), 403
    
    finance = Finance.query.get(finance_id)
    if not finance:
        return jsonify({'error': 'Transaction not found'}), 404
    
    include_sensitive = current_user.is_admin
    
    return jsonify(finance.to_dict(include_sensitive=include_sensitive)), 200

@finances_bp.route('', methods=['POST'])
@jwt_required()
def create_finance():
    """Create a new financial transaction."""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user or not check_permission(current_user, 'create'):
        return jsonify({'error': 'Permission denied'}), 403
    
    schema = FinanceCreateSchema()
    
    try:
        data = schema.load(request.json)
    except ValidationError as err:
        return jsonify({'error': 'Validation failed', 'messages': err.messages}), 400
    
    # Validate category matches type
    income_categories = ['sponsorship', 'ticket_sales', 'merchandise', 'transfer_fee', 'prize_money', 'donation', 'membership_fee', 'other_income']
    expense_categories = ['salary', 'equipment', 'travel', 'facility', 'medical', 'training', 'transfer_fee_out', 'utilities', 'insurance', 'other_expense']
    
    if data['type'] == 'income' and data['category'] not in income_categories:
        return jsonify({'error': 'Invalid category for income transaction'}), 400
    
    if data['type'] == 'expense' and data['category'] not in expense_categories:
        return jsonify({'error': 'Invalid category for expense transaction'}), 400
    
    try:
        finance = Finance(created_by=current_user_id, **data)
        
        # Generate next occurrence for recurring transactions
        if data.get('is_recurring') and data.get('recurring_frequency'):
            finance.generate_next_occurrence()
        
        db.session.add(finance)
        db.session.commit()
        
        return jsonify({
            'message': 'Transaction created successfully',
            'transaction': finance.to_dict(include_sensitive=True)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Transaction creation failed', 'message': str(e)}), 500

@finances_bp.route('/<int:finance_id>', methods=['PUT'])
@jwt_required()
def update_finance(finance_id):
    """Update financial transaction."""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user or not check_permission(current_user, 'update'):
        return jsonify({'error': 'Permission denied'}), 403
    
    finance = Finance.query.get(finance_id)
    if not finance:
        return jsonify({'error': 'Transaction not found'}), 404
    
    # Only allow updates to pending transactions or by admin
    if finance.status != 'pending' and not current_user.is_admin:
        return jsonify({'error': 'Cannot update approved/completed transactions'}), 403
    
    schema = FinanceUpdateSchema()
    
    try:
        data = schema.load(request.json)
    except ValidationError as err:
        return jsonify({'error': 'Validation failed', 'messages': err.messages}), 400
    
    try:
        # Update finance fields
        for field, value in data.items():
            if value is not None and hasattr(finance, field):
                setattr(finance, field, value)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Transaction updated successfully',
            'transaction': finance.to_dict(include_sensitive=True)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Transaction update failed', 'message': str(e)}), 500

@finances_bp.route('/<int:finance_id>', methods=['DELETE'])
@jwt_required()
def delete_finance(finance_id):
    """Delete financial transaction (admin only)."""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user or not check_permission(current_user, 'delete'):
        return jsonify({'error': 'Admin access required'}), 403
    
    finance = Finance.query.get(finance_id)
    if not finance:
        return jsonify({'error': 'Transaction not found'}), 404
    
    try:
        db.session.delete(finance)
        db.session.commit()
        
        return jsonify({'message': 'Transaction deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Transaction deletion failed', 'message': str(e)}), 500

@finances_bp.route('/<int:finance_id>/approve', methods=['POST'])
@jwt_required()
def approve_finance(finance_id):
    """Approve financial transaction (admin only)."""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user or not check_permission(current_user, 'approve'):
        return jsonify({'error': 'Admin access required'}), 403
    
    finance = Finance.query.get(finance_id)
    if not finance:
        return jsonify({'error': 'Transaction not found'}), 404
    
    if finance.status != 'pending':
        return jsonify({'error': 'Transaction is not pending approval'}), 400
    
    try:
        finance.approve(current_user_id)
        
        return jsonify({
            'message': 'Transaction approved successfully',
            'transaction': finance.to_dict(include_sensitive=True)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Transaction approval failed', 'message': str(e)}), 500

@finances_bp.route('/<int:finance_id>/reject', methods=['POST'])
@jwt_required()
def reject_finance(finance_id):
    """Reject financial transaction (admin only)."""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user or not check_permission(current_user, 'approve'):
        return jsonify({'error': 'Admin access required'}), 403
    
    finance = Finance.query.get(finance_id)
    if not finance:
        return jsonify({'error': 'Transaction not found'}), 404
    
    if finance.status != 'pending':
        return jsonify({'error': 'Transaction is not pending approval'}), 400
    
    try:
        finance.reject()
        
        return jsonify({
            'message': 'Transaction rejected successfully',
            'transaction': finance.to_dict(include_sensitive=True)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Transaction rejection failed', 'message': str(e)}), 500

@finances_bp.route('/summary', methods=['GET'])
@jwt_required()
def get_financial_summary():
    """Get financial summary."""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user or not check_permission(current_user, 'read'):
        return jsonify({'error': 'Permission denied'}), 403
    
    year = request.args.get('year', datetime.now().year, type=int)
    month = request.args.get('month', type=int)
    
    if month:
        summary = Finance.get_monthly_summary(year, month)
        breakdown = Finance.get_category_breakdown(year, month)
        period = f"{year}-{month:02d}"
    else:
        # Get yearly summary
        summary = {'total_income': 0, 'total_expense': 0, 'net_amount': 0, 'transaction_count': 0}
        for m in range(1, 13):
            monthly = Finance.get_monthly_summary(year, m)
            summary['total_income'] += monthly['total_income']
            summary['total_expense'] += monthly['total_expense']
            summary['transaction_count'] += monthly['transaction_count']
        
        summary['net_amount'] = summary['total_income'] - summary['total_expense']
        breakdown = Finance.get_category_breakdown(year)
        period = str(year)
    
    return jsonify({
        'period': period,
        'summary': summary,
        'breakdown': breakdown
    }), 200

@finances_bp.route('/categories', methods=['GET'])
@jwt_required()
def get_categories():
    """Get available finance categories."""
    categories = {
        'income': {
            'sponsorship': 'Sponsorship',
            'ticket_sales': 'Ticket Sales',
            'merchandise': 'Merchandise',
            'transfer_fee': 'Transfer Fee (Incoming)',
            'prize_money': 'Prize Money',
            'donation': 'Donation',
            'membership_fee': 'Membership Fee',
            'other_income': 'Other Income'
        },
        'expense': {
            'salary': 'Salary',
            'equipment': 'Equipment',
            'travel': 'Travel',
            'facility': 'Facility',
            'medical': 'Medical',
            'training': 'Training',
            'transfer_fee_out': 'Transfer Fee (Outgoing)',
            'utilities': 'Utilities',
            'insurance': 'Insurance',
            'other_expense': 'Other Expense'
        }
    }
    
    return jsonify(categories), 200
