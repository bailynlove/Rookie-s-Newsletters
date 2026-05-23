// Auth module for personal Supabase login
import { supabase } from './supabase-client.js';

let currentUser = null;

export async function initAuth() {
  // Check existing session
  const { data: { session } } = await supabase.auth.getSession();
  currentUser = session?.user ?? null;

  // Listen for auth changes
  supabase.auth.onAuthStateChange((_event, session) => {
    currentUser = session?.user ?? null;
    renderAuthUI();
  });

  renderAuthUI();
  return currentUser;
}

export function getUser() {
  return currentUser;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  currentUser = data.user;
  renderAuthUI();
  return data.user;
}

export async function signOut() {
  await supabase.auth.signOut();
  currentUser = null;
  renderAuthUI();
}

function renderAuthUI() {
  const container = document.getElementById('auth-bar');
  if (!container) return;

  if (currentUser) {
    container.innerHTML = `
      <span class="auth-user">${currentUser.email}</span>
      <button class="auth-btn" onclick="window.__authSignOut()">退出</button>
    `;
  } else {
    container.innerHTML = `
      <button class="auth-btn" onclick="window.__authShowModal()">登录</button>
    `;
  }
}

// Expose globals for inline onclick handlers
window.__authSignOut = signOut;
window.__authShowModal = () => {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.style.display = 'flex';
};
window.__authCloseModal = () => {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.style.display = 'none';
};
window.__authSubmit = async (e) => {
  e.preventDefault();
  const email = document.getElementById('auth-email').value;
  const password = document.getElementById('auth-password').value;
  const errorEl = document.getElementById('auth-error');
  try {
    await signIn(email, password);
    window.__authCloseModal();
    errorEl.textContent = '';
  } catch (err) {
    errorEl.textContent = err.message;
  }
};
