#!/usr/bin/env python3
"""
Test simple pour vérifier que l'application Flask fonctionne
"""

from flask import Flask
import os

# Application Flask simple pour tester
app = Flask(__name__)

@app.route('/')
def index():
    return {
        'message': 'ESC Football App API',
        'version': '1.0.0',
        'club': 'Espoir Sportif de Chorbane',
        'status': 'running',
        'endpoints': {
            'health': '/api/health',
            'info': '/api/info'
        }
    }

@app.route('/api/health')
def health_check():
    return {
        'status': 'healthy', 
        'message': 'ESC Football App API is running'
    }

@app.route('/api/info')
def api_info():
    return {
        'name': 'ESC Football App API',
        'version': '1.0.0',
        'description': 'API pour la gestion de l\'équipe de football ESC',
        'club': 'Espoir Sportif de Chorbane',
        'environment': os.getenv('FLASK_ENV', 'development')
    }

@app.errorhandler(404)
def not_found(error):
    return {'error': 'Resource not found'}, 404

if __name__ == '__main__':
    print("🏈 ESC Football App - Test Backend")
    print("Démarrage du serveur de test...")
    
    app.run(
        host='127.0.0.1',
        port=5000,
        debug=True
    )
