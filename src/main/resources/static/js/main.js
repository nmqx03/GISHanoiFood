import { checkLoginStatus } from './auth.js';
import { initPlacesSystem } from './places.js';
import { initReviewSystem } from './reviews.js';
import { initChatSystem } from './ai.js';
import { initGisInputs, handleBufferAnalysis, handleNearMe, switchGisTab } from './gis.js';
import { initSpecialtiesSystem } from './specialties.js';
import { initHotPlacesSystem } from './hotPlaces.js';
import './profile.js';

window.handleBufferAnalysis = handleBufferAnalysis;
window.handleNearMe         = handleNearMe;
window.switchGisTab         = switchGisTab;

document.addEventListener('DOMContentLoaded', async () => {
  console.log('App starting...');

  checkLoginStatus();
  initReviewSystem();
  initChatSystem();

  // Sidebar nav actions
  document.querySelectorAll('.sb-item[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sb-nav .sb-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const action = btn.dataset.action;
      if (action === 'hot')          document.getElementById('hot-modal')?.classList.add('open');
      if (action === 'specialties')  document.getElementById('specialties-modal')?.classList.add('open');
      if (action === 'posts')        document.getElementById('posts-modal')?.classList.add('open');
      if (action === 'ai')           document.getElementById('chat-sidebar')?.classList.add('active');
      if (action === 'favorites')    document.getElementById('fav-modal')?.classList.add('open');
      if (action === 'itineraries')  {
        document.getElementById('profile-modal')?.classList.add('open');
        if (window.switchProfileTab) window.switchProfileTab('itinerary');
      }
    });
  });

  document.getElementById('btn-gis')?.addEventListener('click', () => {
    document.getElementById('gis-modal')?.classList.add('open');
  });

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
  });

  document.getElementById('close-chat')?.addEventListener('click', () => {
    document.getElementById('chat-sidebar')?.classList.remove('active');
  });

  const data = await initPlacesSystem();
  if (!data) return;

  initHotPlacesSystem();
  initSpecialtiesSystem();
  initGisInputs(data.places, data.categories);

  console.log('Loaded:', data.places.length, 'places');
});