// storage.js
export const StorageManager = {
  dbInstance: null,

  initDB() {
    return new Promise((resolve, reject) => {
      if (window.cordova) {
        document.addEventListener('deviceready', () => {
          window.sqlitePlugin.openDatabase({
            name: 'catatan_pintar.db', location: 'default'
          }, (db) => {
            this.dbInstance = db;
            db.executeSql('CREATE TABLE IF NOT EXISTS notes (id TEXT PRIMARY KEY, title TEXT, content TEXT, timestamp INTEGER)', [], 
              () => resolve('SQLite DB Ready'), (err) => reject(err));
          }, (err) => reject(err));
        }, false);
      } else {
        if (!localStorage.getItem('notes_db')) {
          localStorage.setItem('notes_db', JSON.stringify([]));
        }
        resolve('Web Storage Ready');
      }
    });
  },

  saveNote(noteData) {
    return new Promise((resolve, reject) => {
      if (window.cordova && this.dbInstance) {
        this.dbInstance.executeSql('INSERT OR REPLACE INTO notes (id, title, content, timestamp) VALUES (?, ?, ?, ?)', 
          [noteData.id, noteData.title, noteData.content, noteData.timestamp], () => resolve(true), (err) => reject(err));
      } else {
        try {
          let notes = JSON.parse(localStorage.getItem('notes_db') || '[]');
          const index = notes.findIndex(n => n.id === noteData.id);
          if (index > -1) notes[index] = noteData; else notes.push(noteData);
          localStorage.setItem('notes_db', JSON.stringify(notes));
          resolve(true);
        } catch (err) { reject(err); }
      }
    });
  },

  getAllNotes() {
    return new Promise((resolve, reject) => {
      if (window.cordova && this.dbInstance) {
        this.dbInstance.executeSql('SELECT * FROM notes ORDER BY timestamp DESC', [], (rs) => {
          let notes = [];
          for (let i = 0; i < rs.rows.length; i++) notes.push(rs.rows.item(i));
          resolve(notes);
        }, (err) => reject(err));
      } else {
        let notes = JSON.parse(localStorage.getItem('notes_db') || '[]');
        notes.sort((a, b) => b.timestamp - a.timestamp);
        resolve(notes);
      }
    });
  },

  deleteNote(noteId) {
    return new Promise((resolve, reject) => {
      if (window.cordova && this.dbInstance) {
        this.dbInstance.executeSql('DELETE FROM notes WHERE id = ?', [noteId], () => resolve(true), (err) => reject(err));
      } else {
        try {
          let notes = JSON.parse(localStorage.getItem('notes_db') || '[]');
          notes = notes.filter(n => n.id !== noteId);
          localStorage.setItem('notes_db', JSON.stringify(notes));
          resolve(true);
        } catch (err) { reject(err); }
      }
    });
  }
};
