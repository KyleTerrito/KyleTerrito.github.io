document.querySelectorAll('[data-about-gallery]').forEach(gallery => {
  const photos = [...gallery.querySelectorAll('figure')];
  if (photos.length < 2) return;

  const controls = document.createElement('div');
  controls.className = 'about-gallery-controls';
  const count = document.createElement('span');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let playing = !reducedMotion.matches;
  let visible = false;
  let timer;
  count.className = 'about-gallery-count';
  count.setAttribute('aria-live', 'polite');
  const slides = photos.map((_, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'about-gallery-dot';
    button.setAttribute('aria-label', `Show photo ${index + 1}`);
    button.addEventListener('click', () => {
      setPlaying(false);
      showPhoto(index);
    });
    return button;
  });
  controls.append(...slides, count);
  gallery.append(controls);

  let current = 0;
  function showPhoto(index) {
    current = (index + photos.length) % photos.length;
    photos.forEach((photo, position) => { photo.hidden = position !== current; });
    slides.forEach((slide, position) => {
      if (position === current) slide.setAttribute('aria-current', 'true');
      else slide.removeAttribute('aria-current');
    });
    count.textContent = `${current + 1} / ${photos.length}`;
  }

  function updatePlayback() {
    clearInterval(timer);
    if (playing && visible) {
      timer = setInterval(() => {
        if (!document.hidden && getComputedStyle(gallery).visibility === 'visible') showPhoto(current + 1);
      }, 4500);
    }
  }

  function setPlaying(value) {
    playing = value;
    count.setAttribute('aria-live', playing ? 'off' : 'polite');
    updatePlayback();
  }

  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) setPlaying(false);
  });
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.intersectionRatio >= .25;
    updatePlayback();
  }, { threshold: .25 });
  observer.observe(gallery);
  setPlaying(playing);
  showPhoto(0);
});
