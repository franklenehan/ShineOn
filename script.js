fetch("api/positive_cancer_news.php")
  .then(res => res.json())
  .then(data => {
    const container = document.getElementById("newsFeed");
    if (!container) return;

    container.innerHTML = ""; // optional: clear any placeholder text

    // If the API returned an error object instead of an array, show a friendly message
    if (!Array.isArray(data)) {
      console.error("Newsfeed API returned an error or unexpected payload:", data);
      container.textContent = "Newsfeed is unavailable right now. Please try again later.";
      return;
    }

    data.forEach(article => {
      const div = document.createElement("div");
      div.className = "news-card";
      div.innerHTML = `
  <div class="news-item">
    ${article.urlToImage ? `<img src="${article.urlToImage}" alt="" class="news-image mb-2">` : ""}
    <h3>${article.title}</h3>
    <p>${article.description || ""}<br>
    <a href="${article.url}" target="_blank" rel="noopener noreferrer">Read more</a>
    </p>
  </div>
`;
      container.appendChild(div);
    });
  })
  .catch(err => {
    console.error("Error loading newsfeed:", err);
  });
