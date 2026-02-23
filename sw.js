self.addEventListener('fetch', function(event) {
  // Erforderlich für PWA-Erkennung
  event.respondWith(fetch(event.request));
});
