/* =========================================================
   Earbug Blog — post list (Blog page)
   Fetches published posts from Sanity's Content API and
   renders them as cards, with a "Load More" button that
   pages back through older posts.
   ========================================================= */
(function () {
  "use strict";

  var PROJECT_ID = "udb0lqxn";
  var DATASET = "production";
  var API_VERSION = "2024-06-01";
  var BATCH_SIZE = 6;
  var API_BASE = "https://" + PROJECT_ID + ".apicdn.sanity.io/v" + API_VERSION + "/data/query/" + DATASET;

  var gridEl = document.querySelector("[data-blog-grid]");
  if (!gridEl) return;

  var stateEl = document.querySelector("[data-blog-state]");
  var loadMoreWrap = document.querySelector("[data-blog-load-more-wrap]");
  var loadMoreBtn = document.querySelector("[data-blog-load-more]");

  var start = 0;
  var loading = false;

  function buildUrl(query, params) {
    var url = API_BASE + "?query=" + encodeURIComponent(query);
    Object.keys(params || {}).forEach(function (key) {
      url += "&$" + key + "=" + encodeURIComponent(JSON.stringify(params[key]));
    });
    return url;
  }

  function formatDate(iso) {
    if (!iso) return "";
    var date = new Date(iso);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  }

  function escapeHtml(value) {
    var div = document.createElement("div");
    div.textContent = value == null ? "" : String(value);
    return div.innerHTML;
  }

  function cardHtml(post) {
    var href = "blog-post.html?slug=" + encodeURIComponent(post.slug);
    var imageBlock = "";

    if (post.imageUrl) {
      imageBlock =
        '<a class="blog-card-image-link" href="' + href + '" aria-hidden="true" tabindex="-1">' +
        '<div class="blog-card-image-wrap">' +
        '<img src="' + escapeHtml(post.imageUrl) + '?w=800&h=500&fit=crop&auto=format" alt="" loading="lazy" width="800" height="500">' +
        "</div></a>";
    }

    return (
      '<article class="blog-card">' +
      imageBlock +
      '<div class="blog-card-body">' +
      '<p class="blog-card-meta">' + formatDate(post.publishedAt) + "</p>" +
      '<h2 class="blog-card-title"><a href="' + href + '">' + escapeHtml(post.title) + "</a></h2>" +
      (post.excerpt ? '<p class="blog-card-excerpt">' + escapeHtml(post.excerpt) + "</p>" : "") +
      "</div>" +
      "</article>"
    );
  }

  function setState(message, isError) {
    if (!stateEl) return;
    if (!message) {
      stateEl.hidden = true;
      stateEl.textContent = "";
      return;
    }
    stateEl.hidden = false;
    stateEl.textContent = message;
    stateEl.classList.toggle("is-error", !!isError);
  }

  function setLoadMoreBusy(isBusy) {
    if (!loadMoreBtn) return;
    loadMoreBtn.disabled = isBusy;
    loadMoreBtn.textContent = isBusy ? "Loading…" : "Load More Posts";
  }

  function loadBatch() {
    if (loading) return;
    loading = true;
    setLoadMoreBusy(true);
    if (start === 0) setState("Loading posts…", false);

    var listQuery =
      '*[_type == "post" && defined(slug.current) && publishedAt <= now()] ' +
      "| order(publishedAt desc) [$start...$end]" +
      '{title,"slug":slug.current,publishedAt,excerpt,"imageUrl":mainImage.asset->url}';
    var countQuery = 'count(*[_type == "post" && defined(slug.current) && publishedAt <= now()])';
    var combinedQuery = '{"posts":' + listQuery + ',"total":' + countQuery + "}";
    var url = buildUrl(combinedQuery, { start: start, end: start + BATCH_SIZE });

    fetch(url)
      .then(function (response) {
        if (!response.ok) throw new Error("Request failed with status " + response.status);
        return response.json();
      })
      .then(function (data) {
        var result = (data && data.result) || {};
        var posts = result.posts || [];
        var total = result.total || 0;

        if (start === 0 && posts.length === 0) {
          setState("No blog posts yet — check back soon!", false);
          if (loadMoreWrap) loadMoreWrap.hidden = true;
          return;
        }

        setState("", false);
        posts.forEach(function (post) {
          gridEl.insertAdjacentHTML("beforeend", cardHtml(post));
        });
        start += posts.length;

        if (loadMoreWrap) loadMoreWrap.hidden = start >= total;
        setLoadMoreBusy(false);
      })
      .catch(function () {
        setState("Something went wrong loading blog posts. Please try again shortly.", true);
        setLoadMoreBusy(false);
      })
      .finally(function () {
        loading = false;
      });
  }

  if (loadMoreBtn) {
    loadMoreBtn.addEventListener("click", loadBatch);
  }

  loadBatch();
})();
