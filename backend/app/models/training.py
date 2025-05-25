from datetime import datetime, date, time
from app import db

class Training(db.Model):
    """Training session model."""
    
    __tablename__ = 'trainings'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    location = db.Column(db.String(200), nullable=False)
    
    # Training details
    type = db.Column(db.Enum('technical', 'physical', 'tactical', 'recovery', 'friendly', name='training_types'), 
                    nullable=False, default='technical')
    intensity = db.Column(db.Enum('low', 'medium', 'high', name='training_intensity'), 
                         nullable=False, default='medium')
    
    # Training content
    objectives = db.Column(db.Text, nullable=True)
    description = db.Column(db.Text, nullable=True)
    exercises = db.Column(db.Text, nullable=True)  # JSON string for structured exercises
    equipment_needed = db.Column(db.Text, nullable=True)
    
    # Weather and conditions
    weather = db.Column(db.String(50), nullable=True)
    temperature = db.Column(db.Float, nullable=True)
    field_condition = db.Column(db.Enum('excellent', 'good', 'fair', 'poor', name='field_conditions'), 
                               nullable=True)
    
    # Training outcome
    completed = db.Column(db.Boolean, default=False, nullable=False)
    notes = db.Column(db.Text, nullable=True)
    coach_feedback = db.Column(db.Text, nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    attendances = db.relationship('TrainingAttendance', backref='training', lazy='dynamic', cascade='all, delete-orphan')
    
    def __init__(self, title, date, start_time, end_time, location, type='technical', **kwargs):
        self.title = title
        self.date = date
        self.start_time = start_time
        self.end_time = end_time
        self.location = location
        self.type = type
        
        # Set optional fields
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
    
    @property
    def duration_minutes(self):
        """Calculate training duration in minutes."""
        if self.start_time and self.end_time:
            start_datetime = datetime.combine(date.today(), self.start_time)
            end_datetime = datetime.combine(date.today(), self.end_time)
            duration = end_datetime - start_datetime
            return int(duration.total_seconds() / 60)
        return 0
    
    @property
    def is_upcoming(self):
        """Check if training is upcoming."""
        training_datetime = datetime.combine(self.date, self.start_time)
        return training_datetime > datetime.now()
    
    @property
    def is_today(self):
        """Check if training is today."""
        return self.date == date.today()
    
    @property
    def attendance_count(self):
        """Get number of players who attended."""
        return self.attendances.filter(TrainingAttendance.attended == True).count()
    
    @property
    def total_invited(self):
        """Get total number of players invited."""
        return self.attendances.count()
    
    @property
    def attendance_rate(self):
        """Calculate attendance rate percentage."""
        if self.total_invited == 0:
            return 0
        return round((self.attendance_count / self.total_invited) * 100, 1)
    
    def get_attendees(self):
        """Get list of players who attended."""
        return self.attendances.filter(TrainingAttendance.attended == True).all()
    
    def get_absentees(self):
        """Get list of players who were absent."""
        return self.attendances.filter(TrainingAttendance.attended == False).all()
    
    def mark_attendance(self, player_id, attended, excuse=None, notes=None):
        """Mark attendance for a player."""
        attendance = self.attendances.filter_by(player_id=player_id).first()
        if attendance:
            attendance.attended = attended
            attendance.excuse = excuse
            attendance.notes = notes
            attendance.updated_at = datetime.utcnow()
        else:
            attendance = TrainingAttendance(
                training_id=self.id,
                player_id=player_id,
                attended=attended,
                excuse=excuse,
                notes=notes
            )
            db.session.add(attendance)
        
        db.session.commit()
        return attendance
    
    def to_dict(self, include_attendance=False):
        """Convert training object to dictionary."""
        data = {
            'id': self.id,
            'title': self.title,
            'date': self.date.isoformat() if self.date else None,
            'start_time': self.start_time.strftime('%H:%M') if self.start_time else None,
            'end_time': self.end_time.strftime('%H:%M') if self.end_time else None,
            'duration_minutes': self.duration_minutes,
            'location': self.location,
            'type': self.type,
            'intensity': self.intensity,
            'objectives': self.objectives,
            'description': self.description,
            'equipment_needed': self.equipment_needed,
            'weather': self.weather,
            'temperature': self.temperature,
            'field_condition': self.field_condition,
            'completed': self.completed,
            'notes': self.notes,
            'coach_feedback': self.coach_feedback,
            'is_upcoming': self.is_upcoming,
            'is_today': self.is_today,
            'attendance_count': self.attendance_count,
            'total_invited': self.total_invited,
            'attendance_rate': self.attendance_rate,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        
        if include_attendance:
            data['attendees'] = [att.to_dict() for att in self.get_attendees()]
            data['absentees'] = [att.to_dict() for att in self.get_absentees()]
        
        return data
    
    def __repr__(self):
        return f'<Training {self.title} on {self.date}>'


class TrainingAttendance(db.Model):
    """Training attendance tracking."""
    
    __tablename__ = 'training_attendances'
    
    id = db.Column(db.Integer, primary_key=True)
    training_id = db.Column(db.Integer, db.ForeignKey('trainings.id'), nullable=False)
    player_id = db.Column(db.Integer, db.ForeignKey('players.id'), nullable=False)
    
    # Attendance details
    attended = db.Column(db.Boolean, default=False, nullable=False)
    excuse = db.Column(db.String(200), nullable=True)  # Reason for absence
    late_arrival = db.Column(db.Boolean, default=False, nullable=False)
    early_departure = db.Column(db.Boolean, default=False, nullable=False)
    
    # Performance during training
    effort_level = db.Column(db.Enum('poor', 'fair', 'good', 'excellent', name='effort_levels'), nullable=True)
    performance_rating = db.Column(db.Float, nullable=True)  # 1-10 scale
    notes = db.Column(db.Text, nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Unique constraint to prevent duplicate attendance records
    __table_args__ = (db.UniqueConstraint('training_id', 'player_id', name='unique_training_player_attendance'),)
    
    def __init__(self, training_id, player_id, attended=False, **kwargs):
        self.training_id = training_id
        self.player_id = player_id
        self.attended = attended
        
        # Set optional fields
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
    
    @property
    def status(self):
        """Get attendance status as string."""
        if self.attended:
            status = "Present"
            if self.late_arrival:
                status += " (Late)"
            if self.early_departure:
                status += " (Left Early)"
            return status
        else:
            return f"Absent{' - ' + self.excuse if self.excuse else ''}"
    
    def to_dict(self):
        """Convert attendance object to dictionary."""
        return {
            'id': self.id,
            'training_id': self.training_id,
            'player_id': self.player_id,
            'player_name': self.player.full_name if self.player else None,
            'attended': self.attended,
            'status': self.status,
            'excuse': self.excuse,
            'late_arrival': self.late_arrival,
            'early_departure': self.early_departure,
            'effort_level': self.effort_level,
            'performance_rating': self.performance_rating,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def __repr__(self):
        return f'<TrainingAttendance {self.player.full_name if self.player else "Unknown"} - {self.status}>'
