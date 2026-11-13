=======================================================
FOLDER MUSIK KAMU (PUBLIC AUDIO)
=======================================================

Untuk memasukkan lagu buatanmu atau lagu pilihanmu sendiri:

1. Letakkan file lagu (format .mp3 atau .wav) di dalam folder ini:
   /public/audio/

   Contoh:
   /public/audio/lagu-kita.mp3

2. Buka file pengaturan:
   /src/config/exhibitionData.ts

3. Ubah bagian `audio`:
   export const EXHIBITION_CONFIG = {
     audio: {
       title: "Judul Lagu Pilihanmu",
       artist: "Artis / Kamu",
       audioUrl: "/audio/lagu-kita.mp3", // <-- Sesuaikan nama file di sini
     },
     ...
   }

Jika `audioUrl` dibiarkan kosong ("") atau file belum dimasukkan, website akan otomatis memutar instrumen piano ambient neo-classical bawaan yang syahdu dan emosional secara otomatis.
