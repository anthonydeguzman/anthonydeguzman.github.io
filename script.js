document.addEventListener("DOMContentLoaded", function () {
  // Mobile menu toggle
  const mobileMenuBtn = document.querySelector(".mobile-menu-btn");
  const mobileNav = document.querySelector(".mobile-nav");

  mobileMenuBtn.addEventListener("click", function () {
    this.classList.toggle("active");
    mobileNav.classList.toggle("active");
  });

  // Close mobile menu when clicking a nav link
  const mobileNavLinks = document.querySelectorAll(".mobile-nav a");

  mobileNavLinks.forEach((link) => {
    link.addEventListener("click", function () {
      mobileMenuBtn.classList.remove("active");
      mobileNav.classList.remove("active");
    });
  });

  // Expand timeline
  const expandTimelineBtn = document.querySelector(".expand-timeline");
  const hiddenTimelineItems = document.querySelectorAll(
    ".timeline-item.hidden"
  );

  if (expandTimelineBtn) {
    expandTimelineBtn.addEventListener("click", function () {
      hiddenTimelineItems.forEach((item) => {
        item.classList.toggle("hidden");
      });

      if (this.textContent.includes("See more")) {
        this.innerHTML =
          'See less experience <span class="icon-chevron-up"></span>';
      } else {
        this.innerHTML =
          'See more experience <span class="icon-chevron-down"></span>';
      }
    });
  }

  // Active navigation highlighting
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".desktop-nav a");

  function highlightNavLink() {
    const scrollY = window.pageYOffset;

    sections.forEach((section) => {
      const sectionTop = section.offsetTop - 100;
      const sectionHeight = section.offsetHeight;
      const sectionId = section.getAttribute("id");

      if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
        navLinks.forEach((link) => {
          link.classList.remove("active");
          if (link.getAttribute("href") === `#${sectionId}`) {
            link.classList.add("active");
          }
        });
      }
    });
  }

  window.addEventListener("scroll", highlightNavLink);

  // Add smooth scrolling for all anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();

      const targetId = this.getAttribute("href");

      if (targetId === "#") return;

      const targetElement = document.querySelector(targetId);

      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 80,
          behavior: "smooth",
        });
      }
    });
  });
});
