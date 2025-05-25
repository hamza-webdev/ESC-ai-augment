#!/usr/bin/env python3
"""
ESC Football App - Main application entry point
"""

import os
from app import create_app, db
from app.models import User, Player, Match, PlayerStats, Training, TrainingAttendance, Finance, News

# Create Flask application
app = create_app(os.getenv('FLASK_ENV', 'development'))

# Shell context for Flask CLI
@app.shell_context_processor
def make_shell_context():
    """Make database models available in Flask shell."""
    return {
        'db': db,
        'User': User,
        'Player': Player,
        'Match': Match,
        'PlayerStats': PlayerStats,
        'Training': Training,
        'TrainingAttendance': TrainingAttendance,
        'Finance': Finance,
        'News': News
    }

# CLI commands
@app.cli.command()
def init_db():
    """Initialize the database."""
    db.create_all()
    print("Database initialized successfully!")

@app.cli.command()
def create_admin():
    """Create an admin user."""
    username = input("Enter admin username: ")
    email = input("Enter admin email: ")
    password = input("Enter admin password: ")
    first_name = input("Enter first name: ")
    last_name = input("Enter last name: ")
    
    # Check if user already exists
    if User.query.filter_by(username=username).first():
        print("Username already exists!")
        return
    
    if User.query.filter_by(email=email).first():
        print("Email already exists!")
        return
    
    # Create admin user
    admin = User(
        username=username,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name,
        role='admin'
    )
    
    db.session.add(admin)
    db.session.commit()
    
    print(f"Admin user '{username}' created successfully!")

@app.cli.command()
def seed_data():
    """Seed the database with sample data."""
    from datetime import date, datetime, time
    
    print("Seeding database with sample data...")
    
    # Create sample users
    users_data = [
        {
            'username': 'coach_ahmed',
            'email': 'ahmed.coach@esc.tn',
            'password': 'password123',
            'first_name': 'Ahmed',
            'last_name': 'Ben Ali',
            'role': 'coach'
        },
        {
            'username': 'player_mohamed',
            'email': 'mohamed.player@esc.tn',
            'password': 'password123',
            'first_name': 'Mohamed',
            'last_name': 'Trabelsi',
            'role': 'player'
        },
        {
            'username': 'player_youssef',
            'email': 'youssef.player@esc.tn',
            'password': 'password123',
            'first_name': 'Youssef',
            'last_name': 'Hamdi',
            'role': 'player'
        }
    ]
    
    created_users = []
    for user_data in users_data:
        if not User.query.filter_by(username=user_data['username']).first():
            user = User(**user_data)
            db.session.add(user)
            created_users.append(user)
    
    db.session.commit()
    
    # Create sample players
    player_users = [u for u in created_users if u.role == 'player']
    for i, user in enumerate(player_users):
        if not user.player_profile:
            player = Player(
                user_id=user.id,
                position='ST' if i == 0 else 'CM',
                birth_date=date(1995 + i, 3, 15),
                nationality='Tunisia',
                jersey_number=10 + i,
                height=175.0 + i * 5,
                weight=70.0 + i * 3
            )
            db.session.add(player)
    
    # Create sample match
    if not Match.query.first():
        match = Match(
            opponent='Club Africain',
            date=datetime(2024, 1, 15, 16, 0),
            location='Stade de Chorbane',
            competition='league',
            is_home=True
        )
        db.session.add(match)
    
    # Create sample training
    if not Training.query.first():
        training = Training(
            title='Entraînement Technique',
            date=date.today(),
            start_time=time(17, 0),
            end_time=time(19, 0),
            location='Terrain Principal',
            type='technical',
            objectives='Améliorer la technique de passe et le contrôle de balle'
        )
        db.session.add(training)
    
    # Create sample news
    if not News.query.first():
        news = News(
            title='Bienvenue sur le nouveau site de l\'ESC',
            content='Nous sommes fiers de vous présenter le nouveau site web de l\'Espoir Sportif de Chorbane...',
            author_id=created_users[0].id if created_users else 1,
            category='club_news',
            published=True,
            published_at=datetime.utcnow()
        )
        db.session.add(news)
    
    db.session.commit()
    print("Sample data seeded successfully!")

if __name__ == '__main__':
    # Run the application
    app.run(
        host=os.getenv('FLASK_HOST', '0.0.0.0'),
        port=int(os.getenv('FLASK_PORT', 5000)),
        debug=os.getenv('FLASK_ENV') == 'development'
    )
