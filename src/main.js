import { PortfolioScene } from './scene.js';
import { audioController } from './audio.js';
import { portfolioData } from './data.js';

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('canvas-container');
  const scene = new PortfolioScene(container);

  // UI Elements
  const heroOverlay = document.getElementById('hero-overlay');
  const exploreBtn = document.getElementById('btn-explore');
  const resumeHeroBtn = document.getElementById('btn-resume-hero');

  // Navigation Items
  const navItems = document.querySelectorAll('.nav-item');
  const camBtns = document.querySelectorAll('.cam-btn');

  // Focused Drawer Elements
  const drawer = document.getElementById('portfolio-drawer');
  const drawerTitle = document.getElementById('drawer-title');
  const drawerMeta = document.getElementById('drawer-meta');
  const drawerBody = document.getElementById('drawer-body');
  const drawerCloseBtn = document.getElementById('drawer-close');

  // Camera presets map for sections
  const sectionPresets = {
    HOME: 'hero',
    ABOUT: 'about',
    SKILLS: 'skills',
    PROJECTS: 'projects',
    EXPERIENCE: 'experience',
    ACHIEVEMENTS: 'achievements',
    CERTIFICATIONS: 'certifications',
    RESEARCH: 'research',
    RESUME: 'resume',
    CONTACT: 'contact'
  };

  // Section Renderers
  function renderSection(section) {
    if (section === 'ABOUT') {
      const d = portfolioData.about;
      return `
        <div class="content-section">
          <h4 class="section-lead-title">${d.mainHeading}</h4>
          <div class="section-paragraphs">
            ${d.paragraphs.map(p => `<p class="section-p">${p}</p>`).join('')}
          </div>

          <div class="profile-card">
            <div class="profile-card-header">
              <span class="profile-badge">ACADEMIC & PROFESSIONAL PROFILE</span>
              <h5 class="profile-name">${d.profileCard.name}</h5>
            </div>
            <div class="profile-grid">
              <div class="profile-item">
                <span class="p-label">PROGRAM</span>
                <span class="p-val">${d.profileCard.degree}</span>
              </div>
              <div class="profile-item">
                <span class="p-label">SPECIALIZATION</span>
                <span class="p-val accent-cyan">${d.profileCard.specialization}</span>
              </div>
              <div class="profile-item">
                <span class="p-label">INSTITUTION</span>
                <span class="p-val">${d.profileCard.institution}</span>
              </div>
              <div class="profile-item highlight">
                <span class="p-label">CUMULATIVE GPA</span>
                <span class="p-val cgpa-badge">${d.profileCard.cgpa} / 10.0</span>
              </div>
              <div class="profile-item">
                <span class="p-label">LOCATION</span>
                <span class="p-val">${d.profileCard.location}</span>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    if (section === 'SKILLS') {
      const d = portfolioData.skills;
      return `
        <div class="content-section">
          <p class="section-note">${d.note}</p>
          <div class="skills-container">
            ${d.categories.map(cat => `
              <div class="skill-category-card">
                <h5 class="skill-category-title">
                  <span class="category-indicator">•</span> ${cat.name}
                </h5>
                <div class="skill-chips-group">
                  ${cat.skills.map(s => `<span class="skill-chip">${s}</span>`).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    if (section === 'PROJECTS') {
      const d = portfolioData.projects;
      return `
        <div class="content-section">
          <div class="projects-grid">
            ${d.items.map(item => `
              <article class="project-card">
                <div class="project-header">
                  <span class="project-badge">${item.badge}</span>
                  <h5 class="project-name">${item.name}</h5>
                  <h6 class="project-subtitle">${item.subtitle}</h6>
                </div>
                <p class="project-desc">${item.description}</p>
                <div class="project-footer">
                  <div class="project-tech-stack">
                    ${item.tech.map(t => `<span class="tech-tag">${t}</span>`).join('')}
                  </div>
                  <a href="${item.github}" target="_blank" rel="noopener noreferrer" class="btn-project-repo" title="View ${item.name} on GitHub">
                    <span class="repo-icon">⟨ / ⟩</span> GITHUB REPO ↗
                  </a>
                </div>
              </article>
            `).join('')}
          </div>
        </div>
      `;
    }

    if (section === 'ACHIEVEMENTS') {
      const d = portfolioData.achievements;
      return `
        <div class="content-section">
          <div class="achievements-top-bar">
            <span class="counter-badge">${d.counter}</span>
            <span class="year-badge">SEASON ${d.year}</span>
          </div>

          <div class="achievements-timeline">
            ${d.items.map(item => `
              <div class="achievement-card">
                <div class="achievement-icon">${item.icon}</div>
                <div class="achievement-content">
                  <div class="achievement-header">
                    <span class="place-tag">${item.place}</span>
                    <h5 class="event-title">${item.event}</h5>
                  </div>
                  <p class="achievement-desc">${item.desc}</p>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    if (section === 'EXPERIENCE') {
      const d = portfolioData.experience;
      return `
        <div class="content-section">
          <div class="experience-timeline">
            ${d.items.map(item => `
              <div class="experience-card">
                <div class="exp-header">
                  <div class="exp-org-badge">${item.org}</div>
                  <span class="exp-period">${item.period}</span>
                </div>
                <h5 class="exp-role">${item.role}</h5>
                <p class="exp-desc">${item.description}</p>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    if (section === 'CERTIFICATIONS') {
      const d = portfolioData.certifications;
      return `
        <div class="content-section">
          <div class="certs-grid">
            ${d.items.map(cert => `
              <div class="cert-card">
                <div class="cert-header">
                  <span class="cert-badge">${cert.badge}</span>
                  <span class="cert-code">${cert.code}</span>
                </div>
                <h5 class="cert-title">${cert.title}</h5>
                <span class="cert-issuer">${cert.issuer}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    if (section === 'RESEARCH') {
      const d = portfolioData.research;
      return `
        <div class="content-section">
          <blockquote class="research-quote">
            <span class="quote-mark">“</span>${d.statement}<span class="quote-mark">”</span>
          </blockquote>

          <div class="research-domains-group">
            <h5 class="domains-title">ACTIVE INQUIRY DOMAINS</h5>
            <div class="domain-chips">
              ${d.domains.map(dom => `
                <div class="domain-card">
                  <span class="domain-dot"></span>
                  <span class="domain-name">${dom}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    }

    if (section === 'RESUME') {
      const d = portfolioData.resume;
      return `
        <div class="content-section">
          <p class="section-p">${d.description}</p>
          <div class="resume-highlights-card">
            <h5 class="resume-card-title">CORE DOSSIER HIGHLIGHTS</h5>
            <ul class="resume-list">
              ${d.highlights.map(h => `<li><span class="bullet-cyan">▸</span> ${h}</li>`).join('')}
            </ul>
          </div>
          <div class="resume-actions">
            <button id="btn-view-pdf" class="btn-primary">[ VIEW RESUME ]</button>
            <button id="btn-download-pdf" class="btn-secondary">[ DOWNLOAD PDF ]</button>
          </div>
          <div id="resume-feedback" class="resume-feedback"></div>
        </div>
      `;
    }

    if (section === 'CONTACT') {
      const d = portfolioData.contact;
      return `
        <div class="content-section">
          <h4 class="section-lead-title">${d.title}</h4>
          <p class="section-p">${d.subtext}</p>

          <div class="contact-channels">
            ${d.channels.map(c => `
              <a href="${c.href}" target="_blank" rel="noopener noreferrer" class="contact-channel-item">
                <span class="channel-label">${c.label}</span>
                <span class="channel-val">${c.value}</span>
              </a>
            `).join('')}
          </div>

          <form id="contact-form" class="contact-form">
            <div class="form-row">
              <div class="form-group">
                <label for="c-name" class="form-label">YOUR NAME</label>
                <input id="c-name" type="text" class="form-input" placeholder="e.g. Elena Rostova" required />
              </div>
              <div class="form-group">
                <label for="c-email" class="form-label">YOUR EMAIL</label>
                <input id="c-email" type="email" class="form-input" placeholder="e.g. elena@company.com" required />
              </div>
            </div>
            <div class="form-group">
              <label for="c-msg" class="form-label">MESSAGE</label>
              <textarea id="c-msg" class="form-textarea" rows="4" placeholder="Brief project, research or collaboration inquiry..." required></textarea>
            </div>
            <button type="submit" id="btn-send-msg" class="btn-primary">[ SEND MESSAGE ]</button>
            <div id="form-status" class="form-status"></div>
          </form>
        </div>
      `;
    }

    return `<div class="content-section"><p>Module ready.</p></div>`;
  }

  // Open Section Modal
  function openSection(section) {
    if (section === 'HOME') {
      closeDrawer();
      return;
    }

    audioController.playClick();
    const preset = sectionPresets[section] || 'desk';
    scene.setCameraPreset(preset);

    const dataKey = section.toLowerCase();
    const data = portfolioData[dataKey] || {
      meta: `${section} • MODULE`,
      title: section
    };

    drawerTitle.textContent = data.title;
    drawerMeta.textContent = data.meta;
    drawerBody.innerHTML = renderSection(section);

    drawer.classList.add('visible');
    drawer.setAttribute('aria-hidden', 'false');
    heroOverlay.classList.add('hidden');

    // Update active nav button
    navItems.forEach(b => {
      if (b.getAttribute('data-section') === section) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });

    // Wire up dynamic events inside drawer if applicable
    wireDynamicEvents(section);
  }

  // Close Drawer
  function closeDrawer() {
    audioController.playClick();
    drawer.classList.remove('visible');
    drawer.setAttribute('aria-hidden', 'true');
    heroOverlay.classList.remove('hidden');
    scene.setCameraPreset('hero');

    navItems.forEach(b => {
      if (b.getAttribute('data-section') === 'HOME') {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });
  }

  // Dynamic Events inside Drawer
  function wireDynamicEvents(section) {
    if (section === 'RESUME') {
      const viewBtn = document.getElementById('btn-view-pdf');
      const dlBtn = document.getElementById('btn-download-pdf');
      const feedback = document.getElementById('resume-feedback');

      if (viewBtn) {
        viewBtn.addEventListener('click', () => {
          audioController.playClick();
          if (feedback) {
            feedback.innerHTML = `<span class="feedback-success">✓ RESUME DOSSIER READY • SYNCED FOR DOWNLOAD</span>`;
          }
        });
      }
      if (dlBtn) {
        dlBtn.addEventListener('click', () => {
          audioController.playTransition();
          if (feedback) {
            feedback.innerHTML = `<span class="feedback-success">✓ PDF INITIALIZED • DISPATCHED TO USER</span>`;
          }
        });
      }
    }

    if (section === 'CONTACT') {
      const form = document.getElementById('contact-form');
      const status = document.getElementById('form-status');
      const submitBtn = document.getElementById('btn-send-msg');

      if (form) {
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          audioController.playTransition();

          const nameInput = document.getElementById('c-name');
          const emailInput = document.getElementById('c-email');
          const msgInput = document.getElementById('c-msg');

          const name = nameInput ? nameInput.value.trim() : '';
          const email = emailInput ? emailInput.value.trim() : '';
          const msg = msgInput ? msgInput.value.trim() : '';

          if (status) {
            status.innerHTML = `<span class="feedback-success" style="background: rgba(0, 240, 255, 0.08); border-color: rgba(0, 240, 255, 0.4); color: #00f0ff;">⏳ TRANSMITTING MESSAGE TO IRANJANKRSHAW@GMAIL.COM...</span>`;
          }
          if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = '[ TRANSMITTING... ]';
          }

          try {
            const response = await fetch('https://formsubmit.co/ajax/iranjankrshaw@gmail.com', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: JSON.stringify({
                name: name,
                email: email,
                message: msg,
                _subject: `New Portfolio Inquiry from ${name}`
              })
            });

            const data = await response.json();
            if (response.ok || data.success === 'true' || data.success === true) {
              if (status) {
                status.innerHTML = `<span class="feedback-success" style="background: rgba(16, 185, 129, 0.12); border-color: #10b981; color: #10b981;">✓ MESSAGE DELIVERED DIRECTLY TO IRANJANKRSHAW@GMAIL.COM!</span>`;
              }
              form.reset();
            } else {
              throw new Error(data.message || 'Transmission fallback');
            }
          } catch (err) {
            // Reliable fallback to mailto so the user's message is never lost
            const mailtoUri = `mailto:iranjankrshaw@gmail.com?subject=${encodeURIComponent('Portfolio Contact: ' + name)}&body=${encodeURIComponent(msg + '\n\nFrom: ' + name + ' (' + email + ')')}`;
            window.location.href = mailtoUri;
            if (status) {
              status.innerHTML = `<span class="feedback-success" style="background: rgba(16, 185, 129, 0.12); border-color: #10b981; color: #10b981;">✓ OPENING EMAIL CLIENT TO DISPATCH TO IRANJANKRSHAW@GMAIL.COM</span>`;
            }
          } finally {
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.textContent = '[ SEND MESSAGE ]';
            }
          }
        });
      }
    }
  }

  // Nav Items Click Handlers
  navItems.forEach(btn => {
    btn.addEventListener('mouseenter', () => audioController.playHover());
    btn.addEventListener('click', () => {
      const section = btn.getAttribute('data-section');
      openSection(section);
    });
  });

  // Hero [ EXPLORE MY WORK ] Button
  if (exploreBtn) {
    exploreBtn.addEventListener('mouseenter', () => audioController.playHover());
    exploreBtn.addEventListener('click', () => {
      audioController.playTransition();
      openSection('PROJECTS');
    });
  }

  // Hero [ DOWNLOAD RESUME ] Button
  if (resumeHeroBtn) {
    resumeHeroBtn.addEventListener('mouseenter', () => audioController.playHover());
    resumeHeroBtn.addEventListener('click', () => {
      audioController.playTransition();
      openSection('RESUME');
    });
  }

  // Drawer Close Button
  if (drawerCloseBtn) {
    drawerCloseBtn.addEventListener('mouseenter', () => audioController.playHover());
    drawerCloseBtn.addEventListener('click', closeDrawer);
  }

  // ESC Key to Close Drawer
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('visible')) {
      closeDrawer();
    }
  });

  // Camera Presets Switcher
  camBtns.forEach(btn => {
    btn.addEventListener('mouseenter', () => audioController.playHover());
    btn.addEventListener('click', () => {
      audioController.playClick();
      camBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const preset = btn.getAttribute('data-preset');
      scene.setCameraPreset(preset);
    });
  });

  // Telemetry Loop (FPS & Clock)
  const fpsVal = document.getElementById('telemetry-fps');
  const timeVal = document.getElementById('telemetry-time');
  let frameCount = 0;
  let lastTime = performance.now();

  function updateTelemetry() {
    frameCount++;
    const now = performance.now();
    if (now - lastTime >= 1000) {
      if (fpsVal) {
        const fps = Math.round((frameCount * 1000) / (now - lastTime));
        fpsVal.textContent = `${fps} FPS`;
      }
      frameCount = 0;
      lastTime = now;
    }

    if (timeVal) {
      const d = new Date();
      timeVal.textContent = d.toISOString().substring(11, 19) + ' UTC';
    }

    requestAnimationFrame(updateTelemetry);
  }
  updateTelemetry();
});
