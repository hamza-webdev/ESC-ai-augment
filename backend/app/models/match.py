from datetime import datetime, date
from app import db

class Match(db.Model):
    """Match model for managing football matches."""
    
    __tablename__ = 'matches'
    
    id = db.Column(db.Integer, primary_key=True)
    opponent = db.Column(db.String(100), nullable=False)
    date = db.Column(db.DateTime, nullable=False)
    location = db.Column(db.String(200), nullable=False)
    is_home = db.Column(db.Boolean, default=True, nullable=False)
    competition = db.Column(db.Enum('league', 'cup', 'friendly', 'playoff', name='competition_types'), 
                           nullable=False, default='league')
    
    # Match result
    goals_for = db.Column(db.Integer, nullable=True)
    goals_against = db.Column(db.Integer, nullable=True)
    result = db.Column(db.Enum('win', 'draw', 'loss', 'pending', name='match_results'), 
                      default='pending', nullable=False)
    
    # Match details
    attendance = db.Column(db.Integer, nullable=True)
    referee = db.Column(db.String(100), nullable=True)
    weather = db.Column(db.String(50), nullable=True)
    temperature = db.Column(db.Float, nullable=True)
    
    # Match report
    match_report = db.Column(db.Text, nullable=True)
    highlights = db.Column(db.Text, nullable=True)  # JSON string for video/photo links
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    player_stats = db.relationship('PlayerStats', backref='match', lazy='dynamic', cascade='all, delete-orphan')
    
    def __init__(self, opponent, date, location, competition='league', is_home=True, **kwargs):
        self.opponent = opponent
        self.date = date
        self.location = location
        self.competition = competition
        self.is_home = is_home
        
        # Set optional fields
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
    
    @property
    def is_finished(self):
        """Check if match is finished."""
        return self.result != 'pending'
    
    @property
    def is_upcoming(self):
        """Check if match is upcoming."""
        return self.date > datetime.utcnow() and not self.is_finished
    
    @property
    def score(self):
        """Get match score as string."""
        if self.goals_for is not None and self.goals_against is not None:
            return f"{self.goals_for}-{self.goals_against}"
        return "vs"
    
    @property
    def home_away(self):
        """Get home/away status."""
        return "Home" if self.is_home else "Away"
    
    def set_result(self, goals_for, goals_against):
        """Set match result and determine win/draw/loss."""
        self.goals_for = goals_for
        self.goals_against = goals_against
        
        if goals_for > goals_against:
            self.result = 'win'
        elif goals_for < goals_against:
            self.result = 'loss'
        else:
            self.result = 'draw'
        
        db.session.commit()
    
    def get_team_stats(self):
        """Get aggregated team statistics for this match."""
        stats = {
            'total_goals': sum(stat.goals for stat in self.player_stats),
            'total_assists': sum(stat.assists for stat in self.player_stats),
            'total_yellow_cards': sum(stat.yellow_cards for stat in self.player_stats),
            'total_red_cards': sum(stat.red_cards for stat in self.player_stats),
            'players_used': self.player_stats.count()
        }
        return stats
    
    def get_goalscorers(self):
        """Get list of goalscorers in this match."""
        return self.player_stats.filter(PlayerStats.goals > 0).all()
    
    def to_dict(self, include_stats=False):
        """Convert match object to dictionary."""
        data = {
            'id': self.id,
            'opponent': self.opponent,
            'date': self.date.isoformat() if self.date else None,
            'location': self.location,
            'is_home': self.is_home,
            'home_away': self.home_away,
            'competition': self.competition,
            'goals_for': self.goals_for,
            'goals_against': self.goals_against,
            'score': self.score,
            'result': self.result,
            'is_finished': self.is_finished,
            'is_upcoming': self.is_upcoming,
            'attendance': self.attendance,
            'referee': self.referee,
            'weather': self.weather,
            'temperature': self.temperature,
            'match_report': self.match_report,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        
        if include_stats:
            data['team_stats'] = self.get_team_stats()
            data['goalscorers'] = [stat.to_dict() for stat in self.get_goalscorers()]
        
        return data
    
    def __repr__(self):
        return f'<Match ESC vs {self.opponent} on {self.date.strftime("%Y-%m-%d")}>'


class PlayerStats(db.Model):
    """Player statistics for individual matches."""
    
    __tablename__ = 'player_stats'
    
    id = db.Column(db.Integer, primary_key=True)
    player_id = db.Column(db.Integer, db.ForeignKey('players.id'), nullable=False)
    match_id = db.Column(db.Integer, db.ForeignKey('matches.id'), nullable=False)
    
    # Playing time
    minutes_played = db.Column(db.Integer, default=0, nullable=False)
    started = db.Column(db.Boolean, default=False, nullable=False)
    substituted_in = db.Column(db.Integer, nullable=True)  # Minute substituted in
    substituted_out = db.Column(db.Integer, nullable=True)  # Minute substituted out
    
    # Performance statistics
    goals = db.Column(db.Integer, default=0, nullable=False)
    assists = db.Column(db.Integer, default=0, nullable=False)
    yellow_cards = db.Column(db.Integer, default=0, nullable=False)
    red_cards = db.Column(db.Integer, default=0, nullable=False)
    
    # Detailed statistics (optional)
    shots = db.Column(db.Integer, default=0, nullable=False)
    shots_on_target = db.Column(db.Integer, default=0, nullable=False)
    passes_completed = db.Column(db.Integer, default=0, nullable=False)
    passes_attempted = db.Column(db.Integer, default=0, nullable=False)
    tackles = db.Column(db.Integer, default=0, nullable=False)
    interceptions = db.Column(db.Integer, default=0, nullable=False)
    fouls_committed = db.Column(db.Integer, default=0, nullable=False)
    fouls_suffered = db.Column(db.Integer, default=0, nullable=False)
    
    # Performance rating (1-10)
    performance_rating = db.Column(db.Float, nullable=True)
    
    # Notes
    notes = db.Column(db.Text, nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Unique constraint to prevent duplicate stats for same player in same match
    __table_args__ = (db.UniqueConstraint('player_id', 'match_id', name='unique_player_match_stats'),)
    
    def __init__(self, player_id, match_id, **kwargs):
        self.player_id = player_id
        self.match_id = match_id
        
        # Set optional fields
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
    
    @property
    def pass_accuracy(self):
        """Calculate pass accuracy percentage."""
        if self.passes_attempted == 0:
            return 0
        return round((self.passes_completed / self.passes_attempted) * 100, 1)
    
    @property
    def shot_accuracy(self):
        """Calculate shot accuracy percentage."""
        if self.shots == 0:
            return 0
        return round((self.shots_on_target / self.shots) * 100, 1)
    
    def to_dict(self):
        """Convert player stats object to dictionary."""
        return {
            'id': self.id,
            'player_id': self.player_id,
            'player_name': self.player.full_name if self.player else None,
            'match_id': self.match_id,
            'minutes_played': self.minutes_played,
            'started': self.started,
            'substituted_in': self.substituted_in,
            'substituted_out': self.substituted_out,
            'goals': self.goals,
            'assists': self.assists,
            'yellow_cards': self.yellow_cards,
            'red_cards': self.red_cards,
            'shots': self.shots,
            'shots_on_target': self.shots_on_target,
            'shot_accuracy': self.shot_accuracy,
            'passes_completed': self.passes_completed,
            'passes_attempted': self.passes_attempted,
            'pass_accuracy': self.pass_accuracy,
            'tackles': self.tackles,
            'interceptions': self.interceptions,
            'fouls_committed': self.fouls_committed,
            'fouls_suffered': self.fouls_suffered,
            'performance_rating': self.performance_rating,
            'notes': self.notes
        }
    
    def __repr__(self):
        return f'<PlayerStats {self.player.full_name if self.player else "Unknown"} in Match {self.match_id}>'
