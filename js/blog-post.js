/* =========================================================
   Earbug Blog — single post page
   Reads ?slug= from the URL, fetches that post from Sanity,
   and renders it — including the Portable Text body — into
   the page.
   ========================================================= */
import { toHTML, uriLooksSafe } from "https://esm.sh/@portabletext/to-html@5.0.3";

(function () {
  "use strict";

  var PROJECT_ID = "udb0lqxn";
  var DATASET = "production";
  var API_VERSION = "2024-06-01";
  var API_BASE = "https://" + PROJECT_ID + ".apicdn.sanity.io/v" + API_VERSION + "/data/query/" + DATASET;

  var containerEl = document.querySelector("[data-blog-post-container]");
  var stateEl = document.querySelector("[data-blog-post-state]");
  if (!containerEl) return;

  var titleEl = containerEl.querySelector("[data-blog-post-title]");
  var metaEl = containerEl.querySelector("[data-blog-post-meta]");
  var imageEl = containerEl.querySelector("[data-blog-post-image]");
  var bodyEl = containerEl.querySelector("[data-blog-post-body]");

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

  // Sanity image asset refs look like "image-<assetId>-<width>x<height>-<format>".
  // We can build a CDN URL from that pattern directly, without an image-url library.
  function imageUrlFromRef(ref) {
    var match = /^image-([a-f0-9]+)-(\d+x\d+)-(\w+)$/.exec(ref || "");
    if (!match) return null;
    return "https://cdn.sanity.io/images/" + PROJECT_ID + "/" + DATASET + "/" + match[1] + "-" + match[2] + "." + match[3];
  }

  function showError(message) {
    containerEl.hidden = true;
    if (stateEl) {
      stateEl.hidden = false;
      stateEl.innerHTML =
        '<p>' + escapeHtml(message) + '</p><p><a href="blog.html">&larr; Back to Blog</a></p>';
    }
  }

  var slug = new URLSearchParams(window.location.search).get("slug");
  if (!slug) {
    showError("No blog post was specified.");
  } else {
    var query =
      '*[_type == "post" && slug.current == $slug && publishedAt <= now()][0]' +
      '{title,publishedAt,excerpt,"imageUrl":mainImage.asset->url,"imageAlt":mainImage.alt,body}';
    var url = buildUrl(query, { slug: slug });

    fetch(url)
      .then(function (response) {
        if (!response.ok) throw new Error("Request failed with status " + response.status);
        return response.json();
      })
      .then(function (data) {
        var post = data && data.result;
        if (!post) {
          showError("We couldn't find that blog post. It may have been moved or unpublished.");
          return;
        }
        renderPost(post);
      })
      .catch(function () {
        showError("Something went wrong loading this post. Please try again shortly.");
      });
  }

  function renderPost(post) {
    document.title = post.title + " — Earbug Blog";

    var descriptionTag = document.querySelector('meta[name="description"]');
    if (descriptionTag && post.excerpt) {
      descriptionTag.setAttribute("content", post.excerpt);
    }

    if (titleEl) titleEl.textContent = post.title;
    if (metaEl) metaEl.textContent = formatDate(post.publishedAt);

    if (imageEl) {
      if (post.imageUrl) {
        imageEl.src = post.imageUrl + "?w=1600&h=900&fit=crop&auto=format";
        imageEl.alt = post.imageAlt || "";
        imageEl.hidden = false;
      } else {
        imageEl.hidden = true;
      }
    }

    if (bodyEl) {
      bodyEl.innerHTML = toHTML(post.body || [], {
        components: {
          types: {
            image: function (props) {
              var value = props.value || {};
              var ref = value.asset && value.asset._ref;
              var src = imageUrlFromRef(ref);
              if (!src) return "";
              var alt = escapeHtml(value.alt || "");
              return '<img src="' + src + '?w=1200&auto=format" alt="' + alt + '" loading="lazy">';
            },
          },
          marks: {
            link: function (props) {
              var href = (props.value && props.value.href) || "";
              if (!uriLooksSafe(href)) return props.children;
              var rel = href.indexOf("/") === 0 ? "" : ' rel="noreferrer noopener"';
              return '<a href="' + escapeHtml(href) + '"' + rel + ">" + props.children + "</a>";
            },
          },
        },
        onMissingComponent: false,
      });
    }

    if (stateEl) stateEl.hidden = true;
    containerEl.hidden = false;
  }
})();
