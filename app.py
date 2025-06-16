from flask import Flask, request, jsonify, render_template
import sqlite3

app = Flask(__name__)

DB_PATH = 'podcast.db'

def query_episodes(search_term):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    like_term = f'%{search_term}%'
    c.execute("""
        SELECT title, summary, url, show_name
        FROM episodes
        WHERE title LIKE ? OR summary LIKE ?
    """, (like_term, like_term))
    results = c.fetchall()
    conn.close()
    return [{"title": r[0], "summary": r[1], "audio_url": r[2], "show_name": r[3]} for r in results]

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/search')
def search():
    query = request.args.get('q', '')
    if not query:
        return jsonify([])

    results = query_episodes(query)
    return jsonify(results)

if __name__ == '__main__':
    app.run(debug=True)
