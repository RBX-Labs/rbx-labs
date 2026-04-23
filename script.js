const revealItems = document.querySelectorAll(".reveal");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
let activeBookingTrigger = null;
let userIsScrolling = false;
let scrollResumeTimeoutId = null;
const autoplayControllers = [];

function applyDisplaySettings(theme, contrast) {
  if (theme === "light" || theme === "dark") {
    document.documentElement.dataset.theme = theme;
  }

  document.documentElement.dataset.contrast = contrast === "high" ? "high" : "standard";

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
        if (this.intervalId !== null || userIsScrolling) {
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

    window.setInterval(() => {
      activeIndex = (activeIndex + 1) % cards.length;
      activateCard(activeIndex);
    }, 3000);
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

  window.setInterval(() => {
    activeIndex = (activeIndex + 1) % heroSocialProofItems.length;
    activateItem(activeIndex);
  }, 1500);
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

applyDisplaySettings(document.documentElement.dataset.theme, document.documentElement.dataset.contrast);

if (serviceSteps.length > 0 && servicePanels.length > 0) {
  setActiveService(serviceSteps[0].dataset.serviceStep);

  serviceSteps.forEach((step) => {
    step.addEventListener("click", () => {
      setActiveService(step.dataset.serviceStep);
    });
  });
}

if (prefersReducedMotion || !("IntersectionObserver" in window)) {
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
});
