let audioPlayer, playPauseBtn, progressBar, currentTimeEl, durationEl;
let episodeQueue = [];
let currentEpisodeIndex = -1;

function highlightMatch(text, query) {
  if (!query) return text;

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // escape regex
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-200 text-black font-semibold">$1</mark>');
}


document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchBox");

  // Assign global references
  audioPlayer = document.getElementById("unifiedPlayer");
  playPauseBtn = document.getElementById("playPauseBtn");
  progressBar = document.getElementById("progressBar");
  currentTimeEl = document.getElementById("currentTime");
  durationEl = document.getElementById("duration");

  // Enter key to search
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      searchEpisodes();
    }
  });

  // Auto-play next
  audioPlayer.addEventListener("ended", () => {
    playNext();
  });

  // Update progress and time
  audioPlayer.addEventListener("timeupdate", () => {
    if (audioPlayer.duration) {
      progressBar.value = (audioPlayer.currentTime / audioPlayer.duration) * 100;
      currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
    }
  });

  // Seek with progress bar
  progressBar.addEventListener("input", () => {
    if (audioPlayer.duration) {
      audioPlayer.currentTime = (progressBar.value / 100) * audioPlayer.duration;
    }
  });

  // Show duration once metadata is loaded
  audioPlayer.addEventListener("loadedmetadata", () => {
    durationEl.textContent = formatTime(audioPlayer.duration);
    currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
    progressBar.value = 0;
  });

  audioPlayer.addEventListener("play", () => {
    playPauseBtn.textContent = '⏸️';
  });

  audioPlayer.addEventListener("pause", () => {
    playPauseBtn.textContent = '▶️';
  });
});

// Format seconds to mm:ss
function formatTime(time) {
  const min = Math.floor(time / 60);
  const sec = Math.floor(time % 60).toString().padStart(2, '0');
  return `${min}:${sec}`;
}

function searchEpisodes() {
  const query = document.getElementById("searchBox").value.trim();
  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = '';

  if (!query) return;

  fetch(`/search?q=${encodeURIComponent(query)}`)
    .then(res => res.json())
    .then(episodes => {
      if (episodes.length === 0) {
        resultsDiv.innerHTML = '<p class="text-center text-gray-500">No results found.</p>';
        episodeQueue = [];
        return;
      }

      episodeQueue = episodes;
      currentEpisodeIndex = -1;

      episodes.forEach((ep, index) => {
        const div = document.createElement("div");
        div.className = "bg-white p-6 rounded-xl shadow-md border border-gray-200";
        div.id = `episode-${index}`;

     const highlightedTitle = highlightMatch(ep.title, query);
const highlightedSummary = highlightMatch(ep.summary, query);

div.innerHTML = `
  <h3 class="text-xl font-semibold mb-2 text-blue-800">${ep.show_name || ''} - ${highlightedTitle}</h3>
  <p class="mb-4 text-gray-700">${highlightedSummary}</p>
  <button onclick="playEpisodeAt(${index})" class="px-4 py-2 mt-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm">▶️ Play</button>
`;


        resultsDiv.appendChild(div);
      });
    });
}

function playEpisodeAt(index) {
  if (index < 0 || index >= episodeQueue.length) return;

  currentEpisodeIndex = index;
  const ep = episodeQueue[index];

  audioPlayer.src = ep.audio_url; // ✅ FIXED
  document.getElementById("playerContainer").classList.remove("hidden");
  document.getElementById("nowPlaying").textContent = `Now Playing: ${ep.title}`;
  audioPlayer.play(); // ✅ this will now work

  // Highlight current card
  document.querySelectorAll('[id^="episode-"]').forEach(card =>
    card.classList.remove('ring', 'ring-blue-400')
  );
  const active = document.getElementById(`episode-${index}`);
  if (active) {
    active.scrollIntoView({ behavior: "smooth", block: "center" });
    active.classList.add('ring', 'ring-blue-400');
  }
}


function togglePlayPause() {
  if (audioPlayer.paused) {
    audioPlayer.play();
  } else {
    audioPlayer.pause();
  }
}

function playNext() {
  if (currentEpisodeIndex + 1 < episodeQueue.length) {
    playEpisodeAt(currentEpisodeIndex + 1);
  }
}

function playPrevious() {
  if (currentEpisodeIndex > 0) {
    playEpisodeAt(currentEpisodeIndex - 1);
  }
}
