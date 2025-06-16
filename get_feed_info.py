import feedparser
import sqlite3
from keybert import KeyBERT
import yake
import json



def get_episode_information():
    # NewsFeed =
    data = []

    for NewsFeed in [feedparser.parse("https://podcasts.files.bbci.co.uk/p07mdbhg.rss"),
                     feedparser.parse("https://podcasts.files.bbci.co.uk/b006qykl.rss"),
                     feedparser.parse("https://podcasts.files.bbci.co.uk/p0683ms3.rss"),

                     ]:
        title = NewsFeed.feed.title
        print(len(NewsFeed.entries))

        for entry in NewsFeed.entries:
            summary = entry['summary']
            url = entry['ppg_enclosuresecure']['url']
            episode_title = entry['title']
            data.append([title, summary, url, episode_title])

    return data

def get_episode_information_rihp():
    data = []

    for NewsFeed in [feedparser.parse("https://feeds.megaphone.fm/GLT4787413333"),
                     feedparser.parse("https://feeds.megaphone.fm/empirepodcast"),
                     feedparser.parse("https://feeds.megaphone.fm/NSR8236478683"),
                     feedparser.parse("https://feeds.megaphone.fm/TECO4776134998"),
                     ]:
        title = NewsFeed.feed.title
        print(len(NewsFeed.entries))

        for entry in NewsFeed.entries:
            summary = entry['summary_detail']['value']
            url = entry['links'][0]['href']
            episode_title = entry['title']
            data.append([title, summary, url, episode_title])
    return data


def save_to_database(episodes):
    conn = sqlite3.connect('podcast.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS episodes
                 (        id INTEGER PRIMARY KEY AUTOINCREMENT,show_name TEXT,summary TEXT, url TEXT, title TEXT)''')
    c.executemany('INSERT INTO episodes (show_name,summary, url, title) VALUES (?,?, ?, ?)', episodes)
    conn.commit()
    conn.close()



def read_from_database():
    conn = sqlite3.connect('podcast.db')
    c = conn.cursor()
    c.execute('SELECT id, summary FROM episodes')
    rows = c.fetchall()
    conn.close()
    return rows


def get_bert_embeddings(pod_data):
    data = []
    kw_model = KeyBERT()
    for x in pod_data:
        keywords = kw_model.extract_keywords(x[1])
        data.append([x[0], x[1], keywords])

    return data

def get_yake_embeddings(pod_data):
    data = []
    kw_extractor = yake.KeywordExtractor()
    for x in pod_data:
        keywords = kw_extractor.extract_keywords(x[1])
        data.append([x[0], [i[0].lower() for i in keywords]])

    return data


def save_yake_embeddings(embeddings):
    conn = sqlite3.connect('podcast.db')

    for episode in embeddings:
        c = conn.cursor()
        c.execute('''CREATE TABLE IF NOT EXISTS yake_embeddings
                     (id INTEGER PRIMARY KEY AUTOINCREMENT, episode_id int, keywords TEXT)''')
        beddings  = json.dumps(episode[1])
        c.execute('INSERT INTO yake_embeddings (episode_id, keywords) VALUES (?, ?)',
                  (episode[0], beddings))
    conn.commit()
    conn.close()

def save_embeddings(embeddings):
    conn = sqlite3.connect('podcast.db')

    for episode in embeddings:
        c = conn.cursor()
        c.execute('''CREATE TABLE IF NOT EXISTS embeddings
                     (id INTEGER PRIMARY KEY AUTOINCREMENT, episode_id int, keywords TEXT)''')
        beddings  = json.dumps([x[0] for x in episode[2]])
        c.execute('INSERT INTO embeddings (episode_id, keywords) VALUES (?, ?)',
                  (episode[0], beddings))
    conn.commit()
    conn.close()


def read_embeddings():
    conn = sqlite3.connect('podcast.db')
    c = conn.cursor()
    c.execute('SELECT episode_id, keywords FROM embeddings')
    rows = c.fetchall()
    conn.close()
    return rows

if __name__ == "__main__":
    episodes = get_episode_information()
    save_to_database(episodes)

    episodes = get_episode_information_rihp()
    save_to_database(episodes)

    pod_data = read_from_database()

    yake_embeddings = get_yake_embeddings(pod_data)
    save_yake_embeddings(yake_embeddings)

    bert_embeddings = get_bert_embeddings(pod_data)
    save_embeddings(bert_embeddings)
