window.addEventListener('load', () => {
  const presentation = document.getElementById('presentationScreen');
  const gallery = document.getElementById('gallery');

  setTimeout(() => {
    gallery.classList.add('visible');
  }, 3600);

  setTimeout(() => {
    presentation.style.display = 'none';
  }, 5000);
});
