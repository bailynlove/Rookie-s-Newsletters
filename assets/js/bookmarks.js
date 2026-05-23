// Bookmark CRUD + UI
import { supabase } from './supabase-client.js';
import { getUser } from './auth.js';

// ------------------------------------------------------------------
// CRUD
// ------------------------------------------------------------------

export async function fetchBookmarks() {
  const user = getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('bookmarks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (error) { console.error(error); return []; }
  return data || [];
}

export async function isBookmarked(reportPath, itemKey) {
  const user = getUser();
  if (!user) return false;
  const { data, error } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('user_id', user.id)
    .eq('report_path', reportPath)
    .eq('item_key', itemKey)
    .maybeSingle();
  if (error) { console.error(error); return false; }
  return !!data;
}

export async function addBookmark({ reportPath, itemKey, title, sourceUrl, tags, note }) {
  const user = getUser();
  if (!user) throw new Error('请先登录');
  const { data, error } = await supabase
    .from('bookmarks')
    .insert([{
      report_path: reportPath,
      item_key: itemKey,
      title,
      source_url: sourceUrl,
      tags: tags || [],
      note: note || '',
      user_id: user.id
    }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function removeBookmark(reportPath, itemKey) {
  const user = getUser();
  if (!user) throw new Error('请先登录');
  const { error } = await supabase
    .from('bookmarks')
    .delete()
    .eq('user_id', user.id)
    .eq('report_path', reportPath)
    .eq('item_key', itemKey);
  if (error) throw error;
}

export async function updateBookmarkTags(id, tags) {
  const { error } = await supabase
    .from('bookmarks')
    .update({ tags })
    .eq('id', id);
  if (error) throw error;
}

// ------------------------------------------------------------------
// Report page: inject bookmark buttons into discovery-cards
// ------------------------------------------------------------------

export async function injectBookmarkButtons() {
  const user = getUser();
  if (!user) return; // Don't show buttons if not logged in

  const reportPath = location.pathname.replace(/^\//, ''); // e.g. "academic/2026-05-22/..."
  const cards = document.querySelectorAll('.discovery-card');

  for (const card of cards) {
    const titleEl = card.querySelector('h3');
    const linkEl = card.querySelector('a[href^="http"]');
    const title = titleEl?.textContent?.trim() || '';
    const sourceUrl = linkEl?.href || '';
    const itemKey = sourceUrl || title;

    if (!itemKey) continue;

    const bookmarked = await isBookmarked(reportPath, itemKey);
    const btn = document.createElement('button');
    btn.className = 'bookmark-btn' + (bookmarked ? ' active' : '');
    btn.title = bookmarked ? '取消收藏' : '收藏';
    btn.innerHTML = bookmarked ? '★' : '☆';
    btn.onclick = async () => {
      if (bookmarked) {
        await removeBookmark(reportPath, itemKey);
        btn.classList.remove('active');
        btn.innerHTML = '☆';
        btn.title = '收藏';
      } else {
        const rawTags = prompt('添加标签（用逗号分隔，如: agent, mcp）：', '');
        const tags = rawTags ? rawTags.split(/[,，]/).map(t => t.trim()).filter(Boolean) : [];
        await addBookmark({ reportPath, itemKey, title, sourceUrl, tags });
        btn.classList.add('active');
        btn.innerHTML = '★';
        btn.title = '取消收藏';
      }
      // Refresh bookmark count on dashboard if this is opened in iframe/parent
      window.dispatchEvent(new CustomEvent('bookmarkChanged'));
    };

    // Insert button at top-right of card
    card.style.position = 'relative';
    card.appendChild(btn);
  }
}

// ------------------------------------------------------------------
// Dashboard: render bookmarks
// ------------------------------------------------------------------

export async function renderBookmarksPage(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const user = getUser();
  if (!user) {
    container.innerHTML = '<div class="empty-state">请登录后查看收藏</div>';
    return;
  }

  const bookmarks = await fetchBookmarks();
  if (!bookmarks.length) {
    container.innerHTML = '<div class="empty-state">暂无收藏</div>';
    return;
  }

  // Group by tag
  const byTag = {};
  const untagged = [];
  bookmarks.forEach(bm => {
    if (!bm.tags?.length) {
      untagged.push(bm);
      return;
    }
    bm.tags.forEach(tag => {
      if (!byTag[tag]) byTag[tag] = [];
      byTag[tag].push(bm);
    });
  });

  // Sort tags alphabetically
  const sortedTags = Object.keys(byTag).sort((a, b) => a.localeCompare(b, 'zh-CN'));

  let html = '<div class="bookmarks-page">';

  // Tag filter bar
  html += '<div class="bookmark-tag-bar">';
  html += '<button class="bookmark-tag-btn active" onclick="window.__filterBookmarks(\'all\')">全部</button>';
  sortedTags.forEach(tag => {
    html += `<button class="bookmark-tag-btn" onclick="window.__filterBookmarks('${tag}')">${tag} (${byTag[tag].length})</button>`;
  });
  if (untagged.length) {
    html += `<button class="bookmark-tag-btn" onclick="window.__filterBookmarks('untagged')">未分类 (${untagged.length})</button>`;
  }
  html += '</div>';

  // Bookmark list
  html += '<div class="bookmark-list" id="bookmark-list">';
  bookmarks.forEach(bm => renderBookmarkItem(bm));
  html += '</div>';

  html += '</div>';
  container.innerHTML = html;

  // Re-render list with actual HTML
  const listEl = document.getElementById('bookmark-list');
  if (listEl) {
    listEl.innerHTML = bookmarks.map(bm => bookmarkItemHTML(bm)).join('');
  }
}

function bookmarkItemHTML(bm) {
  const tagsHtml = (bm.tags || []).map(t => `<span class="bookmark-tag">${t}</span>`).join('');
  const dateStr = bm.created_at ? new Date(bm.created_at).toLocaleDateString('zh-CN') : '';
  return `
    <div class="bookmark-item" data-tags="${(bm.tags || []).join(',')}">
      <div class="bookmark-header">
        <a href="${bm.source_url || bm.report_path}" class="bookmark-title" target="_blank">${bm.title}</a>
        <button class="bookmark-delete" onclick="window.__deleteBookmark('${bm.id}')" title="删除">×</button>
      </div>
      <div class="bookmark-meta">
        <span class="bookmark-date">${dateStr}</span>
        <span class="bookmark-source">${bm.report_path}</span>
      </div>
      <div class="bookmark-tags">${tagsHtml}</div>
    </div>
  `;
}

// Globals for inline onclick
window.__filterBookmarks = (tag) => {
  document.querySelectorAll('.bookmark-tag-btn').forEach(btn => btn.classList.remove('active'));
  const clicked = Array.from(document.querySelectorAll('.bookmark-tag-btn')).find(b => {
    if (tag === 'all') return b.textContent.startsWith('全部');
    if (tag === 'untagged') return b.textContent.startsWith('未分类');
    return b.textContent.startsWith(tag);
  });
  if (clicked) clicked.classList.add('active');

  document.querySelectorAll('.bookmark-item').forEach(item => {
    const tags = item.dataset.tags || '';
    if (tag === 'all') { item.style.display = ''; return; }
    if (tag === 'untagged') { item.style.display = tags ? 'none' : ''; return; }
    item.style.display = tags.split(',').includes(tag) ? '' : 'none';
  });
};

window.__deleteBookmark = async (id) => {
  if (!confirm('确定删除这条收藏？')) return;
  const { error } = await supabase.from('bookmarks').delete().eq('id', id);
  if (error) { alert('删除失败: ' + error.message); return; }
  // Re-render
  const container = document.getElementById('bookmarks-content');
  if (container) renderBookmarksPage('bookmarks-content');
};
