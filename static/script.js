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
  epDiv.className = 'bg-white p-6 rounded-xl shadow-md border border-gray-200 transition';
  epDiv.id = `episode-${index}`; // <-- Add unique ID

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

  // Scroll and highlight the active card
  const activeCard = document.getElementById(`episode-${index}`);
  if (activeCard) {
    activeCard.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Remove highlight from all cards
    document.querySelectorAll('[id^="episode-"]').forEach(card =>
      card.classList.remove('ring', 'ring-blue-400')
    );

    // Highlight the current one
    activeCard.classList.add('ring', 'ring-blue-400');
  }
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
const audioPlayer = document.getElementById('unifiedPlayer');
const playPauseBtn = document.getElementById('playPauseBtn');
const progressBar = document.getElementById('progressBar');
const currentTimeEl = document.getElementById('currentTime');
const durationEl = document.getElementById('duration');

function togglePlayPause() {
  if (audioPlayer.paused) {
    audioPlayer.play();
    playPauseBtn.textContent = '⏸️';
  } else {
    audioPlayer.pause();
    playPauseBtn.textContent = '▶️';
  }
}

// Update progress bar and time display
audioPlayer.addEventListener('timeupdate', () => {
  if (!audioPlayer.duration) return;

  const current = audioPlayer.currentTime;
  const duration = audioPlayer.duration;
  progressBar.value = (current / duration) * 100;
  currentTimeEl.textContent = formatTime(current);
  durationEl.textContent = formatTime(duration);
});

// Seek
progressBar.addEventListener('input', () => {
  if (!audioPlayer.duration) return;
  audioPlayer.currentTime = (progressBar.value / 100) * audioPlayer.duration;
});

// Format time
function formatTime(time) {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

// Sync UI on play/pause
audioPlayer.addEventListener('play', () => playPauseBtn.textContent = '⏸️');
audioPlayer.addEventListener('pause', () => playPauseBtn.textContent = '▶️');

audioPlayer.addEventListener('loadedmetadata', () => {
  durationEl.textContent = formatTime(audioPlayer.duration);
  progressBar.value = 0;
});