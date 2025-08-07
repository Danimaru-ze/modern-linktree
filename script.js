// script.js (Kode Lengkap Final)

// Variabel Global
let userData = null;
let currentLyricIndex = -1;
let songDuration = 0;
let isPlaying = false;
let isFirstInteraction = true;

// Elemen DOM
const welcomePanel = document.getElementById('welcomePanel');
const welcomeCloseBtn = document.getElementById('welcomeCloseBtn');
const mainContainer = document.getElementById('mainContainer');
const profilePic = document.getElementById('profilePic');
const profileName = document.getElementById('profileName');
const profileBio = document.getElementById('profileBio');
const linksContainer = document.getElementById('linksContainer');
const albumArt = document.getElementById('albumArt');
const songTitle = document.getElementById('songTitle');
const artist = document.getElementById('artist');
const lyrics = document.getElementById('lyrics');
const playPauseBtn = document.getElementById('playPauseBtn');
const playPauseIcon = document.getElementById('playPauseIcon');
const musicPlayer = document.getElementById('musicPlayer');
const musicToggle = document.getElementById('musicToggle');
const progressBar = document.getElementById('progressBar');
const currentTimeDisplay = document.getElementById('currentTime');
const totalTimeDisplay = document.getElementById('totalTime');
const audioPlayer = document.getElementById('audioPlayer');
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');


// --- FUNGSI & LOGIKA UTAMA ---

function handleWelcomePopup() {
    // Cek sessionStorage, yang akan direset setiap kali tab browser ditutup
    if (sessionStorage.getItem('welcomeShown')) {
        // Jika pop-up sudah pernah muncul di sesi ini, langsung tampilkan konten utama
        mainContainer.classList.remove('initially-hidden');
        mainContainer.classList.add('animate__animated', 'animate__fadeIn'); // Animasi fade-in cepat
    } else {
        // Jika ini kunjungan pertama di sesi ini, tampilkan pop-up
        welcomePanel.classList.add('visible');
    }

    welcomeCloseBtn.addEventListener('click', () => {
        sessionStorage.setItem('welcomeShown', 'true');
        welcomePanel.classList.remove('visible');
        mainContainer.classList.remove('initially-hidden');
        // Tambahkan animasi saat konten utama muncul
        mainContainer.classList.add('animate__animated', 'animate__fadeInUp');
    });
}

function applyTheme(theme) {
    document.body.classList.toggle('dark-mode', theme === 'dark');
    themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    localStorage.setItem('theme', theme);
}

function initializeFromJSON(data) {
    userData = data;

    // Isi data profil
    profileName.textContent = data.profile.name;
    profileBio.textContent = data.profile.bio;
    profilePic.src = data.profile.image;
    
    // Buat daftar link
    linksContainer.innerHTML = '';
    data.links.forEach((link, index) => {
        const linkElement = document.createElement('a');
        linkElement.href = link.url;
        linkElement.className = 'link-item animate__animated animate__fadeInUp';
        linkElement.style.animationDelay = `${0.1 * index}s`;
        linkElement.target = '_blank';
        linkElement.rel = 'noopener noreferrer';
        
        const icon = document.createElement('i');
        icon.className = link.icon;
        
        const text = document.createTextNode(link.title);
        
        linkElement.appendChild(icon);
        linkElement.appendChild(text);
        linksContainer.appendChild(linkElement);
    });
    
    // Isi data pemutar musik
    songTitle.textContent = data.music.title;
    artist.textContent = data.music.artist;
    albumArt.src = data.music.albumArt;
    
    if (data.music.audioFile) {
        audioPlayer.src = data.music.audioFile;
    }
    
    if (data.music.timeSync) {
        updateLyricsDisplay(0);
    } else {
       lyrics.textContent = data.music.lyrics || "Lyrics not available.";
    }
}

function updateLyricsDisplay(time) {
    if (!userData || !userData.music.timeSync) return;
    let lyricArray = userData.music.timeSync;
    if (Array.isArray(lyricArray) && lyricArray.length > 0 && Array.isArray(lyricArray[0])) {
        lyricArray = lyricArray[0];
    }
    let currentLyric = null;
    let newLyricIndex = -1;
    for (let i = 0; i < lyricArray.length; i++) {
        if (lyricArray[i].time <= time) {
            currentLyric = lyricArray[i];
            newLyricIndex = i;
        } else { break; }
    }
    if (currentLyric && newLyricIndex !== currentLyricIndex) {
        currentLyricIndex = newLyricIndex;
        lyrics.innerHTML = '';
        const lyricLine = document.createElement('div');
        lyricLine.className = 'lyrics-line active';
        lyricLine.textContent = currentLyric.text;
        lyrics.appendChild(lyricLine);
    }
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function togglePlayPause() {
    isPlaying = !isPlaying;
    if (isPlaying) {
        playPauseIcon.className = 'fas fa-pause';
        if (audioPlayer.src) audioPlayer.play();
    } else {
        playPauseIcon.className = 'fas fa-play';
        if (audioPlayer.src) audioPlayer.pause();
    }
}


// --- EVENT LISTENERS ---

themeToggle.addEventListener('click', () => {
    const newTheme = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
    applyTheme(newTheme);
});

musicToggle.addEventListener('click', () => {
    musicPlayer.classList.toggle('hidden');
});

playPauseBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    togglePlayPause();
});

document.querySelector('.progress-container').addEventListener('click', function(e) {
    if (audioPlayer.src && songDuration > 0) {
        const rect = this.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        audioPlayer.currentTime = percent * songDuration;
    }
});

audioPlayer.addEventListener('loadedmetadata', function() {
    songDuration = audioPlayer.duration;
    totalTimeDisplay.textContent = formatTime(songDuration);
});

audioPlayer.addEventListener('timeupdate', function() {
    currentTimeDisplay.textContent = formatTime(audioPlayer.currentTime);
    const percent = songDuration > 0 ? (audioPlayer.currentTime / songDuration) * 100 : 0;
    progressBar.style.width = `${percent}%`;
    updateLyricsDisplay(audioPlayer.currentTime);
});

audioPlayer.addEventListener('ended', function() {
    audioPlayer.currentTime = 0;
    if (isPlaying) { 
        audioPlayer.play(); 
    } else { 
        playPauseIcon.className = 'fas fa-play'; 
    }
});

document.addEventListener('click', function playOnFirstInteraction() {
    if (isFirstInteraction && userData && userData.music.audioFile) {
        isFirstInteraction = false;
        if (!isPlaying) {
            togglePlayPause();
        }
        document.removeEventListener('click', playOnFirstInteraction);
    }
}, true);


// --- FUNGSI YANG DIJALANKAN SAAT HALAMAN SELESAI DIMUAT ---

document.addEventListener('DOMContentLoaded', function() {
    // 1. Atur Tema
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme) { applyTheme(savedTheme); } 
    else if (prefersDark) { applyTheme('dark'); } 
    else { applyTheme('light'); }

    // 2. Tangani Logika Pop-up
    handleWelcomePopup();

    // 3. Atur Teks Footer
    const footerElement = document.getElementById('footer-content');
    if (footerElement) {
        const currentYear = new Date().getFullYear();
        footerElement.innerHTML = `&copy; ${currentYear} Danimaru. All rights reserved.`;
    }
    
    // 4. Ambil Data dari JSON dan Isi Halaman
    fetch('data.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            initializeFromJSON(data);
        })
        .catch(error => {
            console.error('Error loading data.json:', error);
            profileBio.textContent = "Failed to load profile data. Please check data.json file.";
        });
});