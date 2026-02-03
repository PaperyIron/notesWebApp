from app import app
from config import db
from models import User, Folder, Note, Tag, NoteTag
from faker import Faker
import random

fake = Faker()

def clear_database():
    """Clear all existing data from the database"""
    print("Clearing database...")
    with app.app_context():
        NoteTag.query.delete()
        Note.query.delete()
        Tag.query.delete()
        Folder.query.delete()
        User.query.delete()
        db.session.commit()
    print("Database cleared!")

def create_users():
    """Create 5 test users"""
    print("Creating users...")
    users = []
    usernames = ['alice_wonder', 'bob_builder', 'charlie_brown', 'diana_prince', 'evan_smith']
    
    for username in usernames:
        user = User(
            username=username,
            email=f"{username}@example.com"
        )
        user.password_hash = "password123"
        users.append(user)
        db.session.add(user)
    
    db.session.commit()
    print(f"Created {len(users)} users!")
    return users

def create_folders(users):
    """Create 2-3 folders per user"""
    print("Creating folders...")
    folders = []
    folder_names = [
        'Work', 'Personal', 'Projects', 'Ideas', 'Meeting Notes',
        'Research', 'To-Do', 'Study', 'Travel', 'Goals'
    ]
    colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280', '#14B8A6', '#F97316', '#84CC16']
    
    for user in users:
        num_folders = random.randint(2, 3)
        user_folder_names = random.sample(folder_names, num_folders)
        
        for folder_name in user_folder_names:
            folder = Folder(
                name=folder_name,
                color=random.choice(colors),
                user_id=user.id
            )
            folders.append(folder)
            db.session.add(folder)
    
    db.session.commit()
    print(f"Created {len(folders)} folders!")
    return folders

def create_tags(users):
    """Create 3-5 tags per user"""
    print("Creating tags...")
    tags = []
    tag_names = [
        'important', 'urgent', 'review', 'draft', 'completed',
        'idea', 'meeting', 'todo', 'reference', 'archive',
        'project', 'personal', 'work', 'study', 'planning'
    ]
    
    for user in users:
        num_tags = random.randint(3, 5)
        user_tag_names = random.sample(tag_names, num_tags)
        
        for tag_name in user_tag_names:
            tag = Tag(
                name=tag_name,
                user_id=user.id
            )
            tags.append(tag)
            db.session.add(tag)
    
    db.session.commit()
    print(f"Created {len(tags)} tags!")
    return tags

def create_notes(users, folders, tags):
    """Create 5-10 notes per user"""
    print("Creating notes...")
    notes = []
    
    for user in users:
        # Get user's folders and tags
        user_folders = [f for f in folders if f.user_id == user.id]
        user_tags = [t for t in tags if t.user_id == user.id]
        
        num_notes = random.randint(5, 10)
        
        for i in range(num_notes):
            # Generate lorem ipsum content
            num_paragraphs = random.randint(2, 5)
            content = '\n\n'.join([fake.paragraph(nb_sentences=random.randint(3, 8)) for _ in range(num_paragraphs)])
            
            note = Note(
                title=fake.sentence(nb_words=random.randint(3, 8)).rstrip('.'),
                content=content,
                folder_id=random.choice(user_folders).id,
                user_id=user.id
            )
            db.session.add(note)
            db.session.flush()  # Flush to get the note ID
            
            # Add 0-3 random tags to each note
            num_note_tags = random.randint(0, min(3, len(user_tags)))
            if num_note_tags > 0:
                note_tags_to_add = random.sample(user_tags, num_note_tags)
                for tag in note_tags_to_add:
                    note_tag = NoteTag(note_id=note.id, tag_id=tag.id)
                    db.session.add(note_tag)
            
            notes.append(note)
    
    db.session.commit()
    print(f"Created {len(notes)} notes!")
    return notes

def seed_database():
    """Main function to seed the database"""
    print("\n" + "="*50)
    print("SEEDING DATABASE")
    print("="*50 + "\n")
    
    with app.app_context():
        clear_database()
        users = create_users()
        folders = create_folders(users)
        tags = create_tags(users)
        notes = create_notes(users, folders, tags)
        
        print("\n" + "="*50)
        print("DATABASE SEEDING COMPLETE!")
        print("="*50)
        print(f"\nSummary:")
        print(f"  Users: {len(users)}")
        print(f"  Folders: {len(folders)}")
        print(f"  Tags: {len(tags)}")
        print(f"  Notes: {len(notes)}")
        print(f"\nTest Login Credentials:")
        print(f"  Username: alice_wonder")
        print(f"  Password: password123")
        print(f"\n  (All users have password: password123)")
        print("="*50 + "\n")

if __name__ == '__main__':
    seed_database()
