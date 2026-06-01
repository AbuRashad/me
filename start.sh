#!/usr/bin/env bash
# AbdoOS 5.0 — تشغيل الباكند والفرونت معاً
set -e
echo "▶ تشغيل الباكند على المنفذ 8000..."
(cd backend && uvicorn app.main:app --reload --port 8000) &
echo "▶ تشغيل الفرونت على المنفذ 5173..."
(cd frontend && npm run dev)
