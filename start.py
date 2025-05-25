#!/usr/bin/env python3
"""
ESC Football App - Quick Start Script
This script helps you quickly set up and run the ESC Football application.
"""

import os
import sys
import subprocess
import time
import requests
from pathlib import Path

def print_banner():
    """Print application banner."""
    print("""
🏈 =============================================== 🏈
    ESC Football App - Quick Start
    Espoir Sportif de Chorbane
🏈 =============================================== 🏈
""")

def check_requirements():
    """Check if required tools are installed."""
    print("🔍 Checking requirements...")
    
    requirements = {
        'python': 'python --version',
        'docker': 'docker --version',
        'docker-compose': 'docker-compose --version'
    }
    
    missing = []
    
    for tool, command in requirements.items():
        try:
            result = subprocess.run(command.split(), capture_output=True, text=True)
            if result.returncode == 0:
                print(f"  ✓ {tool}: {result.stdout.strip()}")
            else:
                missing.append(tool)
        except FileNotFoundError:
            missing.append(tool)
    
    if missing:
        print(f"\n❌ Missing requirements: {', '.join(missing)}")
        print("Please install the missing tools and try again.")
        return False
    
    print("✅ All requirements satisfied!")
    return True

def setup_environment():
    """Set up environment files."""
    print("\n🔧 Setting up environment...")
    
    # Backend environment
    backend_env = Path('backend/.env')
    if not backend_env.exists():
        print("  📝 Creating backend/.env file...")
        subprocess.run(['cp', 'backend/.env.example', 'backend/.env'])
        print("  ✓ Backend environment file created")
    else:
        print("  ✓ Backend environment file already exists")
    
    return True

def start_database():
    """Start database services."""
    print("\n🗄️  Starting database services...")
    
    try:
        # Start only database and redis
        subprocess.run([
            'docker-compose', 'up', '-d', 'db', 'redis'
        ], check=True)
        
        print("  ✓ Database services started")
        
        # Wait for database to be ready
        print("  ⏳ Waiting for database to be ready...")
        max_attempts = 30
        for attempt in range(max_attempts):
            try:
                result = subprocess.run([
                    'docker-compose', 'exec', '-T', 'db', 
                    'pg_isready', '-U', 'esc_user', '-d', 'esc_db'
                ], capture_output=True)
                
                if result.returncode == 0:
                    print("  ✅ Database is ready!")
                    return True
                
                time.sleep(2)
                print(f"    Attempt {attempt + 1}/{max_attempts}...")
                
            except Exception:
                time.sleep(2)
        
        print("  ❌ Database failed to start within timeout")
        return False
        
    except subprocess.CalledProcessError as e:
        print(f"  ❌ Failed to start database: {e}")
        return False

def initialize_database():
    """Initialize database with tables and sample data."""
    print("\n🏗️  Initializing database...")
    
    try:
        # Change to backend directory
        os.chdir('backend')
        
        # Install Python dependencies
        print("  📦 Installing Python dependencies...")
        subprocess.run([sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'], check=True)
        
        # Initialize database
        print("  🗄️  Creating database tables...")
        subprocess.run([sys.executable, 'init_db.py'], check=True)
        
        # Go back to root directory
        os.chdir('..')
        
        print("  ✅ Database initialized successfully!")
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"  ❌ Database initialization failed: {e}")
        os.chdir('..')  # Make sure we're back in root directory
        return False

def start_backend():
    """Start the Flask backend."""
    print("\n🚀 Starting Flask backend...")
    
    try:
        os.chdir('backend')
        
        # Start Flask development server
        print("  🌐 Starting Flask server on http://localhost:5000")
        
        # Use subprocess.Popen to start in background
        process = subprocess.Popen([
            sys.executable, 'app.py'
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        # Wait a moment for server to start
        time.sleep(3)
        
        # Check if server is running
        try:
            response = requests.get('http://localhost:5000/api/health', timeout=5)
            if response.status_code == 200:
                print("  ✅ Backend server is running!")
                os.chdir('..')
                return True, process
        except requests.RequestException:
            pass
        
        print("  ⏳ Backend server is starting...")
        os.chdir('..')
        return True, process
        
    except Exception as e:
        print(f"  ❌ Failed to start backend: {e}")
        os.chdir('..')
        return False, None

def show_info():
    """Show application information."""
    print("""
🎉 ESC Football App is starting up!

📍 Application URLs:
   • Backend API: http://localhost:5000
   • API Health: http://localhost:5000/api/health
   • API Docs: http://localhost:5000/api (coming soon)

🔑 Default Admin Credentials:
   • Username: admin
   • Password: admin123
   • ⚠️  Please change the password after first login!

📊 Database Management:
   • pgAdmin: http://localhost:5050 (if using Docker Compose)
   • Email: admin@esc.tn
   • Password: admin123

🛠️  Development Commands:
   • Stop services: docker-compose down
   • View logs: docker-compose logs -f
   • Restart: docker-compose restart

📚 Next Steps:
   1. Test the API endpoints
   2. Set up the Angular frontend
   3. Customize the application for your needs

Happy coding! 🚀
""")

def main():
    """Main function."""
    print_banner()
    
    # Check requirements
    if not check_requirements():
        sys.exit(1)
    
    # Setup environment
    if not setup_environment():
        sys.exit(1)
    
    # Start database
    if not start_database():
        sys.exit(1)
    
    # Initialize database
    if not initialize_database():
        sys.exit(1)
    
    # Start backend
    success, process = start_backend()
    if not success:
        sys.exit(1)
    
    # Show information
    show_info()
    
    # Keep the script running
    try:
        print("Press Ctrl+C to stop the application...")
        if process:
            process.wait()
    except KeyboardInterrupt:
        print("\n\n🛑 Stopping application...")
        if process:
            process.terminate()
        
        # Stop Docker services
        try:
            subprocess.run(['docker-compose', 'down'], check=True)
            print("✅ Services stopped successfully!")
        except:
            print("⚠️  Please run 'docker-compose down' manually to stop services")

if __name__ == '__main__':
    main()
