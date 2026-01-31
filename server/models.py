from sqlalchemy import DateTime, func
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

    @hybrid_property
    def password_hash(self):
        raise AttributeError('Password hashes cannot be viewed')
    
    @password_hash.setter
    def password_hash(self, password):
        if len(password < 8):
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
    notes = relationship('Note', back_populates='folders')

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

    def __repr__(self):
        return f'<Note: {self.title}>'

class Tag(db.Model):
    __tablename__ = 'tags'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))

    user = relationship('User', back_populates='tags')
    note_tags = relationship('NoteTag', back_populates='tag', cascade='all, delete-orphan')
    notes = relationship('Note', secondary='note_tags', back_populates='tags', overlaps='note_tags')

    def __repr__(self):
        return f'<Tag: {self.name}>'

class NoteTag(db.Model):
    __tablename__ = 'note_tags'

    note_id = db.Column(db.Integer, db.ForeignKey('notes.id'), primary_key=True)
    tag_id = db.Column(db.Integer, db.ForeignKey('tags.id'), primary_key=True)

    note = relationship("Note", back_populates="note_tags")
    tag = relationship("Tag", back_populates="note_tags")

    