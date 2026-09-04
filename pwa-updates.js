if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then((registration) => {
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('Update PWA ditemukan, memuat ulang...');
            window.location.reload();
          }
        };
      };
    }).catch(err => console.error('Pendaftaran SW gagal:', err));
  });
}
