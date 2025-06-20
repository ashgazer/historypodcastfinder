from flask import Flask, request, jsonify, render_template
import sqlite3

from get_feed_info import update_db

app = Flask(__name__)

DB_PATH = 'podcast.db'

def query_episodes(search_term,after_date=None, tag_list=None):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    like_term = f'%{search_term} %'
    params = [like_term, like_term]
    sql = """
        SELECT title, summary, url, show_name, published
        FROM episodes
        WHERE (title LIKE ? OR summary LIKE ?)
    """

    if after_date:
        sql += " AND published >= ?"
        params.append(after_date)

    if tag_list:
        placeholders = " OR ".join("show_name = ?" for _ in tag_list)
        sql += f" AND ({placeholders})"
        params.extend([f'{tag}' for tag in tag_list])

    sql += " ORDER BY published"
    print(sql, params)
    c.execute(sql, params)
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
    tags = request.args.getlist("tag")  # captures all repeated 'tag' params
    after = request.args.get('after')

    episodes = query_episodes(query, after_date=after, tag_list=tags)

    return jsonify(episodes)

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
