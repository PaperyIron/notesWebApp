# NoteTaker

NoteTaker is a web application to organize, create, and manage all of your notes. Login or Signup to get started. You can easily create notes and place them in folders to keep them organized, and add tags to notes for even better search functionality. Search all your notes from the search bar.

## Features

- **User Authentication** - Secure signup and login with password hashing
- **Folder Organization** - Create custom folders with color coding to organize notes
- **Note Management** - Create, edit, delete, and search notes
- **Tagging System** - Add multiple tags to notes for better categorization
- **Search Functionality** - Search notes by title, content, folder, or tag

## Installation & Setup

### Prerequisites
- Node.js and npm
- Python 3.x
- pip or pipenv

### Step-by-Step Instructions

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd <project-folder>
   ```

2. **Install Frontend Dependencies**
   ```bash
   cd notesFrontend
   npm install
   cd ..
   ```

3. **Install Backend Dependencies**
   ```bash
   cd server
   ```
   
   Using pipenv (recommended):
   ```bash
   pipenv install
   pipenv shell
   ```
   
   OR using pip:
   ```bash
   pip install -r requirements.txt
   ```

   You can optionally seed the database as well:
   ```bash
   python seed.py
   ```

4. **Start the Backend Server**
   ```bash
   python app.py
   ```
   The server will run on `http://localhost:5555`

5. **Start the Frontend (in a new terminal)**
   ```bash
   cd notesFrontend
   npm run dev
   ```
   
6. **Open the Application**
   - Click the localhost link provided in the terminal (usually `http://localhost:5173`)
   - Create an account or try the test user.
        ```
        Username: test
        Password: testuser1
        ```

## API Endpoints

### Authentication
- `POST /signup` - Create a new user account
- `POST /login` - Login to existing account
- `GET /check_session` - Check if user is logged in
- `DELETE /logout` - Logout current user

### Notes
- `GET /api/notes` - Get all notes for logged-in user
- `POST /api/notes` - Create a new note
- `GET /api/notes/<id>` - Get a specific note
- `PUT /api/notes/<id>` - Update a note
- `DELETE /api/notes/<id>` - Delete a note
- `GET /api/notes/search` - Search notes by query

### Folders
- `GET /api/folders` - Get all folders
- `POST /api/folders` - Create a new folder
- `GET /api/folders/<id>` - Get a specific folder
- `PUT /api/folders/<id>` - Update a folder
- `DELETE /api/folders/<id>` - Delete a folder

### Tags
- `GET /api/tags` - Get all tags
- `POST /api/tags` - Create a new tag
- `DELETE /api/tags/<id>` - Delete a tag
- `POST /api/notes/<id>/tags` - Add a tag to a note
- `DELETE /api/notes/<id>/tags/<tag_id>` - Remove a tag from a note

## Usage

1. **Sign Up** - Create a new account with username, email, and password
2. **Create Folders** - Organize your notes by creating folders with custom colors
3. **Add Notes** - Write notes and assign them to folders
4. **Tag Notes** - Add tags to notes for better categorization
5. **Search** - Find notes quickly using the search bar
6. **Edit/Delete** - Click on any note to edit or delete it

## Database Schema

### Users
- id, username, email, password_hash

### Folders
- id, name, color, user_id, created_at

### Notes
- id, title, content, folder_id, user_id, created_at, updated_at

### Tags
- id, name, user_id

### NoteTag (Junction Table)
- note_id, tag_id

## Future Improvements
- Better folder implementation.  Folders within folders.
- Dark mode
- Markdown support
- Ability to create and use templates
- Ability to share notes with other users for collaboration
