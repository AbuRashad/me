# AbdoOS 5.0 — Personal AI Operating System

نظام تشغيل ذكي شخصي: 9 وكلاء أذكياء، محرك ذاكرة بـ 5 أنواع، موجزات تنفيذية يومية.
FastAPI (Python) + React 19 (Vite) + Ollama محلي أو Anthropic سحابي.

---

## المعمارية (Architecture)

```
abdoos/
├── backend/                  FastAPI — modular monolith
│   └── app/
│       ├── core/             config · database · ai provider
│       ├── agents/           تعريف الوكلاء التسعة
│       ├── memory/           models + service (الذاكرة بـ 5 أنواع)
│       ├── knowledge/        (مساحة الـ knowledge graph مستقبلاً)
│       └── api/              routes
└── frontend/                 React 19 + Vite — واجهة عربية RTL
    └── src/
        ├── lib/api.js        عميل الـ API
        ├── App.jsx           الواجهة الكاملة
        └── index.css         ثيم Executive AI
```

---

## التشغيل (Quick Start)

### 1) الباكند

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # على ويندوز: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env          # عدّل الإعدادات حسب حاجتك
uvicorn app.main:app --reload --port 8000
```

افتراضياً يعمل على **SQLite** و **Ollama محلي**. لتشغيل Ollama:

```bash
ollama pull qwen3:8b
ollama pull nomic-embed-text
ollama serve
```

للتشغيل السحابي بدل المحلي، في `.env`:
```
AI_BACKEND=anthropic
ANTHROPIC_API_KEY=sk-ant-...
```

### 2) الفرونت

```bash
cd frontend
npm install
cp .env.example .env
npm run dev          # يفتح على http://localhost:5173
```

---

## نقاط الـ API

| Method | Path | الوصف |
|--------|------|-------|
| GET  | `/api/agents` | قائمة الوكلاء التسعة |
| POST | `/api/agents/{id}/chat` | محادثة وكيل (بسياق الذاكرة) |
| GET  | `/api/memories?type=` | قائمة الذكريات |
| POST | `/api/memories` | إضافة ذكرى |
| DELETE | `/api/memories/{id}` | حذف ذكرى |
| POST | `/api/briefing/morning` | الموجز الصباحي |
| POST | `/api/briefing/night` | مراجعة المساء |

---

## ما المبني فعلاً مقابل المخطط له

**مبني ويعمل الآن:**
- ✅ 9 وكلاء بشخصيات ومهام عربية كاملة
- ✅ محرك ذاكرة بـ 5 أنواع مع تخزين دائم
- ✅ حقن سياق الذاكرة في كل محادثة وكيل
- ✅ موجز صباحي + مراجعة مسائية بالذكاء الحي
- ✅ تبديل بين Ollama المحلي و Anthropic السحابي
- ✅ واجهة عربية RTL كاملة

**خريطة الطريق (المرحلة التالية):**
- 🔜 بحث دلالي بـ pgvector (الكود يستخدم الاسترجاع بالأحدثية حالياً؛ `embed()` جاهزة)
- 🔜 Knowledge Graph (مجلد `knowledge/` محجوز)
- 🔜 LangGraph orchestration بين الوكلاء
- 🔜 Capture Engine (صوت/PDF/صور)
- 🔜 طبقة موافقة بشرية للأفعال المستقلة
- 🔜 تغليف Electron للديسктоп

---

## ملاحظات

- البحث الدلالي يحتاج PostgreSQL + pgvector. غيّر `DATABASE_URL` في `.env` للإنتاج.
- وكلاء المالية والصحة يعطون رؤى عامة وليسوا بديلاً عن مستشار مرخّص أو طبيب.
