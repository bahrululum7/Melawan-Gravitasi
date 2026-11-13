=======================================================
FOLDER FOTO KENANGAN KAMU (PUBLIC IMAGES)
=======================================================

Untuk memasukkan foto-foto kalian berdua:

1. Letakkan file foto kalian (format .jpg, .png, atau .webp) di dalam folder ini:
   /public/images/

   Contoh:
   /public/images/foto_pertama.jpg
   /public/images/foto_kedua.jpg
   /public/images/foto_ketiga.jpg
   /public/images/foto_retak.jpg

2. Buka file pengaturan:
   /src/config/exhibitionData.ts

3. Ubah daftar foto di dalam array `memories`:
   export const EXHIBITION_CONFIG = {
     memories: [
       {
         id: "mem-1",
         title: "Judul Momen Pertama",
         date: "14 Oktober · Tempat Kenangan",
         image: "/images/foto_pertama.jpg", // <-- Path foto kamu di folder public
         story: "Cerita jujur apa yang kamu rasakan di momen ini...",
       },
       ...
     ]
   }
