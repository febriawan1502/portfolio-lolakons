import { gsap } from 'gsap';
import { portfolio } from './data.js';

const $ = selector => document.querySelector(selector);
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

function link(label, url) {
  if (!url) return `<span class="disabled-link" title="Add a URL in src/data.js">${escape(label)} <small>LINK PENDING</small></span>`;
  return `<a href="${escape(url)}" target="_blank" rel="noopener noreferrer">${escape(label)} <span>↗</span></a>`;
}

function contentFor(id) {
  if (id === 'about') return `<div class="panel-kicker">01 / THE PERSON</div><h2 id="panel-title">About <em>me.</em></h2><p class="panel-lead">${escape(portfolio.bio)}</p><div class="about-grid"><div><span class="field-label">NAME</span><strong>${escape(portfolio.name)}</strong></div><div><span class="field-label">ROLE</span><strong>${escape(portfolio.role)}</strong></div><div><span class="field-label">BASED IN</span><strong>${escape(portfolio.location)}</strong></div></div><div class="field-label skills-label">TOOLS & SKILLS</div><div class="skill-list">${portfolio.skills.map(s => `<span>${escape(s)}</span>`).join('')}</div>`;
  if (id === 'projects') return `<div class="panel-kicker">02 / SELECTED WORK</div><h2 id="panel-title">Projects<span class="period">.</span></h2><p class="panel-lead compact">A few things built along the way. Replace these examples in <code>src/data.js</code>.</p><div class="project-list">${portfolio.projects.map((p, i) => `<article class="project-row"><div class="project-number">0${i + 1}</div><div><small>${escape(p.type)}</small><h3>${escape(p.title)}</h3><p>${escape(p.description)}</p></div><div class="project-link">${link('VIEW PROJECT', p.url)}</div></article>`).join('')}</div>`;
  if (id === 'experience') return `<div class="panel-kicker">03 / THE ROUTE</div><h2 id="panel-title">Experience<span class="period">.</span></h2><div class="timeline">${portfolio.experience.map(item => `<div class="timeline-item"><span class="timeline-date">${escape(item.date)}</span><div><h3>${escape(item.role)}</h3><strong>${escape(item.place)}</strong><p>${escape(item.detail)}</p></div></div>`).join('')}</div>`;
  return `<div class="panel-kicker">04 / OPEN CHANNEL</div><h2 id="panel-title">Contact <em>me.</em></h2><p class="panel-lead">Have a project, a question, or a good idea? Open a line.</p><a class="email-link" href="mailto:${encodeURIComponent(portfolio.email)}">${escape(portfolio.email)} <span>↗</span></a><div class="social-row">${portfolio.socials.map(s => link(s.label, s.url)).join('')}</div><p class="placeholder-note">Update the email and social links in <code>src/data.js</code> before publishing.</p>`;
}

export function createUI(onClose) {
  const backdrop = $('#panel-backdrop');
  const panel = $('#portfolio-panel');
  const prompt = $('#interaction-prompt');
  const toast = $('#toast');
  let toastTimer;
  let lastPrompt;
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
  $('#panel-close').addEventListener('click', closePanel);
  $('#panel-continue').addEventListener('click', closePanel);
  backdrop.addEventListener('click', event => { if (event.target === backdrop) closePanel(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closePanel(); });
  return {
    open(station) {
      $('#panel-index').textContent = `STATION ${station.number} / 04`;
      $('#panel-content').innerHTML = contentFor(station.id);
      backdrop.hidden = false;
      gsap.fromTo(panel, { y: 36, opacity: 0 }, { y: 0, opacity: 1, duration: .45, ease: 'power3.out' });
      $('#panel-close').focus();
    },
    isOpen: () => !backdrop.hidden,
    close: closePanel,
    prompt(station) {
      const key = station ? `${station.id}:${station.repaired}` : '';
      if (key === lastPrompt) return;
      lastPrompt = key;
      prompt.hidden = !station;
      if (station) {
        $('#prompt-action').textContent = station.repaired ? 'INSPECT STATION' : 'REPAIR STATION';
        $('#prompt-name').textContent = station.title.toUpperCase();
      }
    },
    progress(count) {
      $('#progress-text').textContent = `${String(count).padStart(2, '0')} / 04`;
      $('#progress-label').textContent = `${count} of 4 stations online`;
      $('#progress-fill').style.width = `${count * 25}%`;
    },
    toast(message) {
      toast.textContent = message;
      toast.classList.add('visible');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove('visible'), 2500);
    }
  };
}
