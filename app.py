from flask import Flask, request, jsonify, render_template
import sqlite3

from get_feed_info import update_db

app = Flask(__name__)

DB_PATH = 'podcast.db'

def query_episodes(search_term):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    like_term = f'%{search_term} %'
    c.execute("""
        SELECT title, summary, url, show_name, published
        FROM episodes
        WHERE title LIKE ? OR summary LIKE ?
        order by published
    """, (like_term, like_term))
    results = c.fetchall()
    conn.close()
    return [{
        "title": r[0],
        "summary": r[1],
        "audio_url": r[2],
        "show_name": r[3],
        "published": r[4],
    } for r in results
]

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

@app.route('/update')
def update():
    """
    This endpoint is for updating the database with new episodes.
    In a real application, you would implement logic to fetch new episodes
    and save them to the database.
    """
    update_db()
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        SELECT  max(published)
        FROM episodes
    """)
    results = c.fetchone()
    conn.close()
    return jsonify(
        {"status": "success", "message": "Database updated successfully.",
         "last_updated": results[0] if results else None}
    )


if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0", port=5001)
