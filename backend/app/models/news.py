from datetime import datetime
from app import db

class News(db.Model):
    """News and announcements model."""
    
    __tablename__ = 'news'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    slug = db.Column(db.String(250), nullable=False, unique=True, index=True)
    content = db.Column(db.Text, nullable=False)
    excerpt = db.Column(db.Text, nullable=True)  # Short summary
    
    # Publication details
    published = db.Column(db.Boolean, default=False, nullable=False)
    published_at = db.Column(db.DateTime, nullable=True)
    author_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Content categorization
    category = db.Column(db.Enum(
        'match_report', 'transfer', 'training', 'announcement', 'interview', 
        'injury_update', 'club_news', 'community', 'achievement', 'other',
        name='news_categories'
    ), nullable=False, default='club_news')
    
    # SEO and metadata
    meta_description = db.Column(db.String(160), nullable=True)
    meta_keywords = db.Column(db.String(255), nullable=True)
    
    # Media
    featured_image = db.Column(db.String(255), nullable=True)
    gallery_images = db.Column(db.Text, nullable=True)  # JSON string for multiple images
    video_url = db.Column(db.String(255), nullable=True)
    
    # Engagement
    views_count = db.Column(db.Integer, default=0, nullable=False)
    likes_count = db.Column(db.Integer, default=0, nullable=False)
    comments_enabled = db.Column(db.Boolean, default=True, nullable=False)
    
    # Priority and visibility
    is_featured = db.Column(db.Boolean, default=False, nullable=False)
    is_breaking = db.Column(db.Boolean, default=False, nullable=False)
    priority = db.Column(db.Integer, default=0, nullable=False)  # Higher number = higher priority
    
    # Related content
    related_match_id = db.Column(db.Integer, db.ForeignKey('matches.id'), nullable=True)
    related_player_id = db.Column(db.Integer, db.ForeignKey('players.id'), nullable=True)
    tags = db.Column(db.String(500), nullable=True)  # Comma-separated tags
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    related_match = db.relationship('Match', backref='news_articles')
    related_player = db.relationship('Player', backref='news_mentions')
    
    def __init__(self, title, content, author_id, category='club_news', **kwargs):
        self.title = title
        self.content = content
        self.author_id = author_id
        self.category = category
        self.slug = self.generate_slug(title)
        
        # Set optional fields
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
    
    def generate_slug(self, title):
        """Generate URL-friendly slug from title."""
        import re
        import unicodedata
        
        # Normalize unicode characters
        slug = unicodedata.normalize('NFKD', title)
        slug = slug.encode('ascii', 'ignore').decode('ascii')
        
        # Convert to lowercase and replace spaces/special chars with hyphens
        slug = re.sub(r'[^\w\s-]', '', slug).strip().lower()
        slug = re.sub(r'[-\s]+', '-', slug)
        
        # Ensure uniqueness
        base_slug = slug
        counter = 1
        while News.query.filter_by(slug=slug).first():
            slug = f"{base_slug}-{counter}"
            counter += 1
        
        return slug
    
    @property
    def is_published(self):
        """Check if article is published."""
        return self.published and self.published_at and self.published_at <= datetime.utcnow()
    
    @property
    def reading_time(self):
        """Estimate reading time in minutes."""
        word_count = len(self.content.split())
        return max(1, round(word_count / 200))  # Assuming 200 words per minute
    
    @property
    def tag_list(self):
        """Get tags as a list."""
        if self.tags:
            return [tag.strip() for tag in self.tags.split(',') if tag.strip()]
        return []
    
    def publish(self):
        """Publish the article."""
        self.published = True
        self.published_at = datetime.utcnow()
        db.session.commit()
    
    def unpublish(self):
        """Unpublish the article."""
        self.published = False
        self.published_at = None
        db.session.commit()
    
    def increment_views(self):
        """Increment view count."""
        self.views_count += 1
        db.session.commit()
    
    def add_like(self):
        """Add a like."""
        self.likes_count += 1
        db.session.commit()
    
    def remove_like(self):
        """Remove a like."""
        if self.likes_count > 0:
            self.likes_count -= 1
            db.session.commit()
    
    def set_tags(self, tag_list):
        """Set tags from a list."""
        if tag_list:
            self.tags = ', '.join(tag_list)
        else:
            self.tags = None
        db.session.commit()
    
    @staticmethod
    def get_featured_articles(limit=5):
        """Get featured articles."""
        return News.query.filter_by(
            published=True,
            is_featured=True
        ).filter(
            News.published_at <= datetime.utcnow()
        ).order_by(
            News.priority.desc(),
            News.published_at.desc()
        ).limit(limit).all()
    
    @staticmethod
    def get_breaking_news(limit=3):
        """Get breaking news."""
        return News.query.filter_by(
            published=True,
            is_breaking=True
        ).filter(
            News.published_at <= datetime.utcnow()
        ).order_by(
            News.published_at.desc()
        ).limit(limit).all()
    
    @staticmethod
    def get_recent_articles(limit=10, category=None):
        """Get recent articles."""
        query = News.query.filter_by(published=True).filter(
            News.published_at <= datetime.utcnow()
        )
        
        if category:
            query = query.filter_by(category=category)
        
        return query.order_by(News.published_at.desc()).limit(limit).all()
    
    @staticmethod
    def search_articles(query_text, limit=20):
        """Search articles by title and content."""
        return News.query.filter_by(published=True).filter(
            db.or_(
                News.title.ilike(f'%{query_text}%'),
                News.content.ilike(f'%{query_text}%'),
                News.tags.ilike(f'%{query_text}%')
            )
        ).filter(
            News.published_at <= datetime.utcnow()
        ).order_by(News.published_at.desc()).limit(limit).all()
    
    def to_dict(self, include_content=True):
        """Convert news object to dictionary."""
        data = {
            'id': self.id,
            'title': self.title,
            'slug': self.slug,
            'excerpt': self.excerpt,
            'category': self.category,
            'author_name': self.author.full_name if self.author else None,
            'published': self.published,
            'is_published': self.is_published,
            'published_at': self.published_at.isoformat() if self.published_at else None,
            'featured_image': self.featured_image,
            'video_url': self.video_url,
            'views_count': self.views_count,
            'likes_count': self.likes_count,
            'reading_time': self.reading_time,
            'is_featured': self.is_featured,
            'is_breaking': self.is_breaking,
            'priority': self.priority,
            'tags': self.tag_list,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
        if include_content:
            data['content'] = self.content
        
        # Add related content info
        if self.related_match:
            data['related_match'] = {
                'id': self.related_match.id,
                'opponent': self.related_match.opponent,
                'date': self.related_match.date.isoformat() if self.related_match.date else None
            }
        
        if self.related_player:
            data['related_player'] = {
                'id': self.related_player.id,
                'name': self.related_player.full_name,
                'position': self.related_player.position
            }
        
        return data
    
    def __repr__(self):
        return f'<News {self.title}>'
