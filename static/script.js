function highlightMatch(text, query) {
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // escape regex
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-200 text-black font-semibold">$1</mark>');
}



document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchBox");

  // Listen for Enter key press
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      searchEpisodes();
    }
  });
});

async function searchEpisodes() {
  const query = document.getElementById('searchBox').value.trim();
  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = '';

  if (!query) return;

  const res = await fetch(`/search?q=${encodeURIComponent(query)}`);
  const episodes = await res.json();

  if (episodes.length === 0) {
    resultsDiv.innerHTML = '<p class="text-center text-gray-500">No results found.</p>';
    return;
  }

  episodes.forEach(ep => {
    const highlightedTitle = highlightMatch(ep.title, query);
    const highlightedSummary = highlightMatch(ep.summary, query);

    const epDiv = document.createElement('div');
    epDiv.className = 'bg-white p-6 rounded-xl shadow-md border border-gray-200';

    epDiv.innerHTML = `
      <h3 class="text-xl font-semibold mb-2 text-blue-800">${highlightedTitle}</h3>
      <p class="mb-4 text-gray-700">${highlightedSummary}</p>
      <audio class="w-full" controls src="${ep.audio_url}"></audio>
    `;

    resultsDiv.appendChild(epDiv);
  });
}
