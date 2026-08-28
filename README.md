#!/bin/bash
echo "=== شروع نصب طبّاب ==="
npx create-next-app@latest tabtab --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --yes
cd tabtab
npm install @supabase/supabase-js @supabase/ssr
echo "=== DONE! حالا npm run dev ==="
# Tabtab
اپ کلینیک طب سنتی
