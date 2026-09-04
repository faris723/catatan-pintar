
// pwa-updates.js - Tambahan Robustness & Fitur Sesuai Panduan
(async function() {
  console.log("[PWA Updates] Initializing Storage & Robustness features...");

  // 1. Storage Robustness & Persistence
  async function requestPersistentStorage() {
    if (navigator.storage && navigator.storage.persist) {
      try {
        const isPersisted = await navigator.storage.persisted();
        if (isPersisted) {
          console.log("[Storage] Penyimpanan sudah bersifat persisten.");
        } else {
          const permissionGranted = await navigator.storage.persist();
          console.log("[Storage]", permissionGranted ? "Penyimpanan persisten diaktifkan." : "Penyimpanan persisten ditolak.");
        }
      } catch (err) {
        console.error("[Storage] Gagal meminta penyimpanan persisten:", err);
      }
    }
  }

  // Update storage meter
  async function updateStorageMeter() {
    if (navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        const usedMB = (estimate.usage / (1024 * 1024)).toFixed(2);
        const quotaMB = (estimate.quota / (1024 * 1024)).toFixed(2);
        const percentage = ((estimate.usage / estimate.quota) * 100).toFixed(1);
        
        const textEl = document.getElementById('storageText');
        const fillEl = document.getElementById('storageFill');
        const warnEl = document.getElementById('storageWarningBanner');
        
        if(textEl) textEl.textContent = `${usedMB} MB / ${quotaMB} MB (${percentage}%)`;
        if(fillEl) {
          fillEl.style.width = `${percentage}%`;
          if (percentage > 90) fillEl.className = 'storage-fill danger';
          else if (percentage > 75) fillEl.className = 'storage-fill warn';
          else fillEl.className = 'storage-fill';
        }
        if(warnEl) {
          if (percentage > 80) warnEl.classList.add('show');
          else warnEl.classList.remove('show');
        }
      } catch (e) {
        console.error("[Storage]", e);
      }
    }
  }

  await requestPersistentStorage();
  await updateStorageMeter();
  setInterval(updateStorageMeter, 30000);

  // 2 & 3. IndexedDB Hardening & Manual JSON Backup/Restore
  const DB_NAME = 'CatatanPintarDB';
  const STORE_NAME = 'dokumen_catatan';
  const VERSION = 1;

  function openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, VERSION);
      request.onerror = e => reject(e.target.error);
      request.onsuccess = e => resolve(e.target.result);
      request.onupgradeneeded = e => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
    });
  }

  // Diekspor ke window agar dapat dipanggil jika dibutuhkan
  window.robustExportJSON = async function() {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      
      request.onsuccess = () => {
        const data = request.result;
        const backup = {
          version: 1,
          timestamp: Date.now(),
          notes: data
        };
        const jsonStr = JSON.stringify(backup, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `catatan_pintar_backup_${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      };
    } catch (e) {
      console.error(e);
      alert('Gagal mengekspor data.');
    }
  };

  window.robustImportJSON = async function(file, mode) {
    try {
      const text = await file.text();
      const backup = JSON.parse(text);
      if (!backup.notes || !Array.isArray(backup.notes)) throw new Error("Format JSON tidak valid");

      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      
      let imported = 0;

      if (mode === 'replace') {
        store.clear();
      }

      tx.oncomplete = () => {
        alert(`Impor berhasil! Halaman akan dimuat ulang.`);
        location.reload();
      };
      tx.onerror = (e) => {
        console.error("Transaction error:", e.target.error);
        alert("Terjadi kesalahan saat menyimpan ke database.");
      };

      backup.notes.forEach(note => {
        const req = store.put(note);
        req.onsuccess = () => imported++;
      });
    } catch (e) {
      console.error(e);
      alert('Gagal mengimpor file: ' + e.message);
    }
  };
})();
