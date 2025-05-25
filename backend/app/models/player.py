from datetime import datetime, date
from sqlalchemy import Numeric
from app import db
from app.models.user import User

class Player(db.Model):
    """Player model for managing football players."""

    __tablename__ = 'players'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)
    jersey_number = db.Column(db.Integer, nullable=True, unique=True)
    position = db.Column(db.Enum('GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'CF', 'ST', name='player_positions'), nullable=False)
    birth_date = db.Column(db.Date, nullable=False)
    nationality = db.Column(db.String(50), nullable=False)
    height = db.Column(db.Float, nullable=True)  # in cm
    weight = db.Column(db.Float, nullable=True)  # in kg
    preferred_foot = db.Column(db.Enum('left', 'right', 'both', name='preferred_foot'), default='right')

    # Contract and status information
    contract_start = db.Column(db.Date, nullable=True)
    contract_end = db.Column(db.Date, nullable=True)
    salary = db.Column(Numeric(10, 2), nullable=True)
    status = db.Column(db.Enum('active', 'injured', 'suspended', 'loaned', 'retired', name='player_status'),
                      default='active', nullable=False)

    # Performance metrics
    market_value = db.Column(Numeric(12, 2), nullable=True)
    rating = db.Column(db.Float, default=0.0)  # Overall rating out of 10

    # Medical information
    blood_type = db.Column(db.String(5), nullable=True)
    medical_notes = db.Column(db.Text, nullable=True)

    # Contact information
    emergency_contact_name = db.Column(db.String(100), nullable=True)
    emergency_contact_phone = db.Column(db.String(20), nullable=True)
    address = db.Column(db.Text, nullable=True)

    # Timestamps
    joined_date = db.Column(db.Date, default=date.today, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    stats = db.relationship('PlayerStats', backref='player', lazy='dynamic', cascade='all, delete-orphan')
    training_attendances = db.relationship('TrainingAttendance', backref='player', lazy='dynamic', cascade='all, delete-orphan')
    user_account = db.relationship('User', backref='player_profile', lazy=True, uselist=False, foreign_keys=[user_id])

    def __init__(self, user_id, position, birth_date, nationality, **kwargs):
        self.user_id = user_id
        self.position = position
        self.birth_date = birth_date
        self.nationality = nationality

        # Set optional fields
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)

    @property
    def age(self):
        """Calculate player's age."""
        today = date.today()
        return today.year - self.birth_date.year - ((today.month, today.day) < (self.birth_date.month, self.birth_date.day))

    @property
    def full_name(self):
        """Get player's full name from user account."""
        return self.user_account.full_name if self.user_account else "Unknown"

    @property
    def is_available(self):
        """Check if player is available for selection."""
        return self.status == 'active'

    @property
    def contract_active(self):
        """Check if player has an active contract."""
        if not self.contract_start or not self.contract_end:
            return False
        today = date.today()
        return self.contract_start <= today <= self.contract_end

    def get_season_stats(self, season_year=None):
        """Get player statistics for a specific season."""
        if season_year is None:
            season_year = datetime.now().year

        # Filter stats by season (assuming season runs from August to July)
        season_start = date(season_year, 8, 1)
        season_end = date(season_year + 1, 7, 31)

        return self.stats.join(PlayerStats.match).filter(
            db.and_(
                Match.date >= season_start,
                Match.date <= season_end
            )
        ).all()

    def calculate_total_stats(self):
        """Calculate total career statistics."""
        total_stats = {
            'matches_played': 0,
            'goals': 0,
            'assists': 0,
            'yellow_cards': 0,
            'red_cards': 0,
            'minutes_played': 0
        }

        for stat in self.stats:
            total_stats['matches_played'] += 1
            total_stats['goals'] += stat.goals
            total_stats['assists'] += stat.assists
            total_stats['yellow_cards'] += stat.yellow_cards
            total_stats['red_cards'] += stat.red_cards
            total_stats['minutes_played'] += stat.minutes_played

        return total_stats

    def update_rating(self):
        """Update player rating based on recent performances."""
        recent_stats = self.stats.order_by(PlayerStats.id.desc()).limit(10).all()
        if not recent_stats:
            return

        # Simple rating calculation based on recent performances
        total_rating = sum(stat.performance_rating for stat in recent_stats if stat.performance_rating)
        if total_rating > 0:
            self.rating = total_rating / len(recent_stats)
            db.session.commit()

    def to_dict(self, include_sensitive=False):
        """Convert player object to dictionary."""
        data = {
            'id': self.id,
            'user_id': self.user_id,
            'full_name': self.full_name,
            'jersey_number': self.jersey_number,
            'position': self.position,
            'age': self.age,
            'birth_date': self.birth_date.isoformat() if self.birth_date else None,
            'nationality': self.nationality,
            'height': float(self.height) if self.height else None,
            'weight': float(self.weight) if self.weight else None,
            'preferred_foot': self.preferred_foot,
            'status': self.status,
            'rating': self.rating,
            'joined_date': self.joined_date.isoformat() if self.joined_date else None,
            'contract_active': self.contract_active,
            'is_available': self.is_available
        }

        if include_sensitive:
            data.update({
                'salary': float(self.salary) if self.salary else None,
                'market_value': float(self.market_value) if self.market_value else None,
                'contract_start': self.contract_start.isoformat() if self.contract_start else None,
                'contract_end': self.contract_end.isoformat() if self.contract_end else None,
                'blood_type': self.blood_type,
                'medical_notes': self.medical_notes,
                'emergency_contact_name': self.emergency_contact_name,
                'emergency_contact_phone': self.emergency_contact_phone,
                'address': self.address
            })

        return data

    def __repr__(self):
        return f'<Player {self.full_name} #{self.jersey_number}>'
