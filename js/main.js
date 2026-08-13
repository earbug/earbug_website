/* =========================================================
   Earbug Marketing Site — Shared Behaviour
   Mobile nav, dropdown submenus, scroll-reveal animation,
   and the "Get the App" modal with platform toggle.
   ========================================================= */
(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- Mobile nav toggle ---------------- */
  var navToggle = document.querySelector("[data-nav-toggle]");
  var primaryNav = document.querySelector("[data-primary-nav]");

  if (navToggle && primaryNav) {
    navToggle.addEventListener("click", function () {
      var isOpen = primaryNav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
      document.body.style.overflow = isOpen ? "hidden" : "";
    });

    // Close mobile nav when a plain link is clicked
    primaryNav.querySelectorAll("a.nav-link").forEach(function (link) {
      link.addEventListener("click", function () {
        primaryNav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      });
    });
  }

  /* ---------------- Dropdown submenus (Features / Platforms) ---------------- */
  var submenuParents = document.querySelectorAll(".has-submenu");

  submenuParents.forEach(function (parent) {
    var trigger = parent.querySelector(".nav-link");
    if (!trigger) return;

    trigger.addEventListener("click", function (event) {
      // On small screens (where hover doesn't apply) treat as toggle
      if (window.innerWidth <= 860) {
        event.preventDefault();
        var expanded = parent.getAttribute("aria-expanded") === "true";

        // Close sibling submenus
        submenuParents.forEach(function (sibling) {
          if (sibling !== parent) sibling.setAttribute("aria-expanded", "false");
        });

        parent.setAttribute("aria-expanded", String(!expanded));
      }
    });

    // Close on Escape
    parent.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        parent.setAttribute("aria-expanded", "false");
        trigger.focus();
      }
    });
  });

  // Close any open submenu when clicking outside (desktop keyboard use)
  document.addEventListener("click", function (event) {
    submenuParents.forEach(function (parent) {
      if (!parent.contains(event.target)) {
        parent.setAttribute("aria-expanded", "false");
      }
    });
  });

  /* ---------------- Scroll-reveal animation ---------------- */
  var revealEls = document.querySelectorAll(".reveal");

  if (revealEls.length) {
    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      revealEls.forEach(function (el) { el.classList.add("is-visible"); });
    } else {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
      );
      revealEls.forEach(function (el) { observer.observe(el); });
    }
  }

  /* ---------------- "Get the App" modal ---------------- */
  var modalOverlay = document.querySelector("[data-app-modal]");
  var modalOpenButtons = document.querySelectorAll("[data-open-app-modal]");
  var modalCloseButtons = document.querySelectorAll("[data-close-app-modal]");
  var lastFocusedEl = null;

  function openModal() {
    if (!modalOverlay) return;
    lastFocusedEl = document.activeElement;
    modalOverlay.classList.add("is-open");
    modalOverlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    var firstFocusable = modalOverlay.querySelector("button, a[href]");
    if (firstFocusable) firstFocusable.focus();
  }

  function closeModal() {
    if (!modalOverlay) return;
    modalOverlay.classList.remove("is-open");
    modalOverlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lastFocusedEl) lastFocusedEl.focus();
  }

  modalOpenButtons.forEach(function (btn) {
    btn.addEventListener("click", openModal);
  });
  modalCloseButtons.forEach(function (btn) {
    btn.addEventListener("click", closeModal);
  });

  if (modalOverlay) {
    modalOverlay.addEventListener("click", function (event) {
      if (event.target === modalOverlay) closeModal();
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && modalOverlay.classList.contains("is-open")) {
        closeModal();
      }
    });
  }

  /* ---------------- Platform toggle inside modal ---------------- */
  var toggleButtons = document.querySelectorAll("[data-platform-toggle]");
  var storeSections = document.querySelectorAll("[data-store-section]");

  toggleButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var platform = btn.getAttribute("data-platform-toggle");

      toggleButtons.forEach(function (b) {
        var isActive = b === btn;
        b.classList.toggle("is-active", isActive);
        b.setAttribute("aria-selected", String(isActive));
      });

      storeSections.forEach(function (section) {
        var match = section.getAttribute("data-store-section") === platform;
        section.hidden = !match;
      });
    });
  });

  /* ---------------- "Notify me" waitlist forms (YouTube Music / Spotify) ---------------- */
  var NOTIFY_ENDPOINT = "https://2jlitvh7hm6iok4twr7xbe2um40sbevm.lambda-url.us-east-2.on.aws/";

  document.querySelectorAll("[data-notify-panel]").forEach(function (panel) {
    var platform = panel.getAttribute("data-notify-panel");
    var introEl = panel.querySelector("[data-notify-intro]");
    var startBtn = panel.querySelector("[data-notify-start]");
    var formEl = panel.querySelector("[data-notify-form]");
    var emailInput = formEl ? formEl.querySelector('input[type="email"]') : null;
    var honeypotInput = formEl ? formEl.querySelector(".notify-honeypot") : null;
    var submitBtn = formEl ? formEl.querySelector(".notify-submit") : null;
    var messageEl = panel.querySelector("[data-notify-message]");

    if (!introEl || !startBtn || !formEl || !emailInput || !submitBtn) return;

    function showMessage(text, isError) {
      if (!messageEl) return;
      messageEl.hidden = false;
      messageEl.textContent = text;
      messageEl.classList.toggle("is-error", !!isError);
    }

    startBtn.addEventListener("click", function () {
      introEl.hidden = true;
      formEl.hidden = false;
      emailInput.focus();
    });

    formEl.addEventListener("submit", function (event) {
      event.preventDefault();

      // Honeypot: real visitors never fill this hidden field in. If it's
      // filled, quietly act as if it worked rather than tipping off a bot.
      if (honeypotInput && honeypotInput.value) {
        formEl.hidden = true;
        showMessage("Thanks! We'll email you the moment it's ready.", false);
        return;
      }

      var email = emailInput.value.trim();
      if (!email) return;

      submitBtn.disabled = true;
      submitBtn.textContent = "Submitting…";
      if (messageEl) messageEl.hidden = true;

      fetch(NOTIFY_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, platform: platform }),
      })
        .then(function (response) {
          return response.json().then(function (data) {
            return { ok: response.ok, data: data };
          });
        })
        .then(function (result) {
          if (result.ok) {
            formEl.hidden = true;
            showMessage("Thanks! We'll email you the moment it's ready.", false);
          } else {
            showMessage((result.data && result.data.error) || "Something went wrong. Please try again.", true);
            submitBtn.disabled = false;
            submitBtn.textContent = "Submit";
          }
        })
        .catch(function () {
          showMessage("Something went wrong. Please check your connection and try again.", true);
          submitBtn.disabled = false;
          submitBtn.textContent = "Submit";
        });
    });
  });

  /* ---------------- Footer year ---------------- */
  var yearEl = document.querySelector("[data-current-year]");
  if (yearEl) {
    var specYear = 2026; // matches the spec's footer copyright year
    yearEl.textContent = String(Math.max(specYear, new Date().getFullYear()));
  }
})();
