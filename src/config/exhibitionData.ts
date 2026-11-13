/**
 * Against The Gravity — Central Exhibition Configuration
 * 
 * =======================================================================
 * PANDUAN LOKASI PENYIMPANAN FOTO & MUSIK:
 * =======================================================================
 * 
 * 1. FOTO 4 BIJI UTAMA (GALERI MELAYANG / CHAPTER 2):
 *    - Simpan file fotomu di folder: /public/images/
 *    - Ada 4 foto di dalam array `memories` di bawah ini (mem-1, mem-2, mem-3, mem-4).
 *    - FOTO NOMOR 4 (id: 'mem-4') ADALAH FOTO YANG ANCUR / RETAK!
 *      - `image`: Masukkan foto yang versi retak/pecah/buram (misal: '/images/foto_retak.jpg')
 *      - `restoredImage`: Masukkan foto versi jernih/utuh saat disatukan kembali (misal: '/images/foto_utuh.jpg')
 * 
 * 2. FOTO 20 BIJI (TRANSISI LUBANG HITAM / CHAPTER 4):
 *    - Simpan 20 file foto di folder: /public/images/vortex/ (misal: 1.jpg s/d 20.jpg)
 *    - Daftarkan path fotonya di array `vortexPhotos` di bawah ini.
 *    - Jika array `vortexPhotos` dikosongkan, sistem otomatis mengambil dari 4 foto utama agar tidak kosong.
 * 
 * 3. FILE LAGU / MUSIK:
 *    - Simpan di folder: /public/audio/lagu-kita.mp3
 * =======================================================================
 */

export interface MemoryConfig {
  id: string;
  title: string;
  date: string;
  image: string;
  restoredImage?: string;
  story: string;
  isCracked?: boolean;
}

export interface ExhibitionConfig {
  audio: {
    title: string;
    artist: string;
    audioUrl: string;
  };
  // 4 FOTO UTAMA DI GALERI MELAYANG (FLOATING ORBIT)
  memories: MemoryConfig[];
  // 20 FOTO UNTUK TRANSISI LUBANG HITAM (BLACK HOLE VORTEX)
  vortexPhotos: string[];
  letter: {
    recipientName: string;
    senderName: string;
    whatsappNumber: string;
    whatsappMessage: string;
    body: string;
  };
}

export const EXHIBITION_CONFIG: ExhibitionConfig = {
  // PENGATURAN MUSIK
  audio: {
    title: 'Lagu Pilihan Kita',
    artist: 'Diputar dari /public/audio/lagu-kita.mp3',
    audioUrl: '/audio/lagu-kita.mp3', 
  },

  // =====================================================================
  // 4 FOTO UTAMA DI GALERI MELAYANG (FORMAT .JPEG)
  // =====================================================================
  memories: [
    // FOTO 1 (NORMAL)
    {
      id: 'mem-1',
      title: 'Malam di Bawah Ribuan Bintang',
      date: ' · Reality Club',
      image: '/images/foto1.jpeg',
      story: 'Malam tumpah dengan segala keriuhannya—cahaya-cahaya berpendar dan manusia lalu-lalang tanpa henti. Namun, ke bisingan itu indraku tertutup. Yang paling kurasakan bukanlah riuhnya tempat, melainkan debar karena ada kamu yang berdiri tepat di sisiku.',
    },

    // FOTO 2 (NORMAL)
    {
      id: 'mem-2',
      title: 'Mewah dalam Kesederhanaan',
      date: '· Mall',
      image: '/images/foto2.jpeg',
      story: 'Kita tengah menyusuri jalanan dalam kesederhanaan yang amat bersahaja. Anehnya, di situlah bersemayam rasa bahagia yang sulit sekali dirumuskan dengan kata-kata. Kita tak butuh singgasana mewah; asalkan melangkah bersama orang yang diandalkan hati, semuanya menjelma istimewa.',
    },

    // FOTO 3 (NORMAL)
    {
      id: 'mem-3',
      title: 'Langkah Pelan',
      date: ' · Lift',
      image: '/images/foto3.jpeg',
      story: 'Barangkali kita tengah berada di ambang kepulangan atau justru bersiap menyongsong kepergian. Waktu mendesak, namun kita masih sempat mencuri satu detik untuk menyatukan rupa dalam bingkai gambar.',
    },

    // FOTO 4 (FOTO YANG ANCUR / RETAK & BISA DIPULIHKAN!)
    {
      id: 'mem-4',
      title: 'Semua tidak Penting',
      date: 'unknown title',
      // Foto versi retak/rusak (.jpeg):
      image: '/images/foto_retak.jpeg',
      // Foto versi pulih jernih ketika tombol "Tahan untuk Memperbaiki" selesai:
      restoredImage: '/images/foto_retak.jpeg',
      story: 'Kita abadikan momen saat jarak di antara kita begitu tipis. Tak perlu ada alasan agung atau kutipan khusus untuk menjepretnya; sebab yang paling utama hanyalah kita yang sedang bersama, merangkkum waktu agar tak lekas berlalu.',
      isCracked: true, // PENANDA BAHWA INI FOTO ANCUR / RETAK
    },
  ],

  // =====================================================================
  // FOTO KHUSUS YANG TERTARIK KE LUBANG HITAM (FORMAT .JPEG)
  // Berisi foto 1.jpeg sampai 25.jpeg dari folder /public/images/vortex/
  // =====================================================================
  vortexPhotos: [
    '/images/vortex/1.jpeg',
    '/images/vortex/2.jpeg',
    '/images/vortex/3.jpeg',
    '/images/vortex/4.jpeg',
    '/images/vortex/5.jpeg',
    '/images/vortex/6.jpeg',
    '/images/vortex/7.jpeg',
    '/images/vortex/8.jpeg',
    '/images/vortex/9.jpeg',
    '/images/vortex/10.jpeg',
    '/images/vortex/11.jpeg',
    '/images/vortex/12.jpeg',
    '/images/vortex/13.jpeg',
    '/images/vortex/14.jpeg',
    '/images/vortex/15.jpeg',
    '/images/vortex/16.jpeg',
    '/images/vortex/17.jpeg',
    '/images/vortex/18.jpeg',
    '/images/vortex/19.jpeg',
    '/images/vortex/20.jpeg',
    '/images/vortex/21.jpeg',
    '/images/vortex/22.jpeg',
    '/images/vortex/23.jpeg',
    '/images/vortex/24.jpeg',
    '/images/vortex/25.jpeg',
  ],

  // PENGATURAN SURAT HARAPAN (CHAPTER 5)
  letter: {
    recipientName: 'Untukmu yang Selalu Menghuni Doaku',
    senderName: 'Seseorang yang Masih Memilihmu',
    whatsappNumber: '081297109701',
    whatsappMessage: 'rifki... mungkin kita bisa perbaiki hal hal yang menjadi kekhawatiran kita belakangan ini ?',
    body: `Mungkin hukum alam atau logika bilang jalan kita buntu. Tapi kalau ada satu persen kemungkinan untuk sebuah keajaiban, aku memilih untuk berdiri di satu persen itu bareng kamu.\n\nMaafkan kesalahanku, ya. Ambil waktumu, aku nggak ke mana-mana.`,
  },
};
