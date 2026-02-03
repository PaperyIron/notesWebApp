import re
from sqlalchemy import DateTime, UniqueConstraint, func
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import relationship, validates
from config import db, bcrypt


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(30), unique=True, nullable=False)
    email = db.Column(db.String, unique=True, nullable=False)
    _password_hash = db.Column(db.String(100), nullable=False)

    folders = relationship('Folder', back_populates='user', cascade='all, delete-orphan')
    notes = relationship('Note', back_populates='user', cascade='all, delete-orphan')
    tags = relationship('Tag', back_populates='user', cascade='all, delete-orphan')

    @validates('username')
    def validate_username(self, key, value):
        if not value or not value.strip():
            raise ValueError('Username is required')
        
        value = value.strip()

        if len(value) < 3:
            raise ValueError('Username must be at least 3 characters')
        if len(value) > 30:
            raise ValueError('Username cannot be more than 30 characters')
        if not re.match(r'^[a-zA-Z0-9_]+$', value):
            raise ValueError('Username can only contain letters, numbers, and underscores')
        
        return value
    
    @validates('email')
    def validate_email(self, key, value):
        if not value or not value.strip():
            raise ValueError('Email is required')
        
        value = value.strip().lower()

        if not re.match(r'^[@\s]+@[^@\s]+\.[^@\s]+$', value):
            raise ValueError('Must be a valid email address')
        
        return value

    @hybrid_property
    def password_hash(self):
        raise AttributeError('Password hashes cannot be viewed')
    
    @password_hash.setter
    def password_hash(self, password):
        if len(password) < 8:
            raise ValueError('Password must be at least 8 characters long')
        self._password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    def authenticate(self, password):
        return bcrypt.check_password_hash(self._password_hash, password)
    
    def to_dict(self):
        user_dict = {
            'id': self.id,
            'username': self.username
        }
        return user_dict
    
    def __repr__(self):
        return f'<User: {self.username}>'
    
class Folder(db.Model):
    __tablename__ = 'folders'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(25), nullable=False)
    color = db.Column(db.String(7), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, server_default=func.now(), nullable=False)

    user = relationship('User', back_populates='folders')
    notes = relationship('Note', back_populates='folder')

    @validates('name')
    def validate_name(self, key, value):
        if not value or not value.strip():
            raise ValueError('Folder name is required')
        
        value = value.strip()

        if len(value) > 25:
            raise ValueError('Folder name must be 25 characters or fewer')
        
        return value
    
    @validates('color')
    def validate_color(self, key, value):
        if not re.match(r'^#[0-9a-fA-F]{6}$', value):
            raise ValueError('Color must be a valid hex color code (e.g. #FF5733)')
        
        return value.lower()

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'color': self.color,
            'user_id': self.user_id,
            'created_at': self.created_at.isoformat() if self.create_at else None
        }

    def __repr__(self):
        return f'<Folder: {self.name}>'

class Note(db.Model):
    __tablename__ = 'notes'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    content = db.Column(db.Text)
    folder_id = db.Column(db.Integer, db.ForeignKey('folders.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, server_default=func.now(), nullable=False)
    updated_at = db.Column(db.DateTime, server_default=func.now(), onupdate=func.now())

    user = relationship('User', back_populates='notes')
    folder = relationship('Folder', back_populates='notes')
    note_tags = relationship('NoteTag', back_populates='note', cascade='all, delete-orphan')
    tags = relationship('Tag', secondary='note_tags', back_populates='notes', overlaps='note_tags')

    @validates('title')
    def validate_title(self, key, value):
        if not value or not value.strip():
            raise ValueError('Note title required')
        
        value = value.strip()

        if len(value) > 100:
            raise ValueError('Note title must be 100 characters long or fewer')
        
        return value

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'folder_id': self.folder_id,
            'user_id': self.user_id,
            'tags': [tag.name for tag in self.tags],
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def __repr__(self):
        return f'<Note: {self.title}>'

class Tag(db.Model):
    __tablename__ = 'tags'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))

    __table_args__ = (
        UniqueConstraint('name', 'user_id', name='unique_tag_per_user')
    )

    user = relationship('User', back_populates='tags')
    note_tags = relationship('NoteTag', back_populates='tag', cascade='all, delete-orphan')
    notes = relationship('Note', secondary='note_tags', back_populates='tags', overlaps='note_tags')

    @validates('name')
    def validate_name(self, key, value):
        if not value or not value.strip():
            raise ValueError('Tag name is required')
        
        value = value.strip()

        if len(value) > 50:
            raise ValueError('Tag name must be 50 characters or less')
        
        return value

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'user_id': self.user_id
        }

    def __repr__(self):
        return f'<Tag: {self.name}>'

class NoteTag(db.Model):
    __tablename__ = 'note_tags'

    note_id = db.Column(db.Integer, db.ForeignKey('notes.id'), primary_key=True)
    tag_id = db.Column(db.Integer, db.ForeignKey('tags.id'), primary_key=True)

    note = relationship("Note", back_populates="note_tags")
    tag = relationship("Tag", back_populates="note_tags")

    