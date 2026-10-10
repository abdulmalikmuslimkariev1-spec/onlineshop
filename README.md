# OnlineShop Management System - Step 1 Foundation

Bu loyiha professional darajadagi onlayn do'kon boshqaruv tizimining poydevori hisoblanadi. Loyiha modular va kengaytiriluvchan qilib ishlab chiqilgan.

## Loyiha Strukturasi

- `/frontend`: React + TypeScript + Tailwind CSS (Vite yordamida)
- `/backend`: Python + FastAPI
- `/docs`: Loyiha hujjatlari
- `server.ts`: Production uchun Node.js proxy serveri

## Talab qilinadigan dasturlar

- Node.js (v18+)
- Python (v3.10+)
- PostgreSQL (Kelgusi qadamlar uchun)

## O'rnatish

1. Frontend bog'liqliklarini o'rnatish:
   ```bash
   cd frontend
   npm install
   ```

2. Backend bog'liqliklarini o'rnatish:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. Root bog'liqliklarini o'rnatish:
   ```bash
   npm install
   ```

## Ishga tushirish (Development)

Root papkasida quyidagi buyruqni bajaring:
```bash
npm run dev
```
Bu buyruq bir vaqtning o'zida Frontend (port 3000) va Backend (port 8000) ni ishga tushiradi.

## Health Endpoint Tekshirish

Backend ishlayotganini tekshirish uchun:
`GET http://localhost:8000/api/health`

Kutilayotgan javob:
```json
{
  "status": "ok"
}
```

## Branding Sozlamalari

Do'kon nomi, logotipi, ranglari va boshqa brending ma'lumotlarini o'zgartirish uchun:
`frontend/src/config/branding.ts` faylini tahrirlang.

## Muhit (Environment) Sozlamalari

`.env.example` faylidan nusxa olib `.env` faylini yarating va kerakli qiymatlarni kiriting. Maxfiy ma'lumotlarni hech qachon kod ichida saqlamang.
