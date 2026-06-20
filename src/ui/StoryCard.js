import { stars } from '../data/stars.js';
import { constellations } from '../data/constellations.js';

export class StoryCard {
  constructor() {
    this.currentCon = null;
    this.currentStarIdx = -1;
    this.activeTab = 'greek';
    this.visible = false;
    this.callback = null;

    this.el = document.getElementById('story-card');
    this.starNameEl = document.getElementById('card-star-name');
    this.starFactsEl = document.getElementById('card-star-facts');
    this.mythTabsEl = document.getElementById('card-myth-tabs');
    this.mythContentEl = document.getElementById('card-myth-content');
    this.scienceEl = document.getElementById('card-science');
    this.closeEl = document.getElementById('card-close');

    this.closeEl.addEventListener('click', (e) => {
      e.stopPropagation();
      this.hide();
    });
  }

  setCallback(cb) {
    this.callback = cb;
  }

  show(conId, starIndex) {
    const con = constellations.find(c => c.id === conId);
    if (!con || !con.myths || Object.keys(con.myths).length === 0) return;
    
    this.currentCon = con;
    this.currentStarIdx = starIndex;
    this.visible = true;
    this.activeTab = 'greek';

    // Star info
    if (starIndex >= 0 && starIndex < stars.length) {
      const s = stars[starIndex];
      this.starNameEl.textContent = `${s[4]} · ${s[7] || '?'} 光年`;
      this.starFactsEl.textContent = `光谱型: ${s[6] || '?'} · 视星等: ${s[3].toFixed(2)}`;
    }

    this.renderTabs();
    this.renderContent();
    
    this.el.classList.remove('hidden');
    // Force reflow for animation
    void this.el.offsetWidth;
    this.el.classList.add('visible');
  }

  hide() {
    this.visible = false;
    this.el.classList.remove('visible');
    setTimeout(() => {
      this.el.classList.add('hidden');
    }, 500);
    if (this.callback) this.callback();
  }

  renderTabs() {
    const con = this.currentCon;
    if (!con || !con.myths) return;
    
    const tabs = {
      greek: '希腊神话',
      chinese: '中国星官',
      arabic: '阿拉伯传说'
    };

    this.mythTabsEl.innerHTML = '';
    for (const [key, label] of Object.entries(tabs)) {
      if (!con.myths[key]) continue;
      const tab = document.createElement('span');
      tab.className = `myth-tab ${key === this.activeTab ? 'active' : ''}`;
      tab.textContent = label;
      tab.addEventListener('click', () => {
        this.activeTab = key;
        this.renderTabs();
        this.renderContent();
      });
      this.mythTabsEl.appendChild(tab);
    }
  }

  renderContent() {
    const con = this.currentCon;
    if (!con) return;

    // Mythology content
    const myth = con.myths[this.activeTab];
    if (myth) {
      this.mythContentEl.textContent = myth;
    }

    // Science facts
    if (con.science) {
      this.scienceEl.textContent = con.science;
    }
  }

  isVisible() {
    return this.visible;
  }
}
