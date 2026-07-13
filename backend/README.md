# InvenTrack — Backend

REST API untuk InvenTrack, dibangun dengan Express + Prisma + PostgreSQL.

## Data model

```
User ──belongs to──> Warehouse (nullable — null berarti Admin, akses semua gudang)
Warehouse ──has many──> Stock, StockMovement, User
Category ──has many──> Product
Product ──has many──> Stock, StockMovement
Stock (productId + warehouseId, unique bersama) ── kuantitas saat ini per produk per gudang
StockMovement ── audit log immutable dari setiap perubahan Stock
```

`Stock` menyimpan kuantitas *saat ini*. `StockMovement` adalah log setiap
perubahan (IN/OUT/TRANSFER/ADJUSTMENT) — sumber kebenaran untuk dashboard
dan riwayat. Keduanya selalu diubah bersamaan dalam satu `$transaction`
Prisma supaya tidak pernah desync.

## RBAC

Tiga role: `ADMIN`, `MANAGER`, `STAFF`.

- **Admin** — akses semua gudang, satu-satunya yang bisa membuat/menghapus gudang, kategori-level tinggi, dan mengelola user
- **Manager** — dibatasi ke satu `warehouseId` yang ditugaskan, bisa kelola produk & mutasi stok di gudangnya
- **Staff** — dibatasi ke satu `warehouseId`, hanya bisa mencatat mutasi stok & melihat data gudangnya

Scoping ditegakkan di `middleware/auth.middleware.js` via `resolveWarehouseScope()`:
Admin bebas pilih `warehouseId` apa pun (atau kosong = lihat semua), sedangkan
Manager/Staff yang mengirim `warehouseId` selain milik mereka akan ditolak
dengan 403 — request tanpa `warehouseId` otomatis di-scope ke gudang mereka.

## Alur mutasi stok

Satu-satunya jalan masuk untuk mengubah stok adalah
`POST /api/stock/movements`. Di dalam satu transaksi database:

1. Cek kuantitas saat ini (`Stock.quantity`, default 0 jika belum ada baris)
2. Untuk `OUT`/`TRANSFER`: tolak dengan 409 jika kuantitas diminta > kuantitas tersedia
3. Untuk `ADJUSTMENT`: tolak jika hasil akhir akan negatif (quantity boleh signed, mis. `-5`)
4. `upsert` baris `Stock` dengan delta yang sesuai (`TRANSFER` meng-upsert dua baris: sumber & tujuan)
5. Buat baris `StockMovement` sebagai catatan audit

## API Reference

Semua endpoint (kecuali `/auth/login` dan `/health`) butuh header
`Authorization: Bearer <token>`.

| Method | Endpoint                  | Akses                | Keterangan |
|--------|----------------------------|------------------------|------------|
| POST   | `/api/auth/login`          | Publik                 | |
| POST   | `/api/auth/register`       | Admin                  | Membuat user baru |
| GET    | `/api/auth/me`              | Semua role              | |
| GET    | `/api/users`                 | Admin                  | |
| PATCH  | `/api/users/:id`             | Admin                  | |
| DELETE | `/api/users/:id`             | Admin                  | Soft delete (`isActive=false`) |
| GET    | `/api/warehouses`            | Semua role (scoped)     | |
| POST/PATCH/DELETE `/api/warehouses` | Admin | |
| GET    | `/api/categories`            | Semua role               | |
| POST/PATCH `/api/categories` | Admin, Manager | |
| DELETE `/api/categories/:id` | Admin | |
| GET    | `/api/products`              | Semua role (scoped)      | Query: `search`, `categoryId` |
| POST/PATCH `/api/products`   | Admin, Manager | |
| DELETE `/api/products/:id`   | Admin | Soft delete |
| GET    | `/api/stock`                  | Semua role (scoped)      | Query: `warehouseId`, `lowStockOnly` |
| GET    | `/api/stock/movements`        | Semua role (scoped)      | Query: `warehouseId`, `productId`, `type`, `limit` |
| POST   | `/api/stock/movements`        | Semua role (scoped)      | Lihat "Alur mutasi stok" |
| GET    | `/api/dashboard/summary`      | Semua role (scoped)      | |

Semua response memakai amplop `{ success, data }` atau `{ success: false, message }`.

## Setup

```bash
npm install                          # juga menjalankan `prisma generate` otomatis
cp .env.example .env                 # isi DATABASE_URL & JWT_SECRET
npx prisma migrate dev --name init   # buat tabel
npm run seed                         # data demo
npm run dev                          # http://localhost:4000
```

Perintah lain yang berguna: `npx prisma studio` (GUI untuk lihat/edit data),
`npm run prisma:deploy` (apply migration tanpa membuat migration baru — dipakai di production).

## Environment variables

Lihat `.env.example`. Yang wajib diisi: `DATABASE_URL`, `JWT_SECRET`.
`CORS_ORIGIN` perlu diarahkan ke URL frontend saat deploy.
