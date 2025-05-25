#!/usr/bin/env python3
"""
Database initialization script for ESC Football App
"""

import os
import sys
from datetime import date, datetime, time

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models import User, Player, Match, PlayerStats, Training, TrainingAttendance, Finance, News

def create_database():
    """Create all database tables."""
    print("Creating database tables...")
    db.create_all()
    print("✓ Database tables created successfully!")

def create_admin_user():
    """Create default admin user."""
    print("\nCreating admin user...")
    
    # Check if admin already exists
    admin = User.query.filter_by(username='admin').first()
    if admin:
        print("✓ Admin user already exists!")
        return admin
    
    # Create admin user
    admin = User(
        username='admin',
        email='admin@esc.tn',
        password='admin123',  # Change this in production!
        first_name='Admin',
        last_name='ESC',
        role='admin'
    )
    
    db.session.add(admin)
    db.session.commit()
    
    print("✓ Admin user created successfully!")
    print("  Username: admin")
    print("  Password: admin123")
    print("  ⚠️  Please change the password after first login!")
    
    return admin

def create_sample_data():
    """Create sample data for development."""
    print("\nCreating sample data...")
    
    # Create sample users
    users_data = [
        {
            'username': 'coach_ahmed',
            'email': 'ahmed.coach@esc.tn',
            'password': 'password123',
            'first_name': 'Ahmed',
            'last_name': 'Ben Ali',
            'role': 'coach',
            'phone': '+216 20 123 456'
        },
        {
            'username': 'player_mohamed',
            'email': 'mohamed.player@esc.tn',
            'password': 'password123',
            'first_name': 'Mohamed',
            'last_name': 'Trabelsi',
            'role': 'player',
            'phone': '+216 25 789 012'
        },
        {
            'username': 'player_youssef',
            'email': 'youssef.player@esc.tn',
            'password': 'password123',
            'first_name': 'Youssef',
            'last_name': 'Hamdi',
            'role': 'player',
            'phone': '+216 22 345 678'
        },
        {
            'username': 'player_karim',
            'email': 'karim.player@esc.tn',
            'password': 'password123',
            'first_name': 'Karim',
            'last_name': 'Sassi',
            'role': 'player',
            'phone': '+216 24 567 890'
        },
        {
            'username': 'staff_fatma',
            'email': 'fatma.staff@esc.tn',
            'password': 'password123',
            'first_name': 'Fatma',
            'last_name': 'Bouaziz',
            'role': 'staff',
            'phone': '+216 21 234 567'
        }
    ]
    
    created_users = []
    for user_data in users_data:
        if not User.query.filter_by(username=user_data['username']).first():
            user = User(**user_data)
            db.session.add(user)
            created_users.append(user)
    
    db.session.commit()
    print(f"✓ Created {len(created_users)} sample users")
    
    # Create sample players
    player_users = [u for u in created_users if u.role == 'player']
    players_data = [
        {
            'position': 'ST',
            'birth_date': date(1995, 3, 15),
            'nationality': 'Tunisia',
            'jersey_number': 10,
            'height': 178.0,
            'weight': 75.0,
            'preferred_foot': 'right'
        },
        {
            'position': 'CM',
            'birth_date': date(1996, 7, 22),
            'nationality': 'Tunisia',
            'jersey_number': 8,
            'height': 175.0,
            'weight': 72.0,
            'preferred_foot': 'left'
        },
        {
            'position': 'CB',
            'birth_date': date(1994, 11, 8),
            'nationality': 'Tunisia',
            'jersey_number': 4,
            'height': 185.0,
            'weight': 80.0,
            'preferred_foot': 'right'
        }
    ]
    
    created_players = 0
    for i, user in enumerate(player_users):
        if not user.player_profile and i < len(players_data):
            player_data = players_data[i]
            player_data['user_id'] = user.id
            player = Player(**player_data)
            db.session.add(player)
            created_players += 1
    
    db.session.commit()
    print(f"✓ Created {created_players} sample players")
    
    # Create sample matches
    if not Match.query.first():
        matches_data = [
            {
                'opponent': 'Club Africain',
                'date': datetime(2024, 1, 15, 16, 0),
                'location': 'Stade de Chorbane',
                'competition': 'league',
                'is_home': True,
                'goals_for': 2,
                'goals_against': 1,
                'result': 'win'
            },
            {
                'opponent': 'Espérance de Tunis',
                'date': datetime(2024, 1, 22, 15, 0),
                'location': 'Stade Olympique de Radès',
                'competition': 'league',
                'is_home': False,
                'goals_for': 0,
                'goals_against': 3,
                'result': 'loss'
            },
            {
                'opponent': 'CS Sfaxien',
                'date': datetime(2024, 2, 5, 16, 30),
                'location': 'Stade de Chorbane',
                'competition': 'cup',
                'is_home': True
            }
        ]
        
        for match_data in matches_data:
            match = Match(**match_data)
            db.session.add(match)
        
        db.session.commit()
        print(f"✓ Created {len(matches_data)} sample matches")
    
    # Create sample training
    if not Training.query.first():
        training = Training(
            title='Entraînement Technique',
            date=date.today(),
            start_time=time(17, 0),
            end_time=time(19, 0),
            location='Terrain Principal ESC',
            type='technical',
            intensity='medium',
            objectives='Améliorer la technique de passe et le contrôle de balle',
            description='Séance axée sur les passes courtes et moyennes, contrôle orienté'
        )
        db.session.add(training)
        db.session.commit()
        print("✓ Created sample training session")
    
    # Create sample news
    if not News.query.first():
        coach_user = User.query.filter_by(role='coach').first()
        author_id = coach_user.id if coach_user else 1
        
        news_articles = [
            {
                'title': 'Bienvenue sur le nouveau site de l\'ESC',
                'content': '''Nous sommes fiers de vous présenter le nouveau site web de l'Espoir Sportif de Chorbane. 
                
Cette plateforme moderne vous permettra de suivre toute l'actualité de votre club préféré, les résultats des matchs, les statistiques des joueurs et bien plus encore.

Le site propose de nombreuses fonctionnalités :
- Suivi en temps réel des matchs
- Statistiques détaillées des joueurs
- Calendrier des entraînements
- Galerie photos et vidéos
- Boutique en ligne

Nous espérons que cette nouvelle plateforme renforcera les liens entre le club et ses supporters.

Allez l'ESC !''',
                'category': 'club_news',
                'published': True,
                'published_at': datetime.utcnow(),
                'is_featured': True
            },
            {
                'title': 'Victoire importante contre le Club Africain',
                'content': '''L'Espoir Sportif de Chorbane a remporté une victoire importante face au Club Africain sur le score de 2-1.

Les buts ont été marqués par Mohamed Trabelsi (25') et Youssef Hamdi (67'). Le Club Africain avait égalisé temporairement à la 45'.

Cette victoire permet à l'ESC de remonter au classement et de se rapprocher des places qualificatives pour les compétitions continentales.

Le prochain match aura lieu dimanche prochain à domicile contre l'Étoile du Sahel.''',
                'category': 'match_report',
                'published': True,
                'published_at': datetime.utcnow(),
                'related_match_id': 1
            }
        ]
        
        for article_data in news_articles:
            article_data['author_id'] = author_id
            article = News(**article_data)
            db.session.add(article)
        
        db.session.commit()
        print(f"✓ Created {len(news_articles)} sample news articles")
    
    print("✓ Sample data creation completed!")

def main():
    """Main initialization function."""
    print("🏈 ESC Football App - Database Initialization")
    print("=" * 50)
    
    # Create Flask app
    app = create_app('development')
    
    with app.app_context():
        try:
            # Create database tables
            create_database()
            
            # Create admin user
            create_admin_user()
            
            # Ask if user wants sample data
            create_sample = input("\nDo you want to create sample data? (y/N): ").lower().strip()
            if create_sample in ['y', 'yes']:
                create_sample_data()
            
            print("\n" + "=" * 50)
            print("🎉 Database initialization completed successfully!")
            print("\nYou can now start the application with:")
            print("  python app.py")
            print("\nOr using Flask CLI:")
            print("  flask run")
            
        except Exception as e:
            print(f"\n❌ Error during initialization: {str(e)}")
            sys.exit(1)

if __name__ == '__main__':
    main()
