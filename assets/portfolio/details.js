const panel = document.querySelector('.detail-panel');
const panelContent = panel.querySelector('.panel-content');
const detailArticles = [...panelContent.querySelectorAll('[data-scene]')];
const closePanel = panel.querySelector('.close-panel');
const verticalCamera = panel.querySelector('.vertical-camera');
let opener;
let sharedScene;
let detailArticle;
let transitionHeight = 0;
let leftTop = false;
let dismissing = false;
let ignoreUpwardWheelUntil = 0;

function layoutVertical() {
  if (!panel.open || !detailArticle) return;
  panel.classList.toggle('static-details', !motion.matches);
  if (!motion.matches) {
    transitionHeight = 0;
    restoreScene();
    detailArticle.style.removeProperty('transform');
    detailArticle.style.removeProperty('visibility');
    detailArticle.inert = false;
    return;
  }
  moveScene(detailArticle.dataset.scene);
  const height = panelContent.clientHeight;
  transitionHeight = Math.round(height * 1.35);
  panelContent.style.setProperty('--reading-height', height + 'px');
  panelContent.style.setProperty('--reading-center', height / 2 + 'px');
  panelContent.style.setProperty('--transition-height', transitionHeight + 'px');
  panelContent.style.setProperty('--reading-tail', Math.max(0, detailArticle.offsetHeight - height) + 'px');
  updateVerticalZoom();
}

function updateVerticalZoom() {
  if (!sharedScene || !detailArticle) return;
  const readingRange = Math.max(1, panelContent.scrollHeight - panelContent.clientHeight);
  panel.style.setProperty('--detail-progress', Math.min(1, Math.max(0, panelContent.scrollTop / readingRange)));
  const phase = transitionHeight ? Math.min(1, Math.max(0, panelContent.scrollTop / transitionHeight)) : 1;
  panel.classList.toggle('reading-details', phase > .14);
  const { travel, scale } = transitionAt(phase, sharedScene.element.id === 'about' ? .29 : .21);
  const spacing = scale * panelContent.clientHeight + 24;
  sharedScene.element.style.transform = 'translateY(' + (-travel * spacing) + 'px) scale(' + scale + ')';
  detailArticle.style.transform = 'translateY(' + ((1 - travel) * spacing) + 'px) scale(' + scale + ')';
  sharedScene.element.style.visibility = travel === 1 ? 'hidden' : 'visible';
  detailArticle.style.visibility = travel === 0 && scale === 1 ? 'hidden' : 'visible';
  detailArticle.inert = travel < .5;
}

function matchSharedFrame(scene) {
  const bounds = scene.getBoundingClientRect();
  const headerHeight = document.querySelector('.bar').offsetHeight;
  if (!motion.matches) return;
  if (bounds.top < headerHeight - 1 || bounds.bottom > innerHeight + 1) return;
  if (motion.matches && !scene.classList.contains('reading-view')) return;
  panel.style.setProperty('--card-top', bounds.top + 'px');
  panel.style.setProperty('--card-left', bounds.left + 'px');
  panel.style.setProperty('--card-right', 'auto');
  panel.style.setProperty('--card-bottom', 'auto');
  panel.style.setProperty('--card-width', bounds.width + 'px');
  panel.style.setProperty('--card-height', bounds.height + 'px');
}

function clearSharedFrame() {
  for (const field of ['top', 'left', 'right', 'bottom', 'width', 'height']) {
    panel.style.removeProperty('--card-' + field);
  }
}

function onVerticalScroll() {
  updateVerticalZoom();
  if (dismissing || !transitionHeight) return;
  if (panelContent.scrollTop > 12) leftTop = true;
  if (leftTop && panelContent.scrollTop <= 1) {
    ignoreUpwardWheelUntil = performance.now() + 300;
    dismissDetail();
  }
}

function restoreScene() {
  if (!sharedScene) return;
  const toggle = sharedScene.element.querySelector('.detail-toggle');
  toggle.setAttribute('aria-label', toggle.title);
  sharedScene.placeholder.replaceWith(sharedScene.element);
  sharedScene.element.style.removeProperty('transform');
  sharedScene.element.style.removeProperty('visibility');
  sharedScene = undefined;
}

function moveScene(id) {
  if (sharedScene?.element.id === id) return;
  restoreScene();
  const element = document.getElementById(id);
  const placeholder = document.createElement('div');
  if (!motion.matches) placeholder.style.height = element.offsetHeight + 14 + 'px';
  element.replaceWith(placeholder);
  verticalCamera.prepend(element);
  element.inert = false;
  element.querySelector('.detail-toggle').setAttribute('aria-label', 'Close details');
  sharedScene = { element, placeholder };
}

function detailTarget(hash) {
  const id = hash.slice(1);
  return id ? document.getElementById(id) : null;
}

function showDetail(target) {
  const article = target?.closest('[data-scene]');
  if (!article) return false;

  detailArticles.forEach(item => { item.hidden = item !== article; });
  detailArticle = article;
  const heading = article.querySelector('[data-detail-heading]');
  panel.setAttribute('aria-labelledby', heading.id);
  if (!panel.open) {
    if (target === article) matchSharedFrame(document.getElementById(article.dataset.scene));
    panel.showModal();
    document.documentElement.classList.add('panel-open');
  }
  layoutVertical();
  panelContent.scrollTop = target === article
    ? 0
    : transitionHeight + target.offsetTop - 16;
  leftTop = panelContent.scrollTop > 12;
  dismissing = false;
  updateVerticalZoom();
  const sharedToggle = sharedScene?.element.querySelector('.detail-toggle');
  const focusTarget = target !== article ? target : sharedToggle || heading;
  focusTarget.focus({ preventScroll: true });
  return true;
}

function hideDetail() {
  if (!panel.open) return;
  restoreScene();
  detailArticle = undefined;
  document.documentElement.classList.remove('panel-open');
  panel.close();
  clearSharedFrame();
  render();
  opener?.focus({ preventScroll: true });
  opener = undefined;
}

function dismissDetail() {
  if (dismissing) return;
  dismissing = true;
  if (history.state?.detailPanel) {
    history.back();
    return;
  }
  const scene = detailTarget(location.hash)?.closest('[data-scene]')?.dataset.scene;
  if (scene) history.replaceState(history.state, '', '#' + scene);
  hideDetail();
}

document.addEventListener('click', event => {
  if (event.defaultPrevented || typeof panel.showModal !== 'function' || event.button !== 0 ||
      event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  let link = event.target.closest('[data-detail]');
  if (!link) {
    const scene = event.target.closest('.scene');
    if (!scene || event.target.closest('a, button, input, select, textarea, label, [contenteditable]') ||
        !window.getSelection()?.isCollapsed ||
        (!panel.open && motion.matches && !scene.classList.contains('reading-view'))) return;
    link = scene.querySelector('.detail-toggle');
    if (!link) return;
  }
  const target = document.getElementById(link.dataset.detail);
  if (!target) return;
  event.preventDefault();
  if (panel.open && sharedScene?.element.contains(link)) {
    dismissDetail();
    return;
  }
  if (!panel.open) opener = link;
  const hash = '#' + target.id;
  if (!panel.open) history.pushState({ detailPanel: true }, '', hash);
  else history.replaceState(history.state, '', hash);
  showDetail(target);
});

panelContent.addEventListener('scroll', onVerticalScroll, { passive: true });
window.addEventListener('wheel', event => {
  if (!panel.open && !event.ctrlKey && event.deltaY < 0 && performance.now() < ignoreUpwardWheelUntil) event.preventDefault();
}, { passive: false });
motion.addEventListener('change', layoutVertical);
window.addEventListener('resize', () => {
  clearSharedFrame();
  layoutVertical();
});
const detailResize = new ResizeObserver(layoutVertical);
detailArticles.forEach(article => detailResize.observe(article));
closePanel.addEventListener('click', dismissDetail);
panel.addEventListener('cancel', event => {
  event.preventDefault();
  dismissDetail();
});

window.addEventListener('popstate', () => {
  if (!showDetail(detailTarget(location.hash))) hideDetail();
});

window.addEventListener('pageshow', event => {
  if (event.persisted || typeof panel.showModal !== 'function') return;
  const target = detailTarget(location.hash);
  const scene = target?.closest('[data-scene]')?.dataset.scene;
  if (!scene) return;
  if (!restoringHistory) {
    if (motion.matches) jump('#' + scene, 'instant');
    else document.getElementById(scene).scrollIntoView();
  }
  showDetail(target);
});
