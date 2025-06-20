(() => {
  // ---- Cached selectors ----
  const navbarContainer = document.getElementById('navbar-container');
  const footerContainer = document.getElementById('footer-container');
  const scrollTopBtn    = document.querySelector('.scroll-top');

  // ---- Helpers ----
  const getCurrent = () => ({
    page: window.location.pathname.split('/').pop() || 'index.html',
    hash: window.location.hash
  });

  function updateActiveLinks(page, hash) {
    const allLinks = document.querySelectorAll('.navbar-nav a, .sidebar-menu a');
    allLinks.forEach(link => {
      const href = link.getAttribute('href') || '';
      const [linkPage, linkHashRaw] = href.split('#');
      const linkHash = linkHashRaw ? `#${linkHashRaw}` : '';
      const matchesPage = (linkPage === '' || linkPage === page);
      const matchesHash = (linkHash === '' || linkHash === hash);
      link.classList.toggle('active', matchesPage && matchesHash);
    });
  }

  function initScrollSpy() {
    const { page } = getCurrent();
    if (page !== '' && page !== 'index.html') return;

    // collect targets & their nav links
    const sectionLinks = Array.from(
      document.querySelectorAll(
        '.navbar-nav a[href*="#"], .sidebar-menu a[href*="#"]'
      )
    ).map(link => ({
      id: link.hash.slice(1),
      element: document.getElementById(link.hash.slice(1)),
      link
    })).filter(item => item.element);

    if (!sectionLinks.length) return;

    const observer = new IntersectionObserver(entries => {
      entries.forEach(({ target, isIntersecting }) => {
        if (isIntersecting) {
          const id = target.id;
          sectionLinks.forEach(({ link, id: linkId }) =>
            link.classList.toggle('active', linkId === id)
          );
        }
      });
    }, { threshold: 0.6 });

    sectionLinks.forEach(({ element }) => observer.observe(element));
  }

  function throttle(fn, wait = 100) {
    let last = 0;
    return (...args) => {
      const now = Date.now();
      if (now - last >= wait) {
        last = now;
        fn(...args);
      }
    };
  }

  // ---- Component loading ----
  async function loadComponents() {
    try {
      const [navRes, footRes] = await Promise.all([
        fetch('navbar.html'),
        fetch('footer.html')
      ]);
      navbarContainer.innerHTML = await navRes.text();
      footerContainer.innerHTML = await footRes.text();

      initNavbarScripts();
      initFooterScripts();
      const { page, hash } = getCurrent();
      updateActiveLinks(page, hash);
      initScrollSpy();
    } catch (err) {
      console.error('Component load failed:', err);
    }
  }

  // ---- Navbar & sidebar behavior ----
  function initNavbarScripts() {
    const toggler      = document.querySelector('.navbar-nine .navbar-toggler');
    const sideMenuBtn  = document.querySelector('.navbar-nine .menu-bar');
    const sidebarLeft  = document.querySelector('.sidebar-left');
    const overlayLeft  = document.querySelector('.overlay-left');
    const closeBtn     = document.querySelector('.sidebar-close .close');

    toggler?.addEventListener('click', () => toggler.classList.toggle('active'));

    function closeSidebar() {
      sidebarLeft.classList.remove('open');
      overlayLeft.classList.remove('open');
    }

    sideMenuBtn?.addEventListener('click', () => {
      sidebarLeft.classList.add('open');
      overlayLeft.classList.add('open');
    });
    [overlayLeft, closeBtn].forEach(el => el?.addEventListener('click', closeSidebar));

    document.querySelectorAll('.sidebar-menu a').forEach(link => {
      link.addEventListener('click', e => {
        const href = link.getAttribute('href');
        if (!href || href.startsWith('#')) return;
        e.preventDefault();
        closeSidebar();
        setTimeout(() => window.location.href = href, 400);
      });
    });
  }

  // ---- Footer behavior ----
  function initFooterScripts() {
    if (!scrollTopBtn) return;

    window.addEventListener('scroll', throttle(() => {
      scrollTopBtn.classList.toggle('show', window.pageYOffset > 100);
    }, 100));

    scrollTopBtn.addEventListener('click', e => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ---- Kickoff ----
  document.addEventListener('DOMContentLoaded', loadComponents);

  // Expose if needed
  window.loadComponents     = loadComponents;
  window.initNavbarScripts = initNavbarScripts;
  window.initFooterScripts = initFooterScripts;
})();
