from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, jwt_required
from marshmallow import Schema, fields, ValidationError
from datetime import datetime

from app import db
from app.models.user import User
from app.models.news import News

news_bp = Blueprint('news', __name__)

# Validation schemas
class NewsCreateSchema(Schema):
    title = fields.Str(required=True, validate=lambda x: len(x) >= 5)
    content = fields.Str(required=True, validate=lambda x: len(x) >= 50)
    excerpt = fields.Str(missing=None)
    category = fields.Str(missing='club_news', validate=lambda x: x in [
        'match_report', 'transfer', 'training', 'announcement', 'interview', 
        'injury_update', 'club_news', 'community', 'achievement', 'other'
    ])
    meta_description = fields.Str(missing=None, validate=lambda x: len(x) <= 160 if x else True)
    meta_keywords = fields.Str(missing=None)
    featured_image = fields.Str(missing=None)
    video_url = fields.Str(missing=None)
    is_featured = fields.Bool(missing=False)
    is_breaking = fields.Bool(missing=False)
    priority = fields.Int(missing=0)
    related_match_id = fields.Int(missing=None)
    related_player_id = fields.Int(missing=None)
    tags = fields.Str(missing=None)
    published = fields.Bool(missing=False)

class NewsUpdateSchema(Schema):
    title = fields.Str(missing=None, validate=lambda x: len(x) >= 5 if x else True)
    content = fields.Str(missing=None, validate=lambda x: len(x) >= 50 if x else True)
    excerpt = fields.Str(missing=None)
    category = fields.Str(missing=None, validate=lambda x: x in [
        'match_report', 'transfer', 'training', 'announcement', 'interview', 
        'injury_update', 'club_news', 'community', 'achievement', 'other'
    ] if x else True)
    meta_description = fields.Str(missing=None, validate=lambda x: len(x) <= 160 if x else True)
    meta_keywords = fields.Str(missing=None)
    featured_image = fields.Str(missing=None)
    video_url = fields.Str(missing=None)
    is_featured = fields.Bool(missing=None)
    is_breaking = fields.Bool(missing=None)
    priority = fields.Int(missing=None)
    related_match_id = fields.Int(missing=None)
    related_player_id = fields.Int(missing=None)
    tags = fields.Str(missing=None)

def check_permission(current_user, action, article=None):
    """Check if user has permission to perform action."""
    if action == 'read':
        return True  # Everyone can read published articles
    
    if action in ['create', 'update', 'delete', 'publish']:
        if current_user.is_admin:
            return True
        
        if current_user.is_coach or current_user.is_staff:
            if action == 'create':
                return True
            
            if action in ['update', 'delete'] and article:
                return article.author_id == current_user.id
            
            if action == 'publish':
                return False  # Only admin can publish
        
        return False
    
    return False

@news_bp.route('', methods=['GET'])
def get_news():
    """Get list of news articles (public endpoint)."""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    category_filter = request.args.get('category')
    featured_only = request.args.get('featured', 'false').lower() == 'true'
    breaking_only = request.args.get('breaking', 'false').lower() == 'true'
    search = request.args.get('search')
    
    query = News.query.filter_by(published=True).filter(
        News.published_at <= datetime.utcnow()
    )
    
    if category_filter:
        query = query.filter(News.category == category_filter)
    
    if featured_only:
        query = query.filter(News.is_featured == True)
    
    if breaking_only:
        query = query.filter(News.is_breaking == True)
    
    if search:
        query = query.filter(
            db.or_(
                News.title.ilike(f'%{search}%'),
                News.content.ilike(f'%{search}%'),
                News.tags.ilike(f'%{search}%')
            )
        )
    
    news = query.order_by(
        News.priority.desc(),
        News.published_at.desc()
    ).paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'articles': [article.to_dict(include_content=False) for article in news.items],
        'pagination': {
            'page': page,
            'pages': news.pages,
            'per_page': per_page,
            'total': news.total,
            'has_next': news.has_next,
            'has_prev': news.has_prev
        }
    }), 200

@news_bp.route('/<int:news_id>', methods=['GET'])
def get_news_article(news_id):
    """Get specific news article (public endpoint)."""
    article = News.query.get(news_id)
    if not article:
        return jsonify({'error': 'Article not found'}), 404
    
    # Check if article is published (unless user is authenticated and has permission)
    if not article.is_published:
        # Check if user is authenticated and has permission to view unpublished articles
        try:
            from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
            verify_jwt_in_request(optional=True)
            current_user_id = get_jwt_identity()
            
            if current_user_id:
                current_user = User.query.get(current_user_id)
                if not (current_user and check_permission(current_user, 'update', article)):
                    return jsonify({'error': 'Article not found'}), 404
            else:
                return jsonify({'error': 'Article not found'}), 404
        except:
            return jsonify({'error': 'Article not found'}), 404
    
    # Increment view count for published articles
    if article.is_published:
        article.increment_views()
    
    return jsonify(article.to_dict(include_content=True)), 200

@news_bp.route('/slug/<string:slug>', methods=['GET'])
def get_news_by_slug(slug):
    """Get news article by slug (public endpoint)."""
    article = News.query.filter_by(slug=slug).first()
    if not article or not article.is_published:
        return jsonify({'error': 'Article not found'}), 404
    
    # Increment view count
    article.increment_views()
    
    return jsonify(article.to_dict(include_content=True)), 200

@news_bp.route('', methods=['POST'])
@jwt_required()
def create_news():
    """Create a new news article."""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user or not check_permission(current_user, 'create'):
        return jsonify({'error': 'Permission denied'}), 403
    
    schema = NewsCreateSchema()
    
    try:
        data = schema.load(request.json)
    except ValidationError as err:
        return jsonify({'error': 'Validation failed', 'messages': err.messages}), 400
    
    try:
        # Auto-generate excerpt if not provided
        if not data.get('excerpt') and data.get('content'):
            data['excerpt'] = data['content'][:200] + '...' if len(data['content']) > 200 else data['content']
        
        article = News(author_id=current_user_id, **data)
        
        # Auto-publish if user is admin and published flag is True
        if data.get('published') and current_user.is_admin:
            article.publish()
        
        db.session.add(article)
        db.session.commit()
        
        return jsonify({
            'message': 'Article created successfully',
            'article': article.to_dict(include_content=True)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Article creation failed', 'message': str(e)}), 500

@news_bp.route('/<int:news_id>', methods=['PUT'])
@jwt_required()
def update_news(news_id):
    """Update news article."""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user:
        return jsonify({'error': 'User not found'}), 404
    
    article = News.query.get(news_id)
    if not article:
        return jsonify({'error': 'Article not found'}), 404
    
    if not check_permission(current_user, 'update', article):
        return jsonify({'error': 'Permission denied'}), 403
    
    schema = NewsUpdateSchema()
    
    try:
        data = schema.load(request.json)
    except ValidationError as err:
        return jsonify({'error': 'Validation failed', 'messages': err.messages}), 400
    
    try:
        # Update article fields
        for field, value in data.items():
            if value is not None and hasattr(article, field):
                setattr(article, field, value)
        
        # Update excerpt if content changed
        if data.get('content') and not data.get('excerpt'):
            article.excerpt = data['content'][:200] + '...' if len(data['content']) > 200 else data['content']
        
        # Regenerate slug if title changed
        if data.get('title'):
            article.slug = article.generate_slug(data['title'])
        
        db.session.commit()
        
        return jsonify({
            'message': 'Article updated successfully',
            'article': article.to_dict(include_content=True)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Article update failed', 'message': str(e)}), 500

@news_bp.route('/<int:news_id>', methods=['DELETE'])
@jwt_required()
def delete_news(news_id):
    """Delete news article."""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user:
        return jsonify({'error': 'User not found'}), 404
    
    article = News.query.get(news_id)
    if not article:
        return jsonify({'error': 'Article not found'}), 404
    
    if not check_permission(current_user, 'delete', article):
        return jsonify({'error': 'Permission denied'}), 403
    
    try:
        db.session.delete(article)
        db.session.commit()
        
        return jsonify({'message': 'Article deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Article deletion failed', 'message': str(e)}), 500

@news_bp.route('/<int:news_id>/publish', methods=['POST'])
@jwt_required()
def publish_news(news_id):
    """Publish news article (admin only)."""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user or not current_user.is_admin:
        return jsonify({'error': 'Admin access required'}), 403
    
    article = News.query.get(news_id)
    if not article:
        return jsonify({'error': 'Article not found'}), 404
    
    if article.is_published:
        return jsonify({'error': 'Article is already published'}), 400
    
    try:
        article.publish()
        
        return jsonify({
            'message': 'Article published successfully',
            'article': article.to_dict(include_content=True)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Article publication failed', 'message': str(e)}), 500

@news_bp.route('/<int:news_id>/unpublish', methods=['POST'])
@jwt_required()
def unpublish_news(news_id):
    """Unpublish news article (admin only)."""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user or not current_user.is_admin:
        return jsonify({'error': 'Admin access required'}), 403
    
    article = News.query.get(news_id)
    if not article:
        return jsonify({'error': 'Article not found'}), 404
    
    if not article.is_published:
        return jsonify({'error': 'Article is not published'}), 400
    
    try:
        article.unpublish()
        
        return jsonify({
            'message': 'Article unpublished successfully',
            'article': article.to_dict(include_content=True)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Article unpublication failed', 'message': str(e)}), 500

@news_bp.route('/featured', methods=['GET'])
def get_featured_news():
    """Get featured news articles."""
    limit = request.args.get('limit', 5, type=int)
    articles = News.get_featured_articles(limit)
    
    return jsonify({
        'featured_articles': [article.to_dict(include_content=False) for article in articles]
    }), 200

@news_bp.route('/breaking', methods=['GET'])
def get_breaking_news():
    """Get breaking news."""
    limit = request.args.get('limit', 3, type=int)
    articles = News.get_breaking_news(limit)
    
    return jsonify({
        'breaking_news': [article.to_dict(include_content=False) for article in articles]
    }), 200

@news_bp.route('/recent', methods=['GET'])
def get_recent_news():
    """Get recent news articles."""
    limit = request.args.get('limit', 10, type=int)
    category = request.args.get('category')
    articles = News.get_recent_articles(limit, category)
    
    return jsonify({
        'recent_articles': [article.to_dict(include_content=False) for article in articles]
    }), 200

@news_bp.route('/search', methods=['GET'])
def search_news():
    """Search news articles."""
    query = request.args.get('q', '')
    limit = request.args.get('limit', 20, type=int)
    
    if not query:
        return jsonify({'error': 'Search query is required'}), 400
    
    articles = News.search_articles(query, limit)
    
    return jsonify({
        'search_results': [article.to_dict(include_content=False) for article in articles],
        'query': query,
        'total_results': len(articles)
    }), 200

@news_bp.route('/categories', methods=['GET'])
def get_categories():
    """Get available news categories."""
    categories = {
        'match_report': 'Match Report',
        'transfer': 'Transfer',
        'training': 'Training',
        'announcement': 'Announcement',
        'interview': 'Interview',
        'injury_update': 'Injury Update',
        'club_news': 'Club News',
        'community': 'Community',
        'achievement': 'Achievement',
        'other': 'Other'
    }
    
    return jsonify(categories), 200
