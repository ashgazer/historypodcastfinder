let episodeQueue = [];
let currentEpisodeIndex = -1;


document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchBox");

  // Listen for Enter key press
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.keyCode === 13) {
      e.preventDefault(); // prevent form submit or page refresh
      searchEpisodes();
    }
  });
});



function highlightMatch(text, query) {
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-200 text-black font-semibold">$1</mark>');
}

async function searchEpisodes() {
  const query = document.getElementById('searchBox').value.trim();
  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = '';

  if (!query) return;

  const res = await fetch(`/search?q=${encodeURIComponent(query)}`);
  const episodes = await res.json();

  if (episodes.length === 0) {
    resultsDiv.innerHTML = '<p class="text-center text-gray-500">No results found.</p>';
    episodeQueue = [];
    return;
  }

  // Store the full episode list in the queue
  episodeQueue = episodes;
  currentEpisodeIndex = -1; // reset current

  episodes.forEach((ep, index) => {
    const highlightedTitle = highlightMatch(ep.title, query);
    const highlightedSummary = highlightMatch(ep.summary, query);

    const epDiv = document.createElement('div');
    epDiv.className = 'bg-white p-6 rounded-xl shadow-md border border-gray-200';

    epDiv.innerHTML = `
      <h3 class="text-xl font-semibold mb-2 text-blue-800">${highlightedTitle}</h3>
      <p class="mb-4 text-gray-700">${highlightedSummary}</p>
      <button onclick="playEpisodeAt(${index})"
              class="px-4 py-2 mt-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm">
        ▶️ Play
      </button>
    `;

    resultsDiv.appendChild(epDiv);
  });
}


function playEpisodeAt(index) {
  const playerContainer = document.getElementById('playerContainer');
  const audioPlayer = document.getElementById('unifiedPlayer');
  const nowPlaying = document.getElementById('nowPlaying');

  if (index < 0 || index >= episodeQueue.length) return;

  const episode = episodeQueue[index];
  audioPlayer.src = decodeURIComponent(episode.audio_url);
  nowPlaying.textContent = `Now Playing: ${episode.title}`;
  playerContainer.classList.remove('hidden');
  currentEpisodeIndex = index;
  audioPlayer.play();
}

document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchBox");
  const audioPlayer = document.getElementById("unifiedPlayer");

  // Enter key support
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.keyCode === 13) {
      e.preventDefault();
      searchEpisodes();
    }
  });

  // Auto-play next episode when one ends
  audioPlayer.addEventListener("ended", () => {
    const nextIndex = currentEpisodeIndex + 1;
    if (nextIndex < episodeQueue.length) {
      playEpisodeAt(nextIndex);
    }
  });
});

function playNext() {
  const nextIndex = currentEpisodeIndex + 1;
  if (nextIndex < episodeQueue.length) {
    playEpisodeAt(nextIndex);
  }
}

function playPrevious() {
  const prevIndex = currentEpisodeIndex - 1;
  if (prevIndex >= 0) {
    playEpisodeAt(prevIndex);
  }
}
