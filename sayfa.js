// Sayfa arayuzu: atlayis dugmeleri, HUD, varis paneli, boya kartelasi, talep taslagi.
(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const tuval = $('#ucus3d');
  const KAPI = {
    watergarden: { ozet: 'Çarşı katında moda, kumaş ve terzi. Yeni evin için ilk alışveriş ve ilk prova burada başlar.', kapilar: ['Online terzi: ölçü ve prova talebi', 'Kumaş ve iplik: doğal boya seçkisi', 'Canlı podyum: afair.live'], konu: 0 },
    finanskent: { ozet: 'İş, fırsat ve elektronik. Taşındığın hafta ihtiyacın olan teknik altyapı ve iş bağlantıları bu yönde.', kapilar: ['Dairem için elektronik kurulum talebi', 'İş ve fırsat buluşmaları', 'Bina teknik destek: Modern Ataşehir'], konu: 2 },
    maltepe: { ozet: 'Sahil, açık alan ve sahne. Konser, miting ve buluşmalar; şehirle tanışmanın en kalabalık yolu.', kapilar: ['Sanat ve konser takibi', 'Mahalle buluşma önerisi', 'Hafta sonu tarım danışmanı randevusu'], konu: 3 },
  };
  const hazir = () => {
    const U = window.UCUS; if (!U) return;
    const kutu = $('#atlayis');
    U.HEDEF.forEach((h, i) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'atla-dugme';
      b.style.setProperty('--iplik', h.boya.tonlar[1]);
      b.append(Object.assign(document.createElement('span'), { className: 'blok', textContent: `${h.blok} Blok` }),
        Object.assign(document.createElement('b'), { textContent: h.ad }), Object.assign(document.createElement('small'), { textContent: `${h.alt} · ${h.boya.ad.toLowerCase()} ipliği` }));
      b.addEventListener('click', () => U.ucusBasla(i)); kutu.append(b);
    });
    const kart = $('#boyalar');
    U.HEDEF.forEach((h) => {
      const k = document.createElement('article'); k.className = 'boya';
      const serit = document.createElement('div'); serit.className = 'lifler';
      h.boya.tonlar.forEach((t) => { const l = document.createElement('i'); l.style.setProperty('--ton', t); serit.append(l); });
      k.append(serit, Object.assign(document.createElement('h3'), { textContent: h.boya.ad }),
        Object.assign(document.createElement('p'), { textContent: `${h.boya.bitki} · ${h.blok} Blok → ${h.ad}` }));
      kart.append(k);
    });
  };
  tuval.addEventListener('ucus-durum', (e) => {
    const d = e.detail; document.body.dataset.kip = d.ad === 'basladi' ? 'uc' : d.ad === 'vardi' ? 'vardi' : d.ad === 'sec' ? 'sec' : document.body.dataset.kip;
    if (d.ad === 'hazir') hazir();
    if (d.ad === 'yok') $('#durum').textContent = 'Bu tarayıcı WebGL2 desteklemiyor; uçuş sahnesi açılamadı. Yaşam kapısı aşağıda çalışır.';
    if (d.ad === 'basladi') {
      $('#giris').hidden = true; $('#varis').hidden = true; $('#hud').hidden = false;
      $('#hud-blok').textContent = `${d.blok} Blok`; $('#hud-ad').textContent = d.hedef; $('#hud-sayi').textContent = '0';
      $('#hud-iplik').textContent = `İz: ${d.boya.ad} · ${d.boya.bitki}`; $('#hud-iplik').style.setProperty('--iplik', d.boya.tonlar[1]);
      tuval.focus({ preventScroll: true });
    }
    if (d.ad === 'halka') $('#hud-sayi').textContent = String(d.gecen);
    if (d.ad === 'vardi') {
      const k = KAPI[d.id]; $('#hud').hidden = true; $('#varis').hidden = false;
      $('#varis-ust').textContent = `${d.halka} / ${d.toplam} halka · ${d.boya.ad} ipliği`;
      $('#varis-ad').textContent = d.hedef; $('#varis-ozet').textContent = k.ozet;
      $('#varis-kapilar').replaceChildren(...k.kapilar.map((m) => Object.assign(document.createElement('li'), { textContent: m })));
      $('#varis-talep').onclick = () => { $('#t-konu').selectedIndex = k.konu; };
    }
    if (d.ad === 'sec') { $('#giris').hidden = false; $('#hud').hidden = true; $('#varis').hidden = true; }
  });
  if (window.UCUS) hazir();
  $('#vazgec').addEventListener('click', () => window.UCUS && window.UCUS.sifirla());
  $('#tekrar').addEventListener('click', () => window.UCUS && window.UCUS.sifirla());

  // talep taslagi: hicbir yere gonderilmez
  const sonuc = $('#t-sonuc'), durum = $('#t-durum');
  $('#talep').addEventListener('submit', (e) => {
    e.preventDefault();
    const not = $('#t-not').value.trim();
    if (!not) { durum.textContent = 'Önce ihtiyacını yaz.'; sonuc.value = ''; return; }
    sonuc.value = ['TALEP TASLAĞI — GÖNDERİLMEDİ', `Konu: ${$('#t-konu').value}`, `Tercih: ${$('#t-gun').value || 'gün seçilmedi'} · ${$('#t-saat').value}`, '', not,
      '', 'Not: müsaitlik ve randevu sistemi henüz bağlı değil; bu taslağı ilgili siteye kendin ilet.'].join('\n');
    durum.textContent = 'Taslak hazır. Hiçbir yere gönderilmedi.';
  });
  for (const id of ['#t-konu', '#t-gun', '#t-saat', '#t-not']) $(id).addEventListener('input', () => { sonuc.value = ''; });
  $('#t-indir').addEventListener('click', () => {
    if (!sonuc.value) { durum.textContent = 'Önce taslağı hazırla.'; return; }
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([sonuc.value], { type: 'text/plain;charset=utf-8' })), download: 'yasam-kapisi-talep.txt' });
    a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
})();
