(function () {
  'use strict';

  // Mobile nav toggle
  var header = document.querySelector('.site-header');
  var toggle = document.getElementById('nav-toggle');
  var nav = document.getElementById('main-nav');

  if (toggle && header) {
    toggle.addEventListener('click', function () {
      var expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      header.classList.toggle('nav-open', !expanded);
    });

    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        toggle.setAttribute('aria-expanded', 'false');
        header.classList.remove('nav-open');
      });
    });
  }

  // Respect reduced-motion: freeze hero video on its poster frame
  var heroVideo = document.querySelector('.hero-video');
  if (heroVideo) {
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    var applyMotionPref = function (mq) {
      if (mq.matches) {
        heroVideo.pause();
        heroVideo.removeAttribute('autoplay');
      } else {
        heroVideo.play().catch(function () {});
      }
    };
    applyMotionPref(reduceMotion);
    reduceMotion.addEventListener('change', applyMotionPref);
  }

  // Mobile sticky CTA: only show once the user has scrolled past the hero's own buttons
  var mobileCta = document.querySelector('.mobile-cta');
  var heroSection = document.querySelector('.hero');
  if (mobileCta && heroSection) {
    var toggleMobileCta = function () {
      var heroBottom = heroSection.getBoundingClientRect().bottom;
      mobileCta.classList.toggle('is-visible', heroBottom < 0);
    };
    toggleMobileCta();
    window.addEventListener('scroll', toggleMobileCta, { passive: true });
    window.addEventListener('resize', toggleMobileCta);
  }

  // Review screenshots lightbox
  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightbox-img');
  var lightboxClose = document.getElementById('lightbox-close');
  var lastFocused = null;

  function openLightbox(src, alt) {
    lastFocused = document.activeElement;
    lightboxImg.src = src;
    lightboxImg.alt = alt || '';
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
    lightboxClose.focus();
  }

  function closeLightbox() {
    lightbox.hidden = true;
    lightboxImg.src = '';
    document.body.style.overflow = '';
    if (lastFocused) lastFocused.focus();
  }

  document.querySelectorAll('[data-lightbox]').forEach(function (trigger) {
    trigger.addEventListener('click', function () {
      var img = trigger.querySelector('img');
      openLightbox(trigger.getAttribute('data-lightbox'), img ? img.alt : '');
    });
  });

  if (lightbox) {
    lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !lightbox.hidden) closeLightbox();
    });
  }

  // FAQ accordion
  document.querySelectorAll('.faq-question').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.closest('.faq-item');
      var isOpen = item.classList.contains('is-open');
      item.classList.toggle('is-open', !isOpen);
      btn.setAttribute('aria-expanded', String(!isOpen));
    });
  });

  // Scroll-reveal animations for cards and content blocks
  var revealTargets = document.querySelectorAll(
    '.feature-card, .trust-card, .product-card, .kit-card, .deye-reason, ' +
    '.review-shot, .faq-item, .compat-strip, .assortment'
  );
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (revealTargets.length && 'IntersectionObserver' in window && !prefersReducedMotion) {
    revealTargets.forEach(function (el) { el.classList.add('reveal'); });

    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    revealTargets.forEach(function (el) { revealObserver.observe(el); });
  }

  // Footer year
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Countdown to end of current week (Sunday 23:59 local time)
  var countdownEl = document.getElementById('countdown-text');
  if (countdownEl) {
    var now = new Date();
    var endOfWeek = new Date(now);
    var day = now.getDay(); // 0 = Sunday
    var daysUntilSunday = day === 0 ? 0 : 7 - day;
    endOfWeek.setDate(now.getDate() + daysUntilSunday);
    endOfWeek.setHours(23, 59, 0, 0);

    var diffMs = endOfWeek - now;
    var diffDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    function pluralDays(n) {
      if (n % 10 === 1 && n % 100 !== 11) return n + ' день';
      if ([2, 3, 4].indexOf(n % 10) !== -1 && [12, 13, 14].indexOf(n % 100) === -1) return n + ' дні';
      return n + ' днів';
    }

    countdownEl.textContent = diffDays <= 0 ? 'сьогодні' : 'ще ' + pluralDays(diffDays);
  }
})();
