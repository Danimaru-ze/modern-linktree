# 🌟 PersonaPage: Your Digital Identity, Reimagined

Merasa halaman bio-link Anda kurang personal? **PersonaPage** adalah sebuah template *open-source* untuk membangun halaman profil digital yang elegan dan merepresentasikan siapa diri Anda.

Didesain untuk kreator, profesional, dan siapa saja yang ingin tampil beda, proyek ini menggabungkan estetika modern dengan fitur unik seperti *music player* dinamis. Semua konten diatur dengan mudah melalui satu file `data.json`. Kendali penuh ada di tanganmu!

🔗 **[Lihat Live Demo](https://links.danimaru.site)**

![PersonaPage Demo](https://links.danimaru.site)

## ✨ Fitur Unggulan

- 🤖 **Asisten AI Pribadi (Gratis)**: Hadirkan chatbot cerdas yang dapat menjawab pertanyaan pengunjung tentang Anda. Dilengkapi **sistem fallback 3-API** untuk memastikan asisten Anda selalu online dan responsif, bahkan jika salah satu penyedia layanan sedang error.
- 🎵 **Music Player Interaktif**: Lengkapi persona Anda dengan lagu favorit yang disertai lirik *time-synced*.
- 👋 **Layar Sambutan Personal**: Sambut pengunjung dengan pesan pembuka yang hangat.
- 📱 **Desain Sepenuhnya Responsif**: Tampilan sempurna di semua perangkat.
- 🔗 **Tautan Bio Kustom**: Atur semua tautan sosial media dan portofolio Anda.
- ⚡ **Animasi Halus & Modern**: Efek transisi yang elegan memberikan kesan profesional.
- ⚙️ **Konfigurasi Mudah via JSON**: Cukup edit satu file `data.json` untuk mengubah seluruh konten.seluruh konten.

## 🚀 Panduan Memulai Cepat

Hanya butuh tiga langkah untuk membuat PersonaPage Anda sendiri:

### 1. Unduh Proyek
Unduh semua file proyek (`index.html`, `styles.css`, `script.js`, dan `data.json`) dan simpan dalam satu folder yang sama.

### 2. Personalisasi Konten (`data.json`)
Buka file `data.json` dengan editor teks (seperti Notepad, VS Code, atau Sublime Text) dan sesuaikan isinya.

```json
{
    "profile": {
        "name": "Nama Lengkap Anda",
        "bio": "Desainer Grafis | Pecinta Kopi | Freelancer",
        "image": "[https://url-ke-foto-profil-anda.jpg](https://url-ke-foto-profil-anda.jpg)"
    },
    
    "links": [
        {
            "title": "Instagram",
            "url": "[https://instagram.com/username](https://instagram.com/username)",
            "icon": "fab fa-instagram"
        },
        {
            "title": "Portofolio Saya",
            "url": "[https://website-portofolio.com](https://website-portofolio.com)",
            "icon": "fas fa-briefcase"
        }
    ],
    
    "music": {
        "title": "Judul Lagu Favorit",
        "artist": "Nama Artis/Band",
        "albumArt": "[https://url-ke-cover-album.jpg](https://url-ke-cover-album.jpg)",
        "duration": 240,
        
        "timeSync": [
            { "time": 0, "text": "♪ Musik dimulai ♪" },
            { "time": 15, "text": "Baris pertama lirik muncul di sini" },
            { "time": 22, "text": "Baris kedua mengikuti..." },
            { "time": 29, "text": "Dan seterusnya hingga lagu berakhir" }
        ]
    }
}