
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { drugs, mizajTadbir, symptomDrugMap } from '@/lib/data';

type Nobat = {
  id: string; name: string; phone: string; service: string;
  date: string; status?: string;
};

type Parvande = {
  id: string; name: string; phone: string; gender: string; age: string;
  city: string; shakayat: string; alamat: string[]; zamindeyi?: string;
  mizaj?: string; madarek?: string[];
};

type Nosxe = {
  shomare: string; parvandeId: string; phone: string; name: string;
  mizaj?: string; items: { name: string; usage: string }[];
  tadabir: string[]; date: string;
};

const PASSWORD = '1234';

export default function PanelPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'nobats' | 'parvande'>('nobats');

  const [nobats, setNobats] = useState<Nobat[]>([]);
  const [parvande, setParvande] = useState<Parvande[]>([]);
  const [selected, setSelected] = useState<Parvande | null>(null);

  // حالت صدور نسخه
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<{ name: string; usage: string }[]>([]);
  const [issued, setIssued] = useState<Nosxe | null>(null);
  const [warn, setWarn] = useState<string[]>([]);

  useEffect(() => {
    if (sessionStorage.getItem('panelAuth') === '1') setLoggedIn(true);
    setNobats(JSON.parse(localStorage.getItem('nobats') || '[]'));
    setParvande(JSON.parse(localStorage.getItem('parvande') || '[]'));
  }, []);

  const login = () => {
    if (pass === PASSWORD) {
      sessionStorage.setItem('panelAuth', '1');
      setLoggedIn(true);
      setError('');
    } else {
      setError('رمز نادرست است!');
    }
  };

  // 💡 پیشنهاد هوشمند دارو بر اساس علائم بیمار
  const suggestDrugs = (p: Parvande) => {
    const ids = new Set<string>();
    p.alamat?.forEach((a) => symptomDrugMap[a]?.forEach((d) => ids.add(d)));
    return drugs.filter((d) => ids.has(d.id));
  };

  // ⚠️ بررسی منع مصرف و تداخل دارویی
  const checkWarnings = (drugIds: string[]) => {
    const w: string[] = [];
    drugIds.forEach((id) => {
      const d = drugs.find((x) => x.id === id || x.name === id);
      if (!d) return;
      if (d.mane) w.push(`منع مصرف d.name:{d.name}:d.name:{d.mane}`);
      if (d.tadakhod) w.push(`تداخل d.name:{d.name}:d.name:{d.tadakhod}`);
    });
    return w;
  };

  const addDrug = (id: string) => {
    if (items.find((i) => i.name === id)) return;
    const d = drugs.find((x) => x.id === id);
    const newList = [...items, { name: id, usage: d?.usage || '' }];
    setItems(newList);
    setWarn(checkWarnings(newList.map((i) => i.name)));
  };

  const removeDrug = (index: number) => {
    const newList = items.filter((_, j) => j !== index);
    setItems(newList);
    setWarn(checkWarnings(newList.map((i) => i.name)));
  };

  const issueNosxe = () => {
    if (!selected || items.length === 0) return;
    const all = JSON.parse(localStorage.getItem('nosxe_list') || '[]') as Nosxe[];
    const shomare = `BH-${1001 + all.length}`;
    const tadbir = selected.mizaj ? mizajTadbir[selected.mizaj] || [] : [];
    const n: Nosxe = {
      shomare,
      parvandeId: selected.id,
      phone: selected.phone,
      name: selected.name,
      mizaj: selected.mizaj,
      items,
      tadabir: tadbir,
      date: new Date().toLocaleDateString('fa-IR'),
    };
    localStorage.setItem('nosxe_list', JSON.stringify([...all, n]));
    localStorage.setItem(`nosxe_${selected.phone}`, JSON.stringify(n));
    setIssued(n);
    setItems([]);
    setWarn([]);
  };

  // ---------- صفحه ورود ----------
  if (!loggedIn) {
    return (
      <main className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm animate-fade-in">
          <h1 className="text-2xl font-bold text-emerald-800 text-center mb-6">🩺 پنل طبیب</h1>
          <input
            type="password"
            value={pass}
            onChange={(e) => { setPass(e.target.value); setError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && login()}
            placeholder="رمز ورود"
            className="w-full border border-stone-300 rounded-xl px-4 py-3 text-center mb-3 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
          {error && <p className="text-red-600 text-sm text-center mb-2">{error}</p>}
          <button
            onClick={login}
            className="w-full bg-emerald-800 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition"
          >
            ورود
          </button>
          <Link href="/" className="block text-center text-stone-500 text-sm mt-4 hover:text-emerald-700">
            ← بازگشت به صفحه اصلی
          </Link>
        </div>
      </main>
    );
  }

  // ---------- پنل اصلی ----------
  return (
    <main className="min-h-screen bg-stone-50 p-4 max-w-2xl mx-auto pb-24">
      {/* هدر */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-emerald-800">🩺 پنل طبیب</h1>
        <button
          onClick={() => { sessionStorage.removeItem('panelAuth'); setLoggedIn(false); }}
          className="text-sm text-stone-500 hover:text-red-600"
        >
          خروج
        </button>
      </div>

      {/* تب‌ها */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab('nobats')}
          className={`flex-1 py-2 rounded-xl font-bold transition ${
            tab === 'nobats' ? 'bg-emerald-800 text-white' : 'bg-white text-stone-600'
          }`}
        >
          📅 نوبت‌ها ({nobats.length})
        </button>
        <button
          onClick={() => setTab('parvande')}
          className={`flex-1 py-2 rounded-xl font-bold transition ${
            tab === 'parvande' ? 'bg-emerald-800 text-white' : 'bg-white text-stone-600'
          }`}
        >
          📁 پرونده‌ها ({parvande.length})
        </button>
      </div>

      {/* تب نوبت‌ها */}
      {tab === 'nobats' && (
        <div className="space-y-3 animate-fade-in">
          {nobats.length === 0 && (
            <p className="text-center text-stone-400 py-8">نوبتی ثبت نشده است</p>
          )}
          {nobats.map((n) => (
            <div key={n.id} className="bg-white rounded-xl shadow p-4 animate-slide-up">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-stone-800">{n.name}</p>
                  <p className="text-sm text-stone-500">📞 {n.phone}</p>
                  <p className="text-sm text-emerald-700 mt-1">{n.service}</p>
                  {n.date && <p className="text-xs text-stone-400 mt-1">🗓️ {n.date}</p>}
                </div>
                <select
                  value={n.status || 'در انتظار'}
                  onChange={(e) => {
                    const updated = nobats.map((x) =>
                      x.id === n.id ? { ...x, status: e.target.value } : x
                    );
                    setNobats(updated);
                    localStorage.setItem('nobats', JSON.stringify(updated));
                  }}
                  className="text-sm border rounded-lg px-2 py-1"
                >
                  <option>در انتظار</option>
                  <option>تأیید شده</option>
                  <option>انجام شد</option>
                  <option>لغو شد</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* تب پرونده‌ها — لیست */}
      {tab === 'parvande' && !selected && (
        <div className="space-y-3 animate-fade-in">
          {parvande.length === 0 && (
            <p className="text-center text-stone-400 py-8">پرونده‌ای موجود نیست</p>
          )}
          {parvande.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelected(p)}
              className="w-full bg-white rounded-xl shadow p-4 text-right animate-slide-up hover:shadow-md transition"
            >
              <p className="font-bold text-stone-800">{p.name}</p>
              <p className="text-sm text-stone-500">📞 {p.phone} | {p.city} | {p.age} ساله</p>
              <p className="text-sm text-emerald-700 mt-1">شکایت: {p.shakayat}</p>
              {p.mizaj && (
                <span className="inline-block mt-2 text-xs bg-emerald-100 text-emerald-800 rounded-full px-3 py-1">
                  مزاج: {p.mizaj}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* جزئیات پرونده + صدور نسخه */}
      {tab === 'parvande' && selected && (
        <div className="animate-fade-in">
          <button
            onClick={() => { setSelected(null); setIssued(null); setItems([]); setWarn([]); }}
            className="text-sm text-stone-500 mb-3 hover:text-emerald-700"
          >
            ← بازگشت به لیست
          </button>

          {/* اطلاعات بیمار */}
          <div className="bg-white rounded-xl shadow p-4 mb-4">
            <h2 className="font-bold text-lg text-stone-800">{selected.name}</h2>
            <p className="text-sm text-stone-500 mt-1">
              📞 {selected.phone} | {selected.gender} | {selected.age} سال | {selected.city}
            </p>
            <p className="text-sm mt-2">🩹 <b>شکایت:</b> {selected.shakayat}</p>
            {selected.zamindeyi && (
              <p className="text-sm">⚠️ <b>بیماری زمینه‌ای:</b> {selected.zamindeyi}</p>
            )}
            {selected.mizaj && (
              <p className="text-sm mt-1">🩺 <b>مزاج غالب:</b> {selected.mizaj}</p>
            )}
            {selected.alamat?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {selected.alamat.map((a) => (
                  <span key={a} className="text-xs bg-stone-100 rounded-full px-2 py-1">{a}</span>
                ))}
              </div>
            )}
            {selected.madarek && selected.madarek.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-stone-400 mb-1">📎 مدارک:</p>
                {selected.madarek.map((m, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={m} alt={`مدرک ${i + 1}`} className="w-24 h-24 object-cover rounded-lg border m-1" />
                ))}
              </div>
            )}
          </div>

          {/* 💡 پیشنهاد هوشمند */}
          {suggestDrugs(selected).length > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4">
              <h3 className="font-bold text-emerald-800 mb-2">💡 پیشنهاد هوشمند بر اساس علائم</h3>
              <div className="flex flex-wrap gap-2">
                {suggestDrugs(selected).map((d) => (
                  <button
                    key={d.id}
                    onClick={() => addDrug(d.id)}
                    className="bg-white border border-emerald-300 rounded-lg px-3 py-1 text-sm hover:bg-emerald-100"
                  >
                    + {d.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 🔍 جستجوی دارو */}
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 جستجوی دارو از ۳۵ قلم..."
            className="w-full border border-stone-300 rounded-xl px-4 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
          <div className="max-h-40 overflow-y-auto bg-white rounded-xl shadow mb-4">
            {drugs
              .filter((d) => d.name.includes(search) || d.id.includes(search))
              .slice(0, 8)
              .map((d) => (
                <button
                  key={d.id}
                  onClick={() => addDrug(d.id)}
                  className="w-full text-right px-4 py-2 text-sm hover:bg-stone-50 border-b border-stone-100 last:border-0"
                >
                  + {d.name} <span className="text-stone-400 text-xs">({d.mizaj})</span>
                </button>
              ))}
          </div>

          {/* 📋 اقلام نسخه + هشدارها */}
          {items.length > 0 && (
            <div className="bg-white rounded-xl shadow p-4 mb-4">
              <h3 className="font-bold mb-2">📋 اقلام نسخه</h3>
              {items.map((it, i) => (
                <div key={i} className="flex justify-between items-center border-b border-stone-100 py-2 last:border-0">
                  <span className="text-sm">{it.name}</span>
                  <button onClick={() => removeDrug(i)} className="text-red-500 text-sm">
                    حذف
                  </button>
                </div>
              ))}
              {warn.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3 text-sm text-red-700">
                  {warn.map((w, i) => (
                    <p key={i}>⚠️ {w}</p>
                  ))}
                </div>
              )}
              <button
                onClick={issueNosxe}
                className="w-full bg-emerald-800 text-white py-3 rounded-xl font-bold mt-4 hover:bg-emerald-700 transition"
              >
                ✅ صدور نسخه
              </button>
            </div>
          )}

          {/* 📄 نسخه صادرشده */}
          {issued && (
            <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-emerald-800 animate-scale-in">
              <p className="text-center text-xs text-stone-400 mb-2">
                عطاری بهشت — طب سنتی مکمل طب نوین است، جایگزین پزشک نیست
              </p>
              <p className="text-center font-bold text-emerald-800">نسخه شماره {issued.shomare}</p>
              <p className="text-center text-sm text-stone-500">{issued.name} — {issued.date}</p>
              <ul className="my-4 text-sm space-y-2">
                {issued.items.map((it, i) => (
                  <li key={i}>💊 <b>{it.name}</b> — {it.usage}</li>
                ))}
              </ul>
              {issued.tadabir.length > 0 && (
                <div className="bg-amber-50 rounded-lg p-3 text-sm mb-4">
                  <b>تدبیر و پرهیز:</b>
                  <ul className="list-disc pr-5 mt-1">
                    {issued.tadabir.map((t, i) => <li key={i}>{t}</li>)}
                  </ul>
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex-1 bg-stone-800 text-white py-2 rounded-xl text-sm"
                >
                  🖨️ چاپ
                </button>
                <a
                  href={`https://wa.me/98issued.phone.slice(1)?text={issued.phone.slice(1)}?text=issued.phone.slice(1)?text={encodeURIComponent(
                    `نسخه شماره ${issued.shomare} صادر شد — عطاری بهشت`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-green-600 text-white py-2 rounded-xl text-sm text-center"
                >
                  💬 ارسال واتساپ
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
  }
      
