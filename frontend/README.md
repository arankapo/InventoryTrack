# InvenTrack — Frontend

SPA Vue 3 untuk InvenTrack. Vite + Vue Router 4 + Pinia + Tailwind CSS 4 + Chart.js.

## Struktur

```
src/
├── views/
│   ├── LoginView.vue
│   ├── DashboardView.vue     # stat cards + 2 chart (tren mutasi, distribusi per gudang)
│   ├── ProductsView.vue      # CRUD produk + kelola kategori
│   ├── StockView.vue         # level stok saat ini + catat mutasi + riwayat
│   ├── WarehousesView.vue    # CRUD gudang (admin)
│   └── UsersView.vue         # kelola user & role (admin)
├── components/
│   ├── layout/AppShell.vue   # sidebar nav, menu menyesuaikan role
│   └── ui/                   # Modal, StatCard, CategoryManagerModal
├── stores/                   # auth.js (Pinia, JWT di localStorage), toast.js
├── services/
│   ├── api.js                 # instance axios: attach token, redirect ke /login on 401
│   └── resources.js           # satu fungsi per endpoint backend
└── router/index.js            # route guards: auth required + role-based
```

## Design system

Tema "warehouse console" — navy gelap (`ink-950`…`ink-100`) dengan dua aksen
bermakna: **teal** untuk stok masuk/positif, **rust** untuk stok keluar/alert,
dan **amber** sebagai warna aksi utama. Font `Barlow Condensed` (display) +
`IBM Plex Sans`/`Mono` (body/data). Lihat `src/style.css` untuk token lengkap
dan class `.stencil-badge` (motif kode gudang, mis. `WH-JKT`).

## Setup

```bash
npm install
cp .env.example .env      # default sudah pas untuk dev lokal
npm run dev               # http://localhost:5173
```

Dev server men-proxy `/api` ke `http://localhost:4000` (lihat `vite.config.js`)
jadi backend harus jalan duluan. Build production: `npm run build` → folder `dist/`.

## Environment variables

`VITE_API_URL` — kosongkan untuk dev lokal (pakai proxy). Saat deploy ke
Vercel, isi dengan URL penuh backend Railway kamu (diakhiri `/api`).
