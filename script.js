const audio = document.getElementById('bg-audio');
const playBtn = document.getElementById('play-pause-btn');
const icon = document.getElementById('audio-icon');

// --- LÓGICA DE AUDIO (Mantenemos tus estilos exactos) ---
if (audio) {
    audio.volume = 0.6;
    playBtn.addEventListener('click', () => {
        if (audio.paused) {
            audio.play().catch(error => console.log("Error al reproducir:", error));
            icon.innerText = "■ STOP SOUND";
            playBtn.style.borderColor = "var(--accent-color)";
            playBtn.style.boxShadow = "0 0 20px var(--accent-color)";
        } else {
            audio.pause();
            icon.innerText = "▶ SOUND ON";
            playBtn.style.boxShadow = "none";
        }
    });
}

// --- LÓGICA DE GOOGLE AUTH ---
function handleCredentialResponse(response) {
    console.log("Token de Google recibido: " + response.credential);
    
    const payload = JSON.parse(atob(response.credential.split('.')[1]));
    console.log("Bienvenido: " + payload.name);
    
    // Guardamos el nombre para el Dashboard antes de redirigir
    localStorage.setItem('user_name', payload.given_name);

    fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: response.credential })
    })
    .then(res => {
        if (res.ok) return res.json();
        throw new Error('Backend no disponible');
    })
    .then(data => {
        if (data.success) {
            window.location.href = 'dashboard.html';
        } else {
            alert("Acceso denegado: Este club es privado.");
        }
    })
    .catch(err => {
        console.warn("Simulando acceso (Backend en desarrollo)...");
        window.location.href = 'dashboard.html'; 
    });
}

// Inicialización de Google
window.onload = function() {
    if (typeof google !== 'undefined') {
        google.accounts.id.initialize({
            client_id: "1072810203712-rn60r97cccebm6i3ev7kvds5v41mdl5p.apps.googleusercontent.com",
            callback: handleCredentialResponse
        });
        
        const loginBtn = document.querySelector(".g_id_signin");
        if (loginBtn) {
            google.accounts.id.renderButton(loginBtn, { theme: "dark", size: "large" });
        }
    }

    // Si estamos en el Dashboard, mostramos el nombre guardado
    const nameDisplay = document.getElementById('user-name');
    if (nameDisplay) {
        const savedName = localStorage.getItem('user_name');
        nameDisplay.innerText = savedName ? savedName.toUpperCase() : "EXPLORADOR DE PINEAPPLE";
    }
};

// --- COUNTDOWN (Con protección para que no falle en el Index) ---
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