from flask import Flask, request, session, jsonify
from flask_migrate import Migrate
from flask_restful import Resource, Api
from config import db, bcrypt
from models import User, Folder, Note, Tag, NoteTag
from flask_cors import CORS
import os

app = Flask(__name__)

CORS(app)

app.config['SECRET_KEY'] = 'TEST'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///notes.db'

db.init_app(app)
bcrypt.init_app(app)
migrate = Migrate(app, db)
api = Api(app)

@app.route('/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        password_confirmation = data.get('password_confirmation')

        if not username or not password or not email:
            return jsonify({'error': 'Username, email, and password required'}), 400
        
        if password != password_confirmation:
            return jsonify({'error': 'Passwords do not match'}), 422
        
        existing_user = User.query.filter_by(username=username).first()
        if existing_user:
            return jsonify({'error': 'Username already exists'}), 422
        
        new_user = User(username=username, email=email)
        new_user.password_hash = password
        db.session.add(new_user)
        db.session.commit()

        session['user_id'] = new_user.id
        
        return jsonify(new_user.to_dict()), 201
    
    except ValueError as e:
        return jsonify({'error': str(e)}), 422
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        username = data.get('username')
        password = data.get('password')

        if not username or not password:
            return jsonify({'error': 'Username and password required'}), 400
        
        user = User.query.filter_by(username=username).first()

        if not user or not user.authenticate(password):
            return jsonify({'error': 'Invalid username or password'}), 401
        
        session['user_id'] = user.id

        return jsonify(user.to_dict())
    
    except Exception as e:
        return jsonify({'error': str(e)}), 401
    
@app.route('/check_session', methods=['GET'])
def check_session():
    user_id = session.get('user_id')
    if user_id:
        user = User.query.get(user_id)
        if user: 
            return jsonify(user.to_dict()), 200
    
    return jsonify({}), 401

@app.route('/logout', methods=['DELETE'])
def logout():
    if 'user_id' not in session:
        return jsonify({'error': 'No active session'}), 401
    session.pop('user_id', None)
    return jsonify({}), 200

class NotesList(Resource):
    def get(self):
        user_id = session.get('user_id')
        if not user_id:
            return {'error': 'Unauthorized'}, 401

        limit = request.args.get('limit', 20, type=int)
        offset = request.args.get('offset', 0, type=int)
        folder_id = request.args.get('folder_id', type=int)

        query = Note.query.filter_by(user_id=user_id)
        if folder_id:
            query = query.filter_by(folder_id=folder_id)

        query = query.order_by(Note.updated_at.desc())

        total = query.count()

        notes = query.limit(limit).offset(offset).all()

        has_more = (offset + limit) < total

        return {
            'notes': [note.to_dict() for note in notes],
            'pagination': {
                'limit': limit,
                'offset': offset,
                'total': total,
                'has_more': has_more,
                'next_offset': offset + limit if has_more else None
            }
        }, 200
    
    def post(self):
        user_id = session.get('user_id')
        if not user_id:
            return {'error': 'Unauthorized'}, 401
        
        try:
            data = request.get_json()
            if not data:
                return {'error': 'No data provided'}, 400
            
            title = data.get('title')
            content = data.get('content', '')
            folder_id = data.get('folder_id')

            if not title:
                return {'error': 'Title is required'}, 400
            
            if not folder_id:
                return {'error': 'Folder id is required'}, 400
            
            folder = Folder.query.filter_by(id=folder_id, user_id=user_id).first()
            if not folder:
                return {'error': 'Folder not found'}, 404
            
            new_note = Note(
                title = title,
                content = content,
                folder_id = folder_id,
                user_id = user_id
            )

            db.session.add(new_note)
            db.session.commit()

            return new_note.to_dict(), 201
        
        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500
        
class NotesDetail(Resource):
    def get(self, note_id):
        user_id = session.get('user_id')
        if not user_id:
            return {'error': 'Unauthorized'}, 401
        
        note = Note.query.filter_by(id=note_id, user_id=user_id).first()
        if not note:
            return {'error': 'Note not found'}, 404
        
        return note.to_dict(), 200
    
    def put(self, note_id):
        user_id = session.get('user_id')
        if not user_id:
            return {'error': 'Unauthorized'}, 401
        
        note = Note.query.filter_by(id=note_id, user_id=user_id).first()
        if not note:
            return {'error': 'Note not found'}, 404
        
        try:
            data = request.get_json()
            if not data:
                return {'error': 'No data provided'}, 400
            
            if 'title' in data:
                note.title = data['title']
            if 'content' in data:
                note.content = data['content']
            if 'folder_id' in data:
                folder = Folder.query.filter_by(id=data['folder_id'], user_id=user_id).first()
                if not folder:
                    return {'error': 'Folder not found'}, 404
                note.folder_id = data['folder_id']

            db.session.commit()
            return note.to_dict(), 200
        
        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500
        
    def delete(self, note_id):
        user_id = session.get('user_id')
        if not user_id:
            return {'error': 'Unauthorized'}, 401
        
        note = Note.query.filter_by(id=note_id, user_id=user_id).first()
        if not note:
            return {'error': 'Note not found'}, 404
        
        try:
            db.session.delete(note)
            db.session.commit()
            return {}, 204
        
        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500
        
class FoldersList(Resource):
    def get(self):
        user_id = session.get('user_id')
        if not user_id:
            return {'error': 'Unauthorized'}, 401
        
        folders = Folder.query.filter_by(user_id=user_id).order_by(Folder.created_at).all()

        return {'folders': [folder.to_dict() for folder in folders]}, 200

    def post(self):
        user_id = session.get('user_id')
        if not user_id:
            return {'error': 'Unauthorized'}, 401
        
        try:
            data = request.get_json()
            if not data:
                return {'error': 'No data provided'}, 400
            
            name = data.get('name')
            color = data.get('color', '#6B7280')

            if not name:
                return {'error': 'Folder name is required'}, 400
            
            new_folder = Folder(
                name=name,
                color=color,
                user_id=user_id
            )

            db.session.add(new_folder)
            db.session.commit()

            return new_folder.to_dict(), 201
        
        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500
        
class FoldersDetail(Resource):
    def get(self, folder_id):
        user_id = session.get('user_id')
        if not user_id:
            return {'error': 'Unauthorized'}, 401
        
        folder = Folder.query.filter_by(id=folder_id, user_id=user_id).first()
        if not folder:
            return {'error': 'Folder not found'}, 404
        
        return folder.to_dict(), 200
        
    def put(self, folder_id):
        user_id = session.get('user_id')
        if not user_id:
            return {'error': 'Unauthorized'}, 401
    
        folder = Folder.query.filter_by(id=folder_id, user_id=user_id).first()
        if not folder:
            return {'error': 'Folder not found'}, 404
    
        try:
            data = request.get_json()
            if not data:
                return {'error': 'No data provided'}, 400
        
            if 'name' in data:
                folder.name = data['name']
            if 'color' in data:
                folder.color = data['color']
        
            db.session.commit()
            return folder.to_dict(), 200
    
        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500
        
    def delete(self, folder_id):
        user_id = session.get('user_id')
        if not user_id:
            return {'error': 'Unauthorized'}, 401
        
        folder = Folder.query.filter_by(id=folder_id, user_id=user_id).first()
        if not folder:
            return {'error': 'Folder not found'}, 404
        
        try:
            db.session.delete(folder)
            db.session.commit()
            return {}, 204
        
        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500
        
class TagsList(Resource):
    def get(self):
        user_id = session.get('user_id')
        if not user_id:
            return {'error': 'Unauthorized'}, 401
        
        tags = Tag.query.filter_by(user_id=user_id).all()
        return {'tags': [tag.to_dict() for tag in tags]}, 200
    
    def post(self):
        user_id = session.get('user_id')
        if not user_id:
            return {'error': 'Unauthorized'}, 401
        
        try:
            data = request.get_json()
            if not data:
                return {'error': 'No data provided'}, 400
            
            name = data.get('name')
            if not name:
                return {'error': 'Tag name is required'}, 400
            
            existing_tag = Tag.query.filter_by(name=name, user_id=user_id).first()
            if existing_tag:
                return {'error': 'Tag already exists'}, 422
            
            new_tag = Tag(
                name = name,
                user_id = user_id
            )

            db.session.add(new_tag)
            db.session.commit()

            return new_tag.to_dict(), 201
        
        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500
        
class TagsDetail(Resource):
    def delete(self, tag_id):
        user_id = session.get('user_id')
        if not user_id:
            return {'error': 'Unauthorized'}, 404
        
        tag = Tag.query.filter_by(id=tag_id, user_id=user_id).first()
        if not tag:
            return {'error': 'Tag not found.'}, 404
        
        try:
            db.session.delete(tag)
            db.session.commit()
            return {}, 204
        
        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500
        
class NoteTagsManagement(Resource):
    def post(self, note_id):
        user_id = session.get('user_id')
        if not user_id:
            return {'error': 'Unauthorized'}, 401
        
        note = Note.query.filter_by(id=note_id, user_id=user_id).first()
        if not note:
            return {'error': 'Note not found'}, 404
        
        try:
            data = request.get_json()
            if not data:
                return {'error': 'No data provided'}, 400
            
            tag_id = data.get('tag_id')
            if not tag_id:
                return {'error': 'Tag ID is required'}, 400
            
            tag = Tag.query.filter_by(id=tag_id, user_id=user_id).first()
            if not tag:
                return {'error': 'Tag not found'}, 404
            
            existing_tag = NoteTag.query.filter_by(note_id=note_id, tag_id=tag_id).first()
            if existing_tag:
                return {'error': 'Tag already exists'}, 422
            
            note_tag = NoteTag(note_id=note_id, tag_id=tag_id)
            db.session.add(note_tag)
            db.session.commit()

            return {'message': 'Tag added to note'}, 201
        
        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500
        
    def delete(self, note_id, tag_id):
        user_id = session.get('user_id')
        if not user_id:
            return {'error': 'Unauthorized'}, 401
        
        note = Note.query.filter_by(id=note_id, user_id=user_id).first()
        if not note:
            return {'error': 'Note not found'}, 404
        
        try:
            note_tag = NoteTag.query.filter_by(note_id=note_id, tag_id=tag_id).first()
            if not note_tag:
                return {'error': 'Tag not found on note'}, 404
            
            db.session.delete(note_tag)
            db.session.commit()

            return {}, 204
        
        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 500
        
class NotesSearch(Resource):
    def get(self):
        user_id = session.get('user_id')
        if not user_id:
            return {'error': 'Unauthorized'}, 401
        
        query_text = request.args.get('q', '').strip()
        folder_id = request.args.get('folder_id', type=int)
        tag_id = request.args.get('tag_id', type=int)

        query = Note.query.filter_by(user_id=user_id)

        if query_text:
            search_filter = db.or_(
                Note.title.ilike(f'%{query_text}%'),
                Note.content.ilike(f'%{query_text}%')
            )
            query = query.filter(search_filter)

        if folder_id:
            query = query.filter_by(folder_id=folder_id)

        if tag_id:
            query = query.join(NoteTag).filter(NoteTag.tag_id == tag_id)

        notes = query.order_by(Note.updated_at.desc()).all()

        return {'notes': [note.to_dict() for note in notes]}, 200
    
api.add_resource(NotesList, '/api/notes')
api.add_resource(NotesDetail, '/api/notes/<int:note_id>')
api.add_resource(FoldersList, '/api/folders')
api.add_resource(FoldersDetail, '/api/folders/<int:folder_id>')
api.add_resource(TagsList, '/api/tags')
api.add_resource(TagsDetail, '/api/tags/<int:tag_id>')
api.add_resource(NoteTagsManagement, '/api/notes/<int:note_id>/tags', '/api/notes/<int:note_id>/tags/<int:tag_id>')
api.add_resource(NotesSearch, '/api/notes/search')

if __name__ == '__main__':
    app.run(debug=True, port=5555)
        
        

            

    

        