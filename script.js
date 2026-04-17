const revealItems = document.querySelectorAll(".reveal");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const calendlyLinks = document.querySelectorAll("[data-calendly-link]");
const countupItems = document.querySelectorAll(".countup");
const stageSections = document.querySelectorAll("[data-stage-section]");
const stageSteps = document.querySelectorAll("[data-stage-step]");
let activeBookingTrigger = null;

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
          <p class="eyebrow">Book a session</p>
          <h2 id="booking-modal-title">Talk through your use case</h2>
          <p class="section-copy">Pick a time that works for you and I’ll come prepared to talk through your product, workflow, or launch question.</p>
        </div>
        <div class="booking-modal__frame-wrap">
          <iframe
            class="booking-modal__frame"
            title="Book a session with Rishabh Banga"
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
const bookingTitle = bookingModal ? bookingModal.querySelector("#booking-modal-title") : null;
const bookingBody = bookingModal ? bookingModal.querySelector(".booking-modal__intro .section-copy") : null;

function openBookingModal(url, trigger) {
  if (!bookingModal || !bookingFrame || !url) {
    return;
  }

  activeBookingTrigger = trigger || null;
  if (trigger && bookingTitle && bookingBody) {
    const title = trigger.getAttribute("data-booking-title");
    const body = trigger.getAttribute("data-booking-body");
    bookingTitle.textContent = title || "Talk through your use case";
    bookingBody.textContent = body || "Pick a time that works for you and I’ll come prepared to talk through your product, workflow, or launch question.";
  }
  bookingFrame.src = url;
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
  if (bookingFrame) {
    bookingFrame.src = "about:blank";
  }
  if (activeBookingTrigger) {
    activeBookingTrigger.focus();
    activeBookingTrigger = null;
  }
}

function animateCount(el, target, suffix, duration) {
  const start = performance.now();
  const update = (now) => {
    const p = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(ease * target) + suffix;
    if (p < 1) {
      requestAnimationFrame(update);
    }
  };
  requestAnimationFrame(update);
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
      el.textContent = `${target}${suffix}`;
      return;
    }
    animateCount(el, target, suffix, 900);
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

if (prefersReducedMotion || !("IntersectionObserver" in window)) {
  revealItems.forEach((item) => item.classList.add("is-visible"));
  countupItems.forEach((el) => {
    const target = Number(el.dataset.target || "0");
    const suffix = el.dataset.suffix || "";
    el.textContent = `${target}${suffix}`;
    el.dataset.counted = "true";
  });
  if (stageSections.length > 0) {
    setActiveStage(stageSections[0].dataset.stageSection);
  }
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

        setActiveStage(visible[0].target.dataset.stageSection);
      },
      {
        threshold: [0.35, 0.6, 0.85],
        rootMargin: "-18% 0px -38% 0px",
      }
    );

    stageSections.forEach((section) => stageObserver.observe(section));
  }
}

calendlyLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    const url = link.getAttribute("data-calendly-link");

    if (!url || url === "YOUR_CALENDLY_LINK_HERE") {
      return;
    }

    event.preventDefault();
    openBookingModal(url, link);
  });
});

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
