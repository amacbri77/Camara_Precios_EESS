const USER_NAME = 'Nombre editable';
const USER_EMAIL = 'correo@editable.com';

const screenStart = document.getElementById('screen-start');
const screenPreview = document.getElementById('screen-preview');
const screenSuccess = document.getElementById('screen-success');
const photoInput = document.getElementById('photo-input');
const previewImage = document.getElementById('preview-image');
const statusMessage = document.getElementById('status-message');
const takePhotoButton = document.getElementById('take-photo-button');
const retakeButton = document.getElementById('retake-button');
const sendButton = document.getElementById('send-button');
const newCaptureButton = document.getElementById('new-capture-button');

let selectedFile = null;
let previewUrl = '';

function showScreen(targetScreen) {
  [screenStart, screenPreview, screenSuccess].forEach((screen) => {
    const isActive = screen === targetScreen;
    screen.classList.toggle('screen--active', isActive);
    screen.setAttribute('aria-hidden', String(!isActive));
  });
}

function clearPreviewUrl() {
  if (previewUrl) {
    URL.revokeObjectURL(previewUrl);
    previewUrl = '';
  }
}

function resetCaptureFlow() {
  selectedFile = null;
  photoInput.value = '';
  previewImage.removeAttribute('src');
  statusMessage.textContent = '';
  sendButton.disabled = false;
  sendButton.textContent = 'Enviar';
  clearPreviewUrl();
  showScreen(screenStart);
}

function formatCaptureData(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return {
    timestamp: date.toISOString(),
    captureDate: `${year}-${month}-${day}`,
    captureTime: `${hours}:${minutes}:${seconds}`,
  };
}

function getLocation() {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      () => resolve(null),
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 30000,
      }
    );
  });
}

function preparePreview(file) {
  clearPreviewUrl();
  previewUrl = URL.createObjectURL(file);
  previewImage.src = previewUrl;
  statusMessage.textContent = '';
  showScreen(screenPreview);
}

async function sendCapture() {
  if (!selectedFile) {
    statusMessage.textContent = 'Selecciona una imagen antes de enviar.';
    return;
  }

  sendButton.disabled = true;
  sendButton.textContent = 'Enviando...';
  statusMessage.textContent = 'Enviando...';

  const captureMoment = formatCaptureData(new Date());
  const location = await getLocation();
  const formData = new FormData();

  formData.append('image', selectedFile);
  formData.append('timestamp', captureMoment.timestamp);
  formData.append('captureDate', captureMoment.captureDate);
  formData.append('captureTime', captureMoment.captureTime);
  formData.append('userName', USER_NAME);
  formData.append('userEmail', USER_EMAIL);

  if (location) {
    formData.append('latitude', String(location.latitude));
    formData.append('longitude', String(location.longitude));
    formData.append('accuracy', String(location.accuracy));
  }

  try {
    const response = await fetch('/upload', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!response.ok || !result.ok) {
      throw new Error(result.error || 'No se pudo enviar la captura.');
    }

    statusMessage.textContent = '';
    showScreen(screenSuccess);
  } catch (error) {
    sendButton.disabled = false;
    sendButton.textContent = 'Enviar';
    statusMessage.textContent = error.message || 'Ocurrió un error. Intenta nuevamente.';
  }
}

takePhotoButton.addEventListener('click', () => photoInput.click());
retakeButton.addEventListener('click', () => photoInput.click());
newCaptureButton.addEventListener('click', resetCaptureFlow);
sendButton.addEventListener('click', sendCapture);

photoInput.addEventListener('change', (event) => {
  const [file] = event.target.files || [];

  if (!file) {
    return;
  }

  selectedFile = file;
  preparePreview(file);
});
