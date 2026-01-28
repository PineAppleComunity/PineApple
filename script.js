// --- 1. CONFIGURACIÓN INICIAL (Audio y UI) ---
const audio = document.getElementById('bg-audio');
const playBtn = document.getElementById('play-pause-btn');
const icon = document.getElementById('audio-icon');

// --- 2. LÓGICA DE PERSISTENCIA Y AUDIO ---
if (audio) {
    audio.volume = 0.6;

    // Al cargar la página: Recuperar tiempo y estado previo
    const savedTime = localStorage.getItem('audioTime');
    const isPlaying = localStorage.getItem('audioPlaying') === 'true';

    if (savedTime) audio.currentTime = parseFloat(savedTime);
    
    if (isPlaying) {
        audio.play().then(() => {
            updateUI(true);
        }).catch(e => {
            console.log("Autoplay bloqueado: esperando interacción.");
            const resumeOnInteraction = () => {
                audio.play().then(() => {
                    updateUI(true);
                    document.removeEventListener('click', resumeOnInteraction);
                });
            };
            document.addEventListener('click', resumeOnInteraction);
        });
    }

    // Guardar estado antes de que el usuario cierre o recargue
    window.addEventListener('beforeunload', () => {
        localStorage.setItem('audioTime', audio.currentTime);
        localStorage.setItem('audioPlaying', !audio.paused);
    });

    // Control del Botón de Audio
    playBtn.addEventListener('click', () => {
        if (audio.paused) {
            audio.play();
            updateUI(true);
        } else {
            audio.pause();
            updateUI(false);
        }
    });
}

function updateUI(playing) {
    if (!icon || !playBtn) return;
    if (playing) {
        icon.innerText = "■ STOP SOUND";
        playBtn.style.borderColor = "var(--accent-color)";
        playBtn.style.boxShadow = "0 0 20px var(--accent-color)";
    } else {
        icon.innerText = "▶ SOUND ON";
        playBtn.style.boxShadow = "none";
        playBtn.style.borderColor = "white";
    }
}

// --- 3. ACCESO DIRECTO AL CLUB (Chau Google) ---
function accessClub() {
    // Seteamos el nombre para que el Dashboard lo reconozca
    localStorage.setItem('user_name', 'Invitado VIP');
    // Redirección inmediata
    window.location.href = 'dashboard.html';
}

// --- 4. INICIALIZACIÓN DE DASHBOARD ---
window.addEventListener('load', () => {
    // Si estamos en el dashboard, mostrar el nombre guardado
    const nameDisplay = document.getElementById('user-name');
    if (nameDisplay) {
        const savedName = localStorage.getItem('user_name');
        nameDisplay.innerText = savedName ? savedName.toUpperCase() : "EXPLORADOR DE PINEAPPLE";
    }
});

// --- 5. COUNTDOWN ---
const eventDate = new Date('March 14, 2026 23:59:59').getTime();
setInterval(function() {
    const countdownEl = document.getElementById("countdown");
    if (countdownEl) {
        const now = new Date().getTime();
        const distance = eventDate - now;
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        countdownEl.innerHTML = `${days}d : ${hours}h : ${minutes}m : ${seconds}s`;
    }
}, 1000);
