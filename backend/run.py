#!/usr/bin/env python3
"""
Simple runner for the ESC Football App
"""

import os
import sys

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from app import create_app
    
    # Create Flask application
    app = create_app(os.getenv('FLASK_ENV', 'development'))
    
    if __name__ == '__main__':
        # Run the application
        app.run(
            host=os.getenv('FLASK_HOST', '0.0.0.0'),
            port=int(os.getenv('FLASK_PORT', 5000)),
            debug=os.getenv('FLASK_ENV') == 'development'
        )
        
except Exception as e:
    print(f"Error starting application: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
