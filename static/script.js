let audioPlayer, playPauseBtn, progressBar, currentTimeEl, durationEl;
let episodeQueue = [];
let currentEpisodeIndex = -1;
let currentEpisodeId = null;

function highlightMatch(text, query) {
  if (!query) return text;
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-200 text-black font-semibold">$1</mark>');
}

document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchBox");

  audioPlayer = document.getElementById("unifiedPlayer");
  playPauseBtn = document.getElementById("playPauseBtn");
  progressBar = document.getElementById("progressBar");
  currentTimeEl = document.getElementById("currentTime");
  durationEl = document.getElementById("duration");

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      searchEpisodes();
    }
  });

  audioPlayer.addEventListener("ended", () => {
    playNext();
  });

  // 🧠 Save position on update
  audioPlayer.addEventListener("timeupdate", () => {
    if (audioPlayer.duration) {
      progressBar.value = (audioPlayer.currentTime / audioPlayer.duration) * 100;
      currentTimeEl.textContent = formatTime(audioPlayer.currentTime);

      if (currentEpisodeId && !audioPlayer.paused) {
        localStorage.setItem(`position-${currentEpisodeId}`, audioPlayer.currentTime);
      }
    }
  });

  // Seek
  progressBar.addEventListener("input", () => {
    if (audioPlayer.duration) {
      audioPlayer.currentTime = (progressBar.value / 100) * audioPlayer.duration;
    }
  });

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

// Format time
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
  currentEpisodeId = ep.audio_url; // use audio_url as unique key

  audioPlayer.src = ep.audio_url;
  document.getElementById("playerContainer").classList.remove("hidden");
  document.getElementById("nowPlaying").textContent = `Now Playing: ${ep.title}`;

  // ⏪ Restore saved time if available
  const savedTime = localStorage.getItem(`position-${currentEpisodeId}`);
  if (savedTime) {
    audioPlayer.addEventListener("loadedmetadata", () => {
      if (audioPlayer.duration > savedTime) {
        audioPlayer.currentTime = parseFloat(savedTime);
      }
      audioPlayer.play();
    }, { once: true });
  } else {
    audioPlayer.play();
  }

  // Highlight card
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
  const nextIndex = currentEpisodeIndex + 1;
  if (nextIndex < episodeQueue.length) {
    playEpisodeAt(nextIndex);
  } else {
    playEpisodeAt(0);
  }
}

function playPrevious() {
  if (currentEpisodeIndex > 0) {
    playEpisodeAt(currentEpisodeIndex - 1);
  }
}

function skipForward() {
  const audio = document.getElementById('unifiedPlayer');
  if (audio) {
    audio.currentTime = Math.min(audio.duration, audio.currentTime + 10);
  }
}

function skipBackward() {
  const audio = document.getElementById('unifiedPlayer');
  if (audio) {
    audio.currentTime = Math.max(0, audio.currentTime - 10);
  }
}

