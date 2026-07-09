const revealItems = document.querySelectorAll(".reveal");
const qaParams = new URLSearchParams(window.location.search);
const qaTheme = qaParams.get("qa_theme");
const qaContrast = qaParams.get("qa_contrast");
const qaStaticMode = qaParams.get("qa_static") === "1";
const qaVisualMode = qaParams.get("qa_visual");
const prefersReducedMotion = typeof window.matchMedia === "function"
  ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
  : false;
const themedLogoImages = document.querySelectorAll("[data-theme-logo]");
const calendlyLinks = document.querySelectorAll("[data-calendly-link]");
const countupItems = document.querySelectorAll(".countup");
const stageSections = document.querySelectorAll("[data-stage-section]");
const stageSteps = document.querySelectorAll("[data-stage-step]");
const autoplayTracks = document.querySelectorAll("[data-track-autoplay]");
const serviceSteps = document.querySelectorAll("[data-service-step]");
const servicePanels = document.querySelectorAll("[data-service-panel]");
const themeButtons = document.querySelectorAll("[data-theme-option]");
const contrastButtons = document.querySelectorAll("[data-contrast-option]");
const holoRotatingGrids = document.querySelectorAll("[data-holo-rotate]");
const heroSocialProofItems = document.querySelectorAll(".hero-social-proof-item");
const animatedMediaVideos = document.querySelectorAll(".hero-asset-video, .telemetry-asset-video");
const autoScrollRails = document.querySelectorAll("[data-auto-scroll-rail]");
const bannerSlides = document.querySelectorAll("[data-banner-slideshow]");
const naturalFrameMedia = document.querySelectorAll(
  ".selected-build-training-media"
);
let activeBookingTrigger = null;
let userIsScrolling = false;
let scrollResumeTimeoutId = null;
const autoplayControllers = [];
const managedIntervalControllers = [];

function applyConnectionMode() {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!connection) {
    return;
  }

  const effectiveType = typeof connection.effectiveType === "string" ? connection.effectiveType : "";
  const saveData = connection.saveData === true;
  const isSlowType = /(^|-)2g$|3g/.test(effectiveType);
  if (saveData || isSlowType) {
    document.documentElement.dataset.connection = "slow";
  }
}

function ensureAnimatedMediaPlayback() {
  animatedMediaVideos.forEach((video) => {
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    const playAttempt = video.play();
    if (playAttempt && typeof playAttempt.catch === "function") {
      playAttempt.catch(() => {
        // Fallback mode keeps corresponding WebP visible when autoplay is blocked.
        document.documentElement.dataset.connection = "slow";
      });
    }
  });
}

function revealAllContentFallback() {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

function applyDisplaySettings(theme, contrast) {
  if (theme === "light" || theme === "dark") {
    document.documentElement.dataset.theme = theme;
  }

  document.documentElement.dataset.contrast = contrast === "high" ? "high" : "standard";
  themedLogoImages.forEach((img) => {
    const lightSrc = img.getAttribute("data-theme-logo-light");
    const darkSrc = img.getAttribute("data-theme-logo-dark");
    const nextSrc = document.documentElement.dataset.theme === "dark" && darkSrc ? darkSrc : lightSrc;
    if (nextSrc && img.getAttribute("src") !== nextSrc) {
      img.setAttribute("src", nextSrc);
    }
  });

  themeButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.getAttribute("data-theme-option") === document.documentElement.dataset.theme));
  });

  contrastButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.getAttribute("data-contrast-option") === document.documentElement.dataset.contrast));
  });
}

function buildBookingModal() {
  const modal = document.createElement("div");
  modal.className = "booking-modal";
  modal.setAttribute("hidden", "");
  modal.innerHTML = `
    <div class="booking-modal__backdrop" data-booking-close></div>
    <div class="booking-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="booking-modal-title">
      <button class="booking-modal__close" type="button" aria-label="Close booking" data-booking-close>
        <span aria-hidden="true">×</span>
      </button>
      <div class="booking-modal__shell">
        <div class="booking-modal__intro">
          <p class="eyebrow booking-modal__eyebrow">Book a session</p>
          <h2 id="booking-modal-title">Talk through your use case</h2>
          <p class="section-copy">Pick a time that works for you and use the session to talk through your product, workflow, or launch question.</p>
        </div>
        <div class="booking-modal__frame-wrap">
          <iframe
            class="booking-modal__frame"
            title="Book a session with RBX Labs"
            loading="lazy"
            referrerpolicy="strict-origin-when-cross-origin"
          ></iframe>
        </div>
      </div>
    </div>
  `;

  document.body.append(modal);
  return modal;
}

const bookingModal = calendlyLinks.length > 0 ? buildBookingModal() : null;
const bookingFrame = bookingModal ? bookingModal.querySelector(".booking-modal__frame") : null;
const bookingEyebrow = bookingModal ? bookingModal.querySelector(".booking-modal__eyebrow") : null;
const bookingTitle = bookingModal ? bookingModal.querySelector("#booking-modal-title") : null;
const bookingBody = bookingModal ? bookingModal.querySelector(".booking-modal__intro .section-copy") : null;
const defaultBookingUrl = calendlyLinks.length > 0 ? calendlyLinks[0].getAttribute("data-calendly-link") || "" : "";
let bookingFrameLoadedUrl = "";

function ensureBookingFrameLoaded(url) {
  if (!bookingFrame || !url || bookingFrameLoadedUrl === url) {
    return;
  }

  bookingFrame.src = url;
  bookingFrameLoadedUrl = url;
}

function warmBookingModal() {
  if (!defaultBookingUrl || defaultBookingUrl === "YOUR_CALENDLY_LINK_HERE") {
    return;
  }

  ensureBookingFrameLoaded(defaultBookingUrl);
}

function openBookingModal(url, trigger) {
  if (!bookingModal || !bookingFrame || !url) {
    return;
  }

  activeBookingTrigger = trigger || null;
  if (trigger && bookingEyebrow && bookingTitle && bookingBody) {
    const eyebrow = trigger.getAttribute("data-booking-eyebrow");
    const title = trigger.getAttribute("data-booking-title");
    const body = trigger.getAttribute("data-booking-body");
    bookingEyebrow.textContent = eyebrow || "Book a session";
    bookingTitle.textContent = title || "Talk through your use case";
    bookingBody.textContent = body || "Pick a time that works for you and use the session to talk through your product, workflow, or launch question.";
  }
  ensureBookingFrameLoaded(url);
  bookingModal.hidden = false;
  document.body.classList.add("booking-modal-open");
  bookingModal.querySelector(".booking-modal__close").focus();
}

function closeBookingModal() {
  if (!bookingModal || bookingModal.hidden) {
    return;
  }

  bookingModal.hidden = true;
  document.body.classList.remove("booking-modal-open");
  if (activeBookingTrigger) {
    activeBookingTrigger.focus();
    activeBookingTrigger = null;
  }
}

function animateCount(el, target, suffix, duration) {
  const start = performance.now();
  const decimals = Number(el.dataset.decimals || "0");
  renderCountValue(el, decimals > 0 ? (0).toFixed(decimals) : "0", suffix);
  const update = (now) => {
    const p = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    const value = ease * target;
    const rounded = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();
    renderCountValue(el, rounded, suffix);
    if (p < 1) {
      requestAnimationFrame(update);
    }
  };
  requestAnimationFrame(update);
}

function formatCountValue(value) {
  if (!/^-?\d+(\.\d+)?$/.test(value)) {
    return value;
  }

  const [integerPart, decimalPart] = value.split(".");
  const formattedInteger = Number(integerPart).toLocaleString("en-US");
  return decimalPart ? `${formattedInteger}.${decimalPart}` : formattedInteger;
}

function renderCountValue(el, value, suffix) {
  const formattedValue = formatCountValue(value);
  const suffixClass = el.dataset.suffixClass;
  if (suffixClass && suffix) {
    el.innerHTML = `${formattedValue}<span class="${suffixClass}">${suffix}</span>`;
    return;
  }
  el.textContent = `${formattedValue}${suffix}`;
}

function triggerCountups(container) {
  const scoped = container.querySelectorAll(".countup");
  scoped.forEach((el) => {
    if (el.dataset.counted === "true") {
      return;
    }
    const target = Number(el.dataset.target || "0");
    const suffix = el.dataset.suffix || "";
    el.dataset.counted = "true";
    if (prefersReducedMotion) {
      const decimals = Number(el.dataset.decimals || "0");
      const value = decimals > 0 ? target.toFixed(decimals) : `${target}`;
      renderCountValue(el, value, suffix);
      return;
    }
    animateCount(el, target, suffix, 1200);
  });
}

function setActiveStage(stageName) {
  if (!stageName) {
    return;
  }

  stageSteps.forEach((step) => {
    const isActive = step.dataset.stageStep === stageName;
    step.classList.toggle("active", isActive);
    if (isActive) {
      step.setAttribute("aria-current", "step");
    } else {
      step.removeAttribute("aria-current");
    }
  });
}

function startTrackAutoplay() {
  autoplayTracks.forEach((track) => {
    const steps = Array.from(track.querySelectorAll("[data-track-step]"));
    if (steps.length < 2) {
      return;
    }

    let activeIndex = Math.max(steps.findIndex((step) => step.classList.contains("active")), 0);

    const activateStep = (index) => {
      steps.forEach((step, stepIndex) => {
        const isActive = stepIndex === index;
        step.classList.toggle("active", isActive);
        if (isActive) {
          step.setAttribute("aria-current", "step");
        } else {
          step.removeAttribute("aria-current");
        }
      });
    };

    activateStep(activeIndex);

    if (prefersReducedMotion) {
      return;
    }

    const controller = {
      intervalId: null,
      pause() {
        if (this.intervalId !== null) {
          window.clearInterval(this.intervalId);
          this.intervalId = null;
        }
      },
      resume() {
        if (this.intervalId !== null || userIsScrolling || document.hidden) {
          return;
        }

        this.intervalId = window.setInterval(() => {
          activeIndex = (activeIndex + 1) % steps.length;
          activateStep(activeIndex);
        }, 2200);
      },
    };

    controller.resume();
    autoplayControllers.push(controller);
  });
}

function pauseTrackAutoplay() {
  autoplayControllers.forEach((controller) => controller.pause());
}

function resumeTrackAutoplay() {
  autoplayControllers.forEach((controller) => controller.resume());
}

function scheduleAutoplayResume() {
  if (scrollResumeTimeoutId !== null) {
    window.clearTimeout(scrollResumeTimeoutId);
  }

  scrollResumeTimeoutId = window.setTimeout(() => {
    userIsScrolling = false;
    resumeTrackAutoplay();
  }, 4000);
}

function createManagedInterval(callback, durationMs) {
  const controller = {
    intervalId: null,
    pause() {
      if (this.intervalId !== null) {
        window.clearInterval(this.intervalId);
        this.intervalId = null;
      }
    },
    resume() {
      if (this.intervalId !== null || document.hidden || prefersReducedMotion) {
        return;
      }
      this.intervalId = window.setInterval(callback, durationMs);
    },
  };
  managedIntervalControllers.push(controller);
  return controller;
}

function pauseManagedIntervals() {
  managedIntervalControllers.forEach((controller) => controller.pause());
}

function resumeManagedIntervals() {
  managedIntervalControllers.forEach((controller) => controller.resume());
}

function startHoloRotation() {
  holoRotatingGrids.forEach((grid) => {
    const cards = Array.from(grid.querySelectorAll(".result-card"));
    if (cards.length < 2) {
      return;
    }

    let activeIndex = Math.max(cards.findIndex((card) => card.classList.contains("result-card-featured")), 0);

    const activateCard = (index) => {
      cards.forEach((card, cardIndex) => {
        card.classList.toggle("result-card-featured", cardIndex === index);
      });
    };

    activateCard(activeIndex);

    if (prefersReducedMotion) {
      return;
    }

    const controller = createManagedInterval(() => {
      activeIndex = (activeIndex + 1) % cards.length;
      activateCard(activeIndex);
    }, 3000);
    controller.resume();
  });
}

function startHeroSocialProofRotation() {
  if (heroSocialProofItems.length === 0) {
    return;
  }

  let activeIndex = 0;

  const activateItem = (index) => {
    heroSocialProofItems.forEach((item, itemIndex) => {
      item.classList.toggle("is-active", itemIndex === index);
    });
  };

  activateItem(activeIndex);

  if (prefersReducedMotion) {
    return;
  }

  const controller = createManagedInterval(() => {
    activeIndex = (activeIndex + 1) % heroSocialProofItems.length;
    activateItem(activeIndex);
  }, 1500);
  controller.resume();
}

function getNaturalFrameSource(root) {
  if (!root) {
    return null;
  }

  if (root.classList.contains("selected-build-training-media")) {
    const activeSlide = root.querySelector(".training-banner-slide.is-active");
    if (activeSlide) {
      return activeSlide;
    }
  }

  return root.querySelector("img");
}

function updateNaturalFrameAspect(root, source) {
  if (!root || !source) {
    return;
  }

  const width = source.naturalWidth || source.width || 16;
  const height = source.naturalHeight || source.height || 9;
  root.style.setProperty("--natural-frame-aspect", `${width} / ${height}`);
}

function startNaturalFrameMedia() {
  naturalFrameMedia.forEach((root) => {
    if (root.dataset.naturalFrameReady === "true") {
      return;
    }

    const images = Array.from(root.querySelectorAll("img"));
    if (images.length === 0) {
      return;
    }

    root.dataset.naturalFrameReady = "true";

    const refresh = () => {
      updateNaturalFrameAspect(root, getNaturalFrameSource(root));
    };

    images.forEach((image) => {
      if (image.complete && image.naturalWidth > 0) {
        return;
      }

      image.addEventListener("load", refresh, { once: true });
    });

    refresh();
  });
}

function startBannerSlides() {
  bannerSlides.forEach((panel) => {
    const slides = Array.from(panel.querySelectorAll(".training-banner-slide"));
    if (slides.length < 2) {
      return;
    }

    let activeIndex = Math.max(slides.findIndex((slide) => slide.classList.contains("is-active")), 0);

    const updatePanelAspect = (slide) => {
      if (!slide) {
        return;
      }

      const width = slide.naturalWidth || 16;
      const height = slide.naturalHeight || 9;
      panel.style.setProperty("--natural-frame-aspect", `${width} / ${height}`);
    };

    const activateSlide = (index) => {
      slides.forEach((slide, slideIndex) => {
        slide.classList.toggle("is-active", slideIndex === index);
      });
      updatePanelAspect(slides[index]);
    };

    slides.forEach((slide) => {
      if (slide.complete && slide.naturalWidth > 0) {
        return;
      }

      slide.addEventListener("load", () => {
        if (slide.classList.contains("is-active")) {
          updatePanelAspect(slide);
        }
      }, { once: true });
    });

    activateSlide(activeIndex);

    if (prefersReducedMotion) {
      return;
    }

    const controller = createManagedInterval(() => {
      activeIndex = (activeIndex + 1) % slides.length;
      activateSlide(activeIndex);
    }, 4000);
    controller.resume();
  });
}

function prepareAutoScrollRail(rail) {
  const track = rail.querySelector("[data-auto-scroll-track]");
  if (!track || track.dataset.autoScrollReady === "true") {
    return null;
  }

  const originalItems = Array.from(track.children);
  if (originalItems.length < 2) {
    return null;
  }

  track.dataset.autoScrollReady = "true";

  let maxScroll = 0;
  const measure = () => {
    maxScroll = Math.max(track.scrollWidth - rail.clientWidth, 0);
  };

  measure();
  window.addEventListener("resize", measure, { passive: true });

  if (prefersReducedMotion) {
    return null;
  }

  const direction = rail.dataset.autoScrollDirection === "reverse" ? -1 : 1;
  const speed = Number(rail.dataset.autoScrollSpeed || "0.45");

  if (direction < 0) {
    rail.scrollLeft = maxScroll;
  }

  const controller = createManagedInterval(() => {
    if (maxScroll <= 0) {
      measure();
      if (maxScroll <= 0) {
        return;
      }
    }

    rail.scrollLeft += speed * direction;

    if (direction > 0 && rail.scrollLeft >= maxScroll) {
      rail.scrollLeft = 0;
    } else if (direction < 0 && rail.scrollLeft <= 0) {
      rail.scrollLeft = maxScroll;
    }
  }, 16);
  controller.resume();

  rail.addEventListener("mouseenter", () => controller.pause());
  rail.addEventListener("mouseleave", () => controller.resume());
  rail.addEventListener("focusin", () => controller.pause());
  rail.addEventListener("focusout", () => {
    if (!rail.contains(document.activeElement)) {
      controller.resume();
    }
  });

  return controller;
}

function startAutoScrollRails() {
  autoScrollRails.forEach((rail) => {
    prepareAutoScrollRail(rail);
  });
}

function setActiveService(serviceName) {
  if (!serviceName) {
    return;
  }

  serviceSteps.forEach((step) => {
    const isActive = step.dataset.serviceStep === serviceName;
    step.classList.toggle("active", isActive);
    step.setAttribute("aria-pressed", String(isActive));
  });

  servicePanels.forEach((panel) => {
    panel.hidden = panel.dataset.servicePanel !== serviceName;
  });
}

try {
  if (qaVisualMode === "png" || qaVisualMode === "svg") {
    document.documentElement.dataset.qaVisual = qaVisualMode;
  }

  if (qaTheme === "light" || qaTheme === "dark") {
    document.documentElement.dataset.theme = qaTheme;
  }
  if (qaContrast === "high" || qaContrast === "standard") {
    document.documentElement.dataset.contrast = qaContrast;
  }

  document.documentElement.dataset.js = "ready";
  applyConnectionMode();
  ensureAnimatedMediaPlayback();

  applyDisplaySettings(document.documentElement.dataset.theme, document.documentElement.dataset.contrast);

  if (serviceSteps.length > 0 && servicePanels.length > 0) {
  setActiveService(serviceSteps[0].dataset.serviceStep);

  serviceSteps.forEach((step) => {
    step.addEventListener("click", () => {
      setActiveService(step.dataset.serviceStep);
    });
  });
}

if (qaStaticMode || prefersReducedMotion || !("IntersectionObserver" in window)) {
  revealItems.forEach((item) => item.classList.add("is-visible"));
  countupItems.forEach((el) => {
    const target = Number(el.dataset.target || "0");
    const suffix = el.dataset.suffix || "";
    const decimals = Number(el.dataset.decimals || "0");
    const value = decimals > 0 ? target.toFixed(decimals) : `${target}`;
    el.textContent = `${value}${suffix}`;
    el.dataset.counted = "true";
  });
  if (stageSections.length > 0) {
    setActiveStage(stageSections[0].dataset.stageSection);
  }
  startTrackAutoplay();
} else {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-visible");
        triggerCountups(entry.target);
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.1,
      rootMargin: "0px 0px -8% 0px",
    }
  );

  revealItems.forEach((item) => revealObserver.observe(item));

  if (stageSections.length > 0 && stageSteps.length > 0) {
    const stageObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible.length === 0) {
          return;
        }

        userIsScrolling = true;
        pauseTrackAutoplay();
        scheduleAutoplayResume();
        setActiveStage(visible[0].target.dataset.stageSection);
      },
      {
        threshold: [0.35, 0.6, 0.85],
        rootMargin: "-18% 0px -38% 0px",
      }
    );

    stageSections.forEach((section) => stageObserver.observe(section));
  }

  startTrackAutoplay();
}

if (stageSections.length > 0 && autoplayTracks.length > 0) {
  window.addEventListener(
    "scroll",
    () => {
      userIsScrolling = true;
      pauseTrackAutoplay();
      scheduleAutoplayResume();
    },
    { passive: true }
  );
}

  startHoloRotation();
  startHeroSocialProofRotation();
  startNaturalFrameMedia();
  startBannerSlides();
  startAutoScrollRails();

calendlyLinks.forEach((link) => {
  link.addEventListener(
    "pointerenter",
    () => {
      warmBookingModal();
    },
    { once: true }
  );
  link.addEventListener(
    "focus",
    () => {
      warmBookingModal();
    },
    { once: true }
  );
  link.addEventListener("click", (event) => {
    const url = link.getAttribute("data-calendly-link");

    if (!url || url === "YOUR_CALENDLY_LINK_HERE") {
      return;
    }

    event.preventDefault();
    openBookingModal(url, link);
  });
});

if (bookingModal && defaultBookingUrl && defaultBookingUrl !== "YOUR_CALENDLY_LINK_HERE") {
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(() => {
      warmBookingModal();
    }, { timeout: 2500 });
  } else {
    window.setTimeout(() => {
      warmBookingModal();
    }, 1200);
  }
}

if (bookingModal) {
  bookingModal.addEventListener("click", (event) => {
    if (event.target instanceof HTMLElement && event.target.hasAttribute("data-booking-close")) {
      closeBookingModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeBookingModal();
    }
  });
}

themeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const theme = button.getAttribute("data-theme-option");
    if (!theme) {
      return;
    }

    localStorage.setItem("rbx-theme", theme);
    applyDisplaySettings(theme, document.documentElement.dataset.contrast);
  });
});

contrastButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const contrast = button.getAttribute("data-contrast-option");
    if (!contrast) {
      return;
    }

    localStorage.setItem("rbx-contrast", contrast);
    applyDisplaySettings(document.documentElement.dataset.theme, contrast);
  });
});

  window.addEventListener("beforeunload", () => {
    if (scrollResumeTimeoutId !== null) {
      window.clearTimeout(scrollResumeTimeoutId);
    }

    pauseTrackAutoplay();
    pauseManagedIntervals();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      pauseTrackAutoplay();
      pauseManagedIntervals();
      if (scrollResumeTimeoutId !== null) {
        window.clearTimeout(scrollResumeTimeoutId);
      }
      return;
    }

    if (!userIsScrolling) {
      resumeTrackAutoplay();
    }
    resumeManagedIntervals();
  });

  // Safety net: if sections remain hidden due to partial init/cached script mismatch,
  // unhide them after first paint window.
  window.setTimeout(() => {
    const hasVisibleReveal = Array.from(revealItems).some((item) => item.classList.contains("is-visible"));
    if (!hasVisibleReveal && revealItems.length > 0) {
      document.documentElement.removeAttribute("data-js");
      revealAllContentFallback();
    }
  }, 1200);
} catch (error) {
  document.documentElement.removeAttribute("data-js");
  revealAllContentFallback();
  console.error("Network Guardian init failed; falling back to static render.", error);
}
