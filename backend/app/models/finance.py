from datetime import datetime, date
from sqlalchemy import Numeric
from app import db

class Finance(db.Model):
    """Financial transaction model for club finances."""

    __tablename__ = 'finances'

    id = db.Column(db.Integer, primary_key=True)

    # Transaction details
    type = db.Column(db.Enum('income', 'expense', name='transaction_types'), nullable=False)
    category = db.Column(db.Enum(
        # Income categories
        'sponsorship', 'ticket_sales', 'merchandise', 'transfer_fee', 'prize_money', 'donation', 'membership_fee', 'other_income',
        # Expense categories
        'salary', 'equipment', 'travel', 'facility', 'medical', 'training', 'transfer_fee_out', 'utilities', 'insurance', 'other_expense',
        name='finance_categories'
    ), nullable=False)

    amount = db.Column(Numeric(12, 2), nullable=False)
    currency = db.Column(db.String(3), default='TND', nullable=False)  # Tunisian Dinar

    # Description and details
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    reference_number = db.Column(db.String(50), nullable=True, unique=True)

    # Date information
    transaction_date = db.Column(db.Date, nullable=False)
    due_date = db.Column(db.Date, nullable=True)  # For pending transactions

    # Status and approval
    status = db.Column(db.Enum('pending', 'approved', 'rejected', 'completed', name='transaction_status'),
                      default='pending', nullable=False)
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    approval_date = db.Column(db.DateTime, nullable=True)

    # Related entities
    player_id = db.Column(db.Integer, db.ForeignKey('players.id'), nullable=True)  # For salary/transfer fees
    match_id = db.Column(db.Integer, db.ForeignKey('matches.id'), nullable=True)   # For match-related expenses

    # Payment details
    payment_method = db.Column(db.Enum('cash', 'bank_transfer', 'check', 'card', 'other', name='payment_methods'),
                              nullable=True)
    bank_account = db.Column(db.String(50), nullable=True)
    receipt_number = db.Column(db.String(50), nullable=True)

    # Recurring transaction
    is_recurring = db.Column(db.Boolean, default=False, nullable=False)
    recurring_frequency = db.Column(db.Enum('weekly', 'monthly', 'quarterly', 'yearly', name='recurring_frequency'),
                                   nullable=True)
    next_occurrence = db.Column(db.Date, nullable=True)

    # Attachments and notes
    attachments = db.Column(db.Text, nullable=True)  # JSON string for file paths
    notes = db.Column(db.Text, nullable=True)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    # Relationships
    creator = db.relationship('User', foreign_keys=[created_by], backref='created_transactions')
    approver = db.relationship('User', foreign_keys=[approved_by], backref='approved_transactions')
    related_player = db.relationship('Player', backref='financial_transactions')
    related_match = db.relationship('Match', backref='financial_transactions')

    def __init__(self, type, category, amount, title, transaction_date, created_by, **kwargs):
        self.type = type
        self.category = category
        self.amount = amount
        self.title = title
        self.transaction_date = transaction_date
        self.created_by = created_by

        # Set optional fields
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)

    @property
    def is_income(self):
        """Check if transaction is income."""
        return self.type == 'income'

    @property
    def is_expense(self):
        """Check if transaction is expense."""
        return self.type == 'expense'

    @property
    def is_pending(self):
        """Check if transaction is pending approval."""
        return self.status == 'pending'

    @property
    def is_approved(self):
        """Check if transaction is approved."""
        return self.status in ['approved', 'completed']

    @property
    def is_overdue(self):
        """Check if transaction is overdue."""
        return self.due_date and self.due_date < date.today() and self.status == 'pending'

    @property
    def signed_amount(self):
        """Get amount with sign (positive for income, negative for expense)."""
        return self.amount if self.is_income else -self.amount

    def approve(self, approved_by_user_id):
        """Approve the transaction."""
        self.status = 'approved'
        self.approved_by = approved_by_user_id
        self.approval_date = datetime.utcnow()
        db.session.commit()

    def reject(self):
        """Reject the transaction."""
        self.status = 'rejected'
        db.session.commit()

    def complete(self):
        """Mark transaction as completed."""
        if self.status == 'approved':
            self.status = 'completed'
            db.session.commit()

    def generate_next_occurrence(self):
        """Generate next occurrence for recurring transactions."""
        if not self.is_recurring or not self.recurring_frequency:
            return None

        from dateutil.relativedelta import relativedelta

        if self.recurring_frequency == 'weekly':
            self.next_occurrence = self.transaction_date + relativedelta(weeks=1)
        elif self.recurring_frequency == 'monthly':
            self.next_occurrence = self.transaction_date + relativedelta(months=1)
        elif self.recurring_frequency == 'quarterly':
            self.next_occurrence = self.transaction_date + relativedelta(months=3)
        elif self.recurring_frequency == 'yearly':
            self.next_occurrence = self.transaction_date + relativedelta(years=1)

        db.session.commit()
        return self.next_occurrence

    @staticmethod
    def get_monthly_summary(year, month):
        """Get monthly financial summary."""
        start_date = date(year, month, 1)
        if month == 12:
            end_date = date(year + 1, 1, 1)
        else:
            end_date = date(year, month + 1, 1)

        transactions = Finance.query.filter(
            Finance.transaction_date >= start_date,
            Finance.transaction_date < end_date,
            Finance.status.in_(['approved', 'completed'])
        ).all()

        total_income = sum(t.amount for t in transactions if t.is_income)
        total_expense = sum(t.amount for t in transactions if t.is_expense)
        net_amount = total_income - total_expense

        return {
            'total_income': float(total_income),
            'total_expense': float(total_expense),
            'net_amount': float(net_amount),
            'transaction_count': len(transactions)
        }

    @staticmethod
    def get_category_breakdown(year=None, month=None):
        """Get breakdown by category."""
        query = Finance.query.filter(Finance.status.in_(['approved', 'completed']))

        if year:
            if month:
                start_date = date(year, month, 1)
                if month == 12:
                    end_date = date(year + 1, 1, 1)
                else:
                    end_date = date(year, month + 1, 1)
                query = query.filter(
                    Finance.transaction_date >= start_date,
                    Finance.transaction_date < end_date
                )
            else:
                query = query.filter(
                    db.extract('year', Finance.transaction_date) == year
                )

        transactions = query.all()

        income_by_category = {}
        expense_by_category = {}

        for transaction in transactions:
            if transaction.is_income:
                income_by_category[transaction.category] = income_by_category.get(transaction.category, 0) + float(transaction.amount)
            else:
                expense_by_category[transaction.category] = expense_by_category.get(transaction.category, 0) + float(transaction.amount)

        return {
            'income_by_category': income_by_category,
            'expense_by_category': expense_by_category
        }

    def to_dict(self, include_sensitive=False):
        """Convert finance object to dictionary."""
        data = {
            'id': self.id,
            'type': self.type,
            'category': self.category,
            'amount': float(self.amount),
            'signed_amount': float(self.signed_amount),
            'currency': self.currency,
            'title': self.title,
            'description': self.description,
            'transaction_date': self.transaction_date.isoformat() if self.transaction_date else None,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'status': self.status,
            'is_pending': self.is_pending,
            'is_approved': self.is_approved,
            'is_overdue': self.is_overdue,
            'approval_date': self.approval_date.isoformat() if self.approval_date else None,
            'is_recurring': self.is_recurring,
            'recurring_frequency': self.recurring_frequency,
            'next_occurrence': self.next_occurrence.isoformat() if self.next_occurrence else None,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

        if include_sensitive:
            data.update({
                'reference_number': self.reference_number,
                'payment_method': self.payment_method,
                'bank_account': self.bank_account,
                'receipt_number': self.receipt_number,
                'created_by': self.created_by,
                'approved_by': self.approved_by,
                'creator_name': self.creator.full_name if self.creator else None,
                'approver_name': self.approver.full_name if self.approver else None,
                'player_name': self.related_player.full_name if self.related_player else None,
                'match_info': f"vs {self.related_match.opponent}" if self.related_match else None
            })

        return data

    def __repr__(self):
        return f'<Finance {self.type.title()}: {self.title} - {self.amount} {self.currency}>'
