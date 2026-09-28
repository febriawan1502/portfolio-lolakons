import { gsap } from 'gsap';
import { portfolio } from './data.js';

const $ = selector => document.querySelector(selector);
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

function link(label, url) {
  return `<a href="${escape(url)}" target="_blank" rel="noopener noreferrer">${escape(label)} <span>↗</span></a>`;
}

function contentFor(id, headingId = 'panel-title') {
  if (id === 'about') return `<div class="panel-kicker">01 / ABOUT</div><h2 id="${headingId}">About <em>me.</em></h2><p class="panel-lead">${escape(portfolio.bio)}</p><div class="about-grid"><div><span class="field-label">NAME</span><strong>${escape(portfolio.name)}</strong></div><div><span class="field-label">CURRENT ROLE</span><strong>${escape(portfolio.role)}</strong></div><div><span class="field-label">ORGANIZATION</span><strong>${escape(portfolio.organization)}</strong></div></div>`;
  if (id === 'projects') return `<div class="panel-kicker">02 / PROJECTS</div><h2 id="${headingId}">Projects<span class="period">.</span></h2><div class="project-list">${portfolio.projects.map((p, i) => `<article class="project-row"><div class="project-number">0${i + 1}</div><div><small>${escape(p.type)}</small><h3>${escape(p.title)}</h3><p>${escape(p.description)}</p></div>${p.url ? `<div class="project-link">${link('VISIT SITE', p.url)}</div>` : ''}</article>`).join('')}</div>`;
  if (id === 'experience') return `<div class="panel-kicker">03 / EXPERIENCE</div><h2 id="${headingId}">Experience<span class="period">.</span></h2><div class="timeline">${portfolio.experience.map(item => `<div class="timeline-item"><span class="timeline-date">${escape(item.date)}</span><div><h3>${escape(item.role)}</h3><strong>${escape(item.place)}</strong><p>${escape(item.detail)}</p></div></div>`).join('')}</div>`;
  return `<div class="panel-kicker">04 / CONTACT</div><h2 id="${headingId}">Contact <em>me.</em></h2><p class="panel-lead">For inquiries, email me at:</p><a class="email-link" href="mailto:${escape(portfolio.email)}">${escape(portfolio.email)} <span>↗</span></a>`;
}

const overviewSections = [
  ['about', 'About me'],
  ['projects', 'Projects'],
  ['experience', 'Experience'],
  ['contact', 'Contact me']
];

function overviewContent() {
  return `<div class="overview-page"><header class="overview-heading"><div class="panel-kicker">THE HOUSE / ALL FOUR CIRCUITS ONLINE</div><h1 id="panel-title">${escape(portfolio.name)}</h1><p>Projects and professional experience, together in one place.</p></header><nav class="overview-nav" aria-label="Portfolio sections">${overviewSections.map(([id, label], index) => `<a href="#overview-${id}"><span>0${index + 1}</span>${label}</a>`).join('')}</nav>${overviewSections.map(([id]) => `<section id="overview-${id}" class="overview-section" tabindex="-1" aria-labelledby="overview-${id}-title">${contentFor(id, `overview-${id}-title`)}</section>`).join('')}</div>`;
}

export function createUI(onClose) {
  const backdrop = $('#panel-backdrop');
  const panel = $('#portfolio-panel');
  const prompt = $('#interaction-prompt');
  const toast = $('#toast');
  let toastTimer;
  let lastPrompt;
  function showPanel(index, content, overview = false) {
    $('#panel-index').textContent = index;
    $('#panel-content').innerHTML = content;
    $('#panel-content').scrollTop = 0;
    panel.classList.toggle('is-overview', overview);
    $('#panel-continue').innerHTML = overview ? 'BACK TO ISLAND <span>↗</span>' : 'CONTINUE EXPLORING <span>↗</span>';
    backdrop.hidden = false;
    gsap.fromTo(panel, { y: 36, opacity: 0 }, { y: 0, opacity: 1, duration: .45, ease: 'power3.out' });
    $('#panel-close').focus();
  }
  function closePanel() {
    if (backdrop.hidden) return;
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      clearTimeout(fallback);
      backdrop.hidden = true;
      panel.style.transform = '';
      panel.style.opacity = '';
      onClose?.();
    };
    // a starved animation frame must never leave the panel blocking input
    const fallback = setTimeout(finish, 900);
    gsap.to(panel, { y: 35, opacity: 0, duration: .22, ease: 'power2.in', onComplete: finish });
  }
  $('#panel-content').addEventListener('click', event => {
    const link = event.target.closest('.overview-nav a');
    if (!link) return;
    event.preventDefault();
    const section = $(link.getAttribute('href'));
    section?.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    section?.focus({ preventScroll: true });
  });
  $('#panel-close').addEventListener('click', closePanel);
  $('#panel-continue').addEventListener('click', closePanel);
  backdrop.addEventListener('click', event => { if (event.target === backdrop) closePanel(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closePanel(); });
  return {
    open(station) {
      showPanel(`${station.title.toUpperCase()} / 04`, contentFor(station.id));
    },
    openOverview() {
      showPanel('HOUSE / COMPLETE PORTFOLIO', overviewContent(), true);
    },
    isOpen: () => !backdrop.hidden,
    close: closePanel,
    prompt(station) {
      const key = station ? station.kind === 'house' ? 'house' : `${station.id}:${station.repaired}` : '';
      if (key === lastPrompt) return;
      lastPrompt = key;
      prompt.hidden = !station;
      $('#mobile-interact small').textContent = station?.kind === 'house' ? 'VIEW' : station?.repaired ? 'OPEN' : 'REPAIR';
      $('#mobile-interact').setAttribute('aria-label', station?.kind === 'house' ? 'View house overview' : station?.repaired ? 'Inspect power plant' : 'Repair power plant');
      if (station) {
        $('#prompt-action').textContent = station.kind === 'house' ? 'VIEW OVERVIEW' : station.repaired ? 'INSPECT PLANT' : 'REPAIR PLANT';
        $('#prompt-name').textContent = station.kind === 'house' ? 'HOUSE · ALL SECTIONS' : station.title.toUpperCase();
      }
    },
    progress(count, station) {
      $('#progress-text').textContent = `${String(count).padStart(2, '0')} / 04`;
      $('#progress-label').textContent = `${count} of 4 power plants online`;
      $('#progress-fill').style.width = `${count * 25}%`;
      document.querySelector(`[data-appliance="${station.appliance}"]`)?.classList.add('is-on');
      if (count === 4) {
        $('#overview-button').hidden = false;
        $('.mission p').textContent = 'The house is fully powered. Return to it for the complete portfolio.';
      }
    },
    toast(message) {
      toast.textContent = message;
      toast.classList.add('visible');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove('visible'), 2500);
    }
  };
}
