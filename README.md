# InvenTrack

Aplikasi manajemen inventory multi-gudang dengan role-based access control dan
dashboard analitik. Dibangun sebagai portfolio project full-stack.

**Stack:** Node.js (Express) · PostgreSQL + Prisma ORM · Vue 3 + Vite · Tailwind CSS · Chart.js

---

## Fitur

- **Multi-gudang** — stok dilacak per produk *per gudang*, termasuk mutasi transfer antar gudang
- **Role-based access control** — 3 peran (Admin / Manager / Staff), Manager & Staff otomatis dibatasi hanya ke gudang yang ditugaskan ke mereka
- **Audit trail lengkap** — setiap perubahan stok (Masuk / Keluar / Transfer / Penyesuaian) tercatat sebagai `StockMovement`, tidak pernah menimpa data lama
- **Dashboard analitik** — nilai total stok, alert stok menipis (reorder point), tren mutasi 30 hari, distribusi stok per gudang
- **Validasi & keamanan** — JWT auth, password hashing (bcrypt), validasi request dengan Zod, transaksi database atomik untuk setiap mutasi stok

## Struktur project

```
inventrack/
├── backend/          # REST API (Express + Prisma)
│   ├── prisma/
│   │   ├── schema.prisma   # data model lengkap
│   │   └── seed.js         # data demo (3 gudang, 3 user, 8 produk)
│   └── src/
│       ├── controllers/    # logika bisnis per resource
│       ├── middleware/     # auth, RBAC, validasi, error handler
│       ├── routes/
│       └── validators/     # Zod schemas
└── frontend/         # SPA (Vue 3 + Vite + Tailwind)
    └── src/
        ├── views/          # Dashboard, Products, Stock, Warehouses, Users, Login
        ├── components/     # layout shell, modal, stat card
        ├── stores/         # Pinia (auth, toast)
        └── services/       # axios client + per-resource API calls
```

Detail arsitektur data (relasi antar tabel, alasan desain RBAC) ada di
`backend/README.md`. Detail komponen & design system frontend ada di
`frontend/README.md`.

## Menjalankan secara lokal

Butuh Node.js 20+ dan PostgreSQL (lokal, atau pakai instance gratis dari Railway/Neon/Supabase).

```bash
# 1. Backend
cd backend
npm install                       # otomatis menjalankan `prisma generate`
cp .env.example .env              # isi DATABASE_URL dan JWT_SECRET
npx prisma migrate dev --name init
npm run seed                      # isi data demo + akun login
npm run dev                       # jalan di http://localhost:4000

# 2. Frontend (terminal baru)
cd frontend
npm install
cp .env.example .env              # default sudah benar untuk dev lokal
npm run dev                       # jalan di http://localhost:5173, proxy ke backend
```

Akun demo setelah seeding (password sama untuk semua: `password123`):

| Role    | Email                      | Cakupan akses         |
|---------|-----------------------------|------------------------|
| Admin   | admin@inventrack.dev        | Semua gudang           |
| Manager | manager.jkt@inventrack.dev  | Gudang Jakarta saja    |
| Staff   | staff.jkt@inventrack.dev    | Gudang Jakarta saja    |

## Deploy ke production

**Backend → Railway**
1. Buat project baru di Railway, deploy dari repo ini dengan root directory `backend`
2. Tambahkan plugin PostgreSQL — Railway otomatis mengisi `DATABASE_URL`
3. Set environment variable `JWT_SECRET` (string acak yang panjang) dan `CORS_ORIGIN` (URL frontend Vercel kamu, isi setelah step berikutnya)
4. Set start command ke: `npx prisma migrate deploy && npm run seed && npm start` (hapus `&& npm run seed` setelah deploy pertama, supaya tidak re-seed tiap redeploy)

**Frontend → Vercel**
1. Import repo ini, set root directory ke `frontend`
2. Set environment variable `VITE_API_URL` ke URL backend Railway kamu + `/api` (mis. `https://inventrack-backend-production.up.railway.app/api`)
3. Deploy — Vercel otomatis detect Vite dan build dengan benar

Setelah frontend live, update `CORS_ORIGIN` di Railway ke URL Vercel kamu supaya browser tidak diblokir CORS.

## Catatan pengembangan

Schema Prisma & seluruh logic controller (termasuk transaksi mutasi stok:
perhitungan delta, pengecekan stok cukup/tidak sebelum OUT & TRANSFER, dan
RBAC scoping) sudah ditulis dan diverifikasi manual line-by-line terhadap
`schema.prisma`, plus diuji lewat mock server untuk memastikan alur auth,
RBAC, dan transaksi stok bekerja sesuai desain. Prisma Client generate
otomatis saat `npm install` (butuh koneksi internet biasa — sandbox
pengembangan ini punya akses jaringan terbatas jadi generate-nya perlu
dilakukan di mesin kamu/Railway, bukan hal yang perlu dikhawatirkan).
