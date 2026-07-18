(function () {
  'use strict';

  // ===================================================================
  // Order form delivery — sends straight to Telegram from the browser.
  //
  // Accepted trade-off (chosen deliberately over the Cloudflare Worker
  // proxy in cloudflare-worker/): the bot token below IS visible to
  // anyone who opens dev tools on this public site. The blast radius if
  // someone grabs it is limited to spamming this bot's own group — no
  // customer data, no money, nothing else is reachable with it. If that
  // ever happens, revoke it instantly via @BotFather -> /revoke and paste
  // the new token here. See cloudflare-worker/README.md if you'd rather
  // switch to the fully-hidden version later.
  // ===================================================================
  var TELEGRAM_BOT_TOKEN = '8951364593:AAGViIz0fjWeA0kVLhABXx5zsbGnwGVR2W0';
  var TELEGRAM_CHAT_ID = '-5491949453';

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

  // Order form modal ("Замовити" / "Замовити комплект" buttons)
  var orderModal = document.getElementById('order-modal');
  if (orderModal) {
    var orderFormView = document.getElementById('order-form-view');
    var orderSuccessView = document.getElementById('order-success-view');
    var orderForm = document.getElementById('order-form');
    var orderNameInput = document.getElementById('order-name');
    var orderPhoneInput = document.getElementById('order-phone');
    var orderProductLabel = document.getElementById('order-modal-product');
    var orderError = document.getElementById('order-error');
    var orderSubmitBtn = orderForm.querySelector('.order-submit');
    var orderSubmitLabel = orderForm.querySelector('.order-submit-label');
    var orderModalClose = document.getElementById('order-modal-close');
    var orderSuccessClose = document.getElementById('order-success-close');
    var currentProduct = '';
    var orderLastFocused = null;

    function openOrderModal(product) {
      currentProduct = product || '';
      orderProductLabel.textContent = currentProduct;
      orderError.hidden = true;
      orderForm.reset();
      orderFormView.hidden = false;
      orderSuccessView.hidden = true;
      orderLastFocused = document.activeElement;
      orderModal.hidden = false;
      document.body.style.overflow = 'hidden';
      orderNameInput.focus();
    }

    function closeOrderModal() {
      orderModal.hidden = true;
      document.body.style.overflow = '';
      if (orderLastFocused) orderLastFocused.focus();
    }

    document.querySelectorAll('[data-order-open]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openOrderModal(btn.getAttribute('data-order-product'));
      });
    });

    orderModalClose.addEventListener('click', closeOrderModal);
    orderSuccessClose.addEventListener('click', closeOrderModal);
    orderModal.addEventListener('click', function (e) {
      if (e.target === orderModal) closeOrderModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !orderModal.hidden) closeOrderModal();
    });

    orderForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = orderNameInput.value.trim();
      var phone = orderPhoneInput.value.trim();
      var honeypot = orderForm.querySelector('[name="website"]');

      if (honeypot && honeypot.value) return; // bot filled the trap field — silently drop

      if (!name || !phone) {
        orderError.textContent = "Будь ласка, заповніть ім'я та телефон.";
        orderError.hidden = false;
        return;
      }
      if (phone.replace(/\D/g, '').length < 9) {
        orderError.textContent = 'Перевірте номер телефону.';
        orderError.hidden = false;
        return;
      }

      orderError.hidden = true;
      orderSubmitBtn.disabled = true;
      orderSubmitLabel.textContent = 'Надсилаємо…';

      var showSuccess = function () {
        orderFormView.hidden = true;
        orderSuccessView.hidden = false;
        orderSubmitBtn.disabled = false;
        orderSubmitLabel.textContent = 'Надіслати заявку';
      };

      if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        // Not configured yet — don't block the user, just log locally.
        console.warn('Telegram bot token/chat id not set yet — order not delivered:', { name: name, phone: phone, product: currentProduct });
        showSuccess();
        return;
      }

      var text = '🛒 Нова заявка з сайту\n' +
        "Ім'я: " + name + '\n' +
        'Телефон: ' + phone + '\n' +
        'Товар: ' + (currentProduct || '—');

      fetch('https://api.telegram.org/bot' + TELEGRAM_BOT_TOKEN + '/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: text })
      })
        .then(function (res) {
          if (!res.ok) throw new Error('Telegram API error');
          showSuccess();
        })
        .catch(function () {
          orderSubmitBtn.disabled = false;
          orderSubmitLabel.textContent = 'Надіслати заявку';
          orderError.textContent = 'Не вдалося надіслати заявку. Напишіть нам у Telegram або зателефонуйте, будь ласка.';
          orderError.hidden = false;
        });
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
    '.review-shot, .faq-item, .compat-strip, .assortment, .autonomy-strip'
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
