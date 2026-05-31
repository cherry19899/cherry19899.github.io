// Work Pro v335 — runtime patches (loads with cache-busting timestamp)
// This file bypasses CDN cache by loading with ?t=Date.now()

// 0. PERSISTENT fetch interceptor — reinstalls every 100ms (React overrides fetch)
(function() {
  var _originalFetch = null;
  var _patchInstalled = false;
  function installFetchInterceptor() {
    if (_patchInstalled && window.fetch && window.fetch._wpPatched) return;
    var currentFetch = window.fetch;
    if (!currentFetch || currentFetch === _originalFetch) return;
    _originalFetch = currentFetch;
    window.fetch = function(input, init) {
      var url = typeof input === 'string' ? input : (input && input.url);
      var isApply = url && url.indexOf('/apply') !== -1 && init && init.method === 'POST';
      return currentFetch.apply(this, arguments).then(function(response) {
        if (isApply) {
          var clone = response.clone();
          clone.json().then(function(data) {
            if (data && data.error && data.error.indexOf('Not enough connects') !== -1) {
              console.log('[WP] PERSISTENT Apply rejected:', data.error);
              if (window.showToast) {
                window.showToast('Need ' + (data.required || 2) + ' connects, you have ' + (data.current || 0), '#ef4444');
              }
            }
          }).catch(function(){});
        }
        return response;
      });
    };
    window.fetch._wpPatched = true;
    _patchInstalled = true;
    console.log('[Patch v335] PERSISTENT fetch interceptor installed');
  }
  // Install immediately and every 100ms
  installFetchInterceptor();
  setInterval(installFetchInterceptor, 100);
})();

// 0b. XMLHttpRequest interceptor (backup)
(function() {
  var origOpen = XMLHttpRequest.prototype.open;
  var origSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function(method, url) {
    this._wpUrl = url;
    this._wpMethod = method;
    return origOpen.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send = function(body) {
    var xhr = this;
    var isApply = this._wpUrl && this._wpUrl.indexOf('/apply') !== -1 && this._wpMethod === 'POST';
    if (isApply) {
      var origOnReady = this.onreadystatechange;
      this.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          try {
            var data = JSON.parse(xhr.responseText);
            if (data && data.error && data.error.indexOf('Not enough connects') !== -1) {
              console.log('[WP] XHR Apply rejected:', data.error);
              if (window.showToast) {
                window.showToast('Need ' + (data.required || 2) + ' connects, you have ' + (data.current || 0), '#ef4444');
              }
            }
          } catch(e) {}
        }
        if (origOnReady) origOnReady.apply(this, arguments);
      };
    }
    return origSend.apply(this, arguments);
  };
  console.log('[Patch v335] XMLHttpRequest interceptor installed');
})();

// 1. showToast helper
window.showToast = function(message, color) {
  color = color || '#10b981';
  var toastId = '_wp_toast_' + Date.now();
  var toast = document.createElement('div');
  toast.id = toastId;
  toast.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:100000;background:#fff;border-left:4px solid ' + color + ';color:#374151;padding:12px 20px;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,0.15);font-family:system-ui,sans-serif;font-size:14px;font-weight:500;max-width:90vw;width:auto;animation:slideDownToast 0.3s ease; display:flex; align-items:center; gap:8px;';
  toast.innerHTML = '<span style="color:' + color + ';font-size:18px;">&#10003;</span>' + message;
  document.body.appendChild(toast);
  setTimeout(function() {
    var t = document.getElementById(toastId);
    if (t) { t.style.opacity = '0'; t.style.transition = 'opacity 0.5s'; setTimeout(function() { t.remove(); }, 500); }
  }, 3000);
};

// 2. GLOBAL fetch interceptor for /apply
(function() {
  var _origFetch = window.fetch;
  window.fetch = function(input, init) {
    var url = typeof input === 'string' ? input : (input && input.url);
    var isApply = url && url.indexOf('/apply') !== -1 && init && init.method === 'POST';
    return _origFetch.apply(this, arguments).then(function(response) {
      if (isApply) {
        var clone = response.clone();
        clone.json().then(function(data) {
          if (data && data.error && data.error.indexOf('Not enough connects') !== -1) {
            console.log('[WP] Apply rejected:', data.error, 'need', data.required, 'have', data.current);
            if (window.showToast) {
              window.showToast('Need ' + (data.required || 2) + ' connects, you have ' + (data.current || 0), '#ef4444');
            }
          }
        }).catch(function(){});
      }
      return response;
    });
  };
  console.log('[Patch v335] Global fetch interceptor installed');
})();

// 3. _getLang helper
window._getLang = function() {
  return localStorage.getItem('workpro_lang') || localStorage.getItem('i18nextLng') || localStorage.getItem('selectedLang') || 'en';
};

// 4. _showPortfolio
window._showPortfolio = function() {
  var lang = window._getLang ? window._getLang() : 'en';
  var texts = {
    en: { title:'Portfolio', coming:'Coming Soon', desc:'Upload your best work to showcase your skills to potential clients.', add:'Add Work', close:'Close' },
    ru: { title:'Портфолио', coming:'Скоро', desc:'Загрузите свои лучшие работы, чтобы показать навыки клиентам.', add:'Добавить работу', close:'Закрыть' }
  };
  var t = texts[lang] || texts.en;
  var modalId = '_wp_portfolio_modal';
  var existing = document.getElementById(modalId);
  if (existing) existing.remove();
  var overlay = document.createElement('div');
  overlay.id = modalId;
  overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;padding:16px;';
  overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };
  var box = document.createElement('div');
  box.style.cssText = 'background:#fff;border-radius:16px;max-width:480px;width:100%;padding:24px;box-shadow:0 20px 60px rgba(0,0,0,0.3);text-align:center;';
  box.innerHTML = '<h2 style="color:#10b981;font-size:20px;font-weight:700;margin:0 0 4px;">' + t.title + '</h2>' +
    '<span style="display:inline-block;background:#fef3c7;color:#92400e;padding:2px 10px;border-radius:999px;font-size:12px;font-weight:600;margin-bottom:16px;">' + t.coming + '</span>' +
    '<div style="font-size:48px;margin-bottom:12px;">&#128193;</div>' +
    '<p style="color:#6b7280;font-size:14px;margin:0 0 20px;">' + t.desc + '</p>' +
    '<div style="display:flex;gap:12px;">' +
    '<button id="' + modalId + '_add" style="flex:1;padding:10px;background:#10b981;color:#fff;border:none;border-radius:8px;font-weight:600;cursor:pointer;opacity:0.6;">' + t.add + '</button>' +
    '<button id="' + modalId + '_close" style="flex:1;padding:10px;background:#f3f4f6;color:#374151;border:1px solid #e5e7eb;border-radius:8px;font-weight:600;cursor:pointer;">' + t.close + '</button>' +
    '</div>';
  overlay.appendChild(box);
  document.body.appendChild(overlay);
  document.getElementById(modalId + '_add').onclick = function() { window.showToast && window.showToast(t.coming + '!', '#f59e0b'); };
  document.getElementById(modalId + '_close').onclick = function() { overlay.remove(); };
  console.log('[Portfolio] Modal opened, lang=' + lang);
};

// 5. _showInstallPrompt
window._showInstallPrompt = function() {
  var lang = window._getLang ? window._getLang() : 'en';
  var texts = {
    en: { title:'Install Work Pro', desc:'Add Work Pro to your home screen for quick access.', install:'Install', how:'Tap your browser menu and select "Add to Home Screen"', close:'Close' },
    ru: { title:'Установить Work Pro', desc:'Добавьте Work Pro на главный экран для быстрого доступа.', install:'Установить', how:'Нажмите меню браузера и выберите "Добавить на главный экран"', close:'Закрыть' }
  };
  var t = texts[lang] || texts.en;
  var modalId = '_wp_install_modal';
  var existing = document.getElementById(modalId);
  if (existing) existing.remove();
  var overlay = document.createElement('div');
  overlay.id = modalId;
  overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;padding:16px;';
  overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };
  var box = document.createElement('div');
  box.style.cssText = 'background:#fff;border-radius:16px;max-width:420px;width:100%;padding:24px;box-shadow:0 20px 60px rgba(0,0,0,0.3);text-align:center;';
  box.innerHTML = '<div style="font-size:48px;margin-bottom:12px;">&#128241;</div>' +
    '<h2 style="color:#10b981;font-size:20px;font-weight:700;margin:0 0 8px;">' + t.title + '</h2>' +
    '<p style="color:#6b7280;font-size:14px;margin:0 0 16px;">' + t.desc + '</p>' +
    '<div style="background:#f3f4f6;padding:12px;border-radius:8px;font-size:13px;color:#374151;margin-bottom:20px;">' + t.how + '</div>' +
    '<div style="display:flex;gap:12px;">' +
    '<button id="' + modalId + '_inst" style="flex:1;padding:10px;background:#10b981;color:#fff;border:none;border-radius:8px;font-weight:600;cursor:pointer;">' + t.install + '</button>' +
    '<button id="' + modalId + '_close" style="flex:1;padding:10px;background:#f3f4f6;color:#374151;border:1px solid #e5e7eb;border-radius:8px;font-weight:600;cursor:pointer;">' + t.close + '</button>' +
    '</div>';
  overlay.appendChild(box);
  document.body.appendChild(overlay);
  document.getElementById(modalId + '_inst').onclick = function() {
    if (window.deferredPrompt) { window.deferredPrompt.prompt(); }
    else { var el = document.querySelector('#' + modalId + ' div:nth-child(4)'); if (el) { el.style.background = '#fef3c7'; el.style.color = '#92400e'; } }
  };
  document.getElementById(modalId + '_close').onclick = function() { overlay.remove(); };
  console.log('[Install] Modal opened, lang=' + lang);
};

// 6. Portfolio click handler
(function() {
  var portfolioTexts = ['Portfolio','Портфолио','Portafolio','Portfólio','Портфоліо','ポートフォリオ','포트폴리오','作品集'];
  var arrowSvg = 'M9 18l6-6-6-6';
  document.addEventListener('click', function(e) {
    var targets = [e.target, e.target.parentElement, e.target.parentElement && e.target.parentElement.parentElement];
    for (var t = 0; t < targets.length; t++) {
      var el = targets[t];
      if (!el || el === document.body) continue;
      if (el.closest && el.closest('#_wp_portfolio_modal')) return;
      var txt = (el.textContent || '').trim();
      var hasText = false;
      for (var i = 0; i < portfolioTexts.length; i++) { if (txt === portfolioTexts[i]) { hasText = true; break; } }
      if (!hasText) continue;
      var html = el.innerHTML || '';
      if (html.indexOf(arrowSvg) !== -1 && window._showPortfolio) {
        e.preventDefault(); e.stopPropagation();
        window._showPortfolio(); return;
      }
    }
  }, true);
  console.log('[Patch v335] Portfolio handler registered');
})();

// 7. Install click handler (strict)
(function() {
  var installTexts = ['Install Work Pro?','Установить Work Pro?','Instalar Work Pro?','Work Pro installieren?','Installer Work Pro?','Installa Work Pro?','Instalar Work Pro?','Zainstaluj Work Pro?','Встановити Work Pro?','Work Proをインストール?','Work Pro 설치?','安装 Work Pro?'];
  document.addEventListener('click', function(e) {
    var targets = [e.target, e.target.parentElement];
    for (var t = 0; t < targets.length; t++) {
      var el = targets[t];
      if (!el || el === document.body) continue;
      if (el.closest && el.closest('#_wp_install_modal')) return;
      var txt = (el.textContent || '').trim();
      var hasText = false;
      for (var i = 0; i < installTexts.length; i++) { if (txt.indexOf(installTexts[i]) !== -1) { hasText = true; break; } }
      if (!hasText) continue;
      var html = el.innerHTML || '';
      if ((html.indexOf('M9 18l6-6-6-6') !== -1 || html.indexOf('Add to home') !== -1) && window._showInstallPrompt) {
        e.preventDefault(); e.stopPropagation();
        window._showInstallPrompt(); return;
      }
    }
  }, true);
  console.log('[Patch v335] Install handler registered (strict)');
})();

// 8. SW unregister + cache clear
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(regs) {
    regs.forEach(function(r) { r.unregister(); console.log('[Patch v335] SW unregistered:', r.scope); });
  });
  if ('caches' in window) {
    caches.keys().then(function(names) {
      names.forEach(function(n) { caches.delete(n); });
    });
  }
}

console.log('[Patch v335] All patches loaded successfully');
