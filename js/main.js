/* ========== 蒙城县富民农资经营门市部 网站交互 ========== */

/* 1. 移动端菜单 */
const menuToggle = document.getElementById('menuToggle');
const menu = document.getElementById('menu');
menuToggle?.addEventListener('click', () => menu.classList.toggle('open'));
menu?.querySelectorAll('a').forEach(a =>
  a.addEventListener('click', () => menu.classList.remove('open'))
);

/* 2. 首页轮播 */
const slides = document.querySelectorAll('#slides .slide');
const dotsBox = document.getElementById('dots');
let current = 0;
let timer = null;

slides.forEach((_, i) => {
  const dot = document.createElement('span');
  if (i === 0) dot.classList.add('active');
  dot.addEventListener('click', () => goTo(i));
  dotsBox.appendChild(dot);
});
const dots = dotsBox.querySelectorAll('span');

function goTo(i) {
  slides[current].classList.remove('active');
  dots[current].classList.remove('active');
  current = i;
  slides[current].classList.add('active');
  dots[current].classList.add('active');
}
function next() { goTo((current + 1) % slides.length); }
function startAuto() { stopAuto(); timer = setInterval(next, 4500); }
function stopAuto() { if (timer) clearInterval(timer); }

if (slides.length) startAuto();
document.querySelector('.hero')?.addEventListener('mouseenter', stopAuto);
document.querySelector('.hero')?.addEventListener('mouseleave', startAuto);

/* 3. 产品中心数据 + 渲染 + 切换 */
const products = {
  seed: [
    { icon: '🌾', name: '玉米种子', desc: '高产抗病杂交玉米种，适合本地积温与茬口。', tag: '主推' },
    { icon: '🌿', name: '小麦种子', desc: '优质强筋/中筋小麦，发芽率高、分蘖强。', tag: '主推' },
    { icon: '🫘', name: '大豆种子', desc: '高蛋白大豆品种，抗倒伏、结荚密。', tag: '' },
    { icon: '🥜', name: '花生种子', desc: '高油花生，果大饱满、出仁率高。', tag: '' },
    { icon: '🌾', name: '水稻种子', desc: '优质稻种，分蘖力强、米质优。', tag: '' },
    { icon: '🥬', name: '蔬菜种子', desc: '番茄、辣椒、瓜果等经济作物包装种子。', tag: '' },
  ],
  fert: [
    { icon: '🧪', name: '复合肥', desc: '氮磷钾均衡配比，底肥追肥通用。', tag: '常用' },
    { icon: '⚗️', name: '尿素', desc: '高氮速效，促苗壮棵。', tag: '' },
    { icon: '🌱', name: '有机肥', desc: '腐熟农家肥/商品有机肥，改良土壤。', tag: '环保' },
    { icon: '💧', name: '叶面肥', desc: '微量元素叶面喷施，抗逆补素。', tag: '' },
    { icon: '🧫', name: '水溶肥', desc: '滴灌喷施两用，吸收快、利用率高。', tag: '' },
    { icon: '🪨', name: '中微量元素', desc: '钙镁硼锌等，防缺素黄化。', tag: '' },
  ],
  pest: [
    { icon: '🛡️', name: '杀虫剂', desc: '高效低毒，防治蚜虫、钻心虫等。', tag: '正规' },
    { icon: '🦠', name: '杀菌剂', desc: '防治白粉病、锈病、纹枯病等。', tag: '' },
    { icon: '🌾', name: '除草剂', desc: '苗前封闭与苗后茎叶处理任选。', tag: '' },
    { icon: '🌰', name: '种子处理剂', desc: '拌种包衣，防病防虫、促壮苗。', tag: '' },
    { icon: '🧴', name: '植物生长调节剂', desc: '控旺、膨果、生根，科学用量。', tag: '' },
  ],
};

const grid = document.getElementById('productGrid');
function renderProducts(cat) {
  grid.innerHTML = '';
  products[cat].forEach(p => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <div class="product-thumb">${p.icon}</div>
      <div class="product-body">
        <h3>${p.name}</h3>
        <p>${p.desc}</p>
        ${p.tag ? `<span class="product-tag">${p.tag}</span>` : ''}
      </div>`;
    grid.appendChild(card);
  });
}
renderProducts('seed');

document.querySelectorAll('#tabs .tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('#tabs .tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    renderProducts(tab.dataset.cat);
  });
});

/* 4. 数字滚动 */
const stats = document.querySelectorAll('.stat .num');
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const el = e.target;
      const target = +el.dataset.target;
      let n = 0;
      const step = Math.max(1, Math.floor(target / 40));
      const tick = setInterval(() => {
        n += step;
        if (n >= target) { n = target; clearInterval(tick); }
        el.textContent = n;
      }, 30);
      io.unobserve(el);
    }
  });
}, { threshold: 0.5 });
stats.forEach(s => io.observe(s));

/* 5. 返回顶部 */
const backTop = document.getElementById('backTop');
window.addEventListener('scroll', () => {
  backTop.classList.toggle('show', window.scrollY > 400);
});

/* 6. 年份 */
document.getElementById('year').textContent = new Date().getFullYear();

/* ================================================================
   8. 门店地图（双通道，永不白屏）
   通道 A（优先）：高德官方 JS API（需 AMAP_KEY + AMAP_SECURITY）
   通道 B（兜底）：Leaflet + 高德瓦片（免 Key，自动切换）
   门店坐标为写死实测值，加载快、落点准；两条通道外观一致。
   底图 POI 文字（如门店旁旧地名）归高德所有、无法改写，
   故本站只叠门店标记 + 口径说明，不叠加第三方地标。
   ================================================================ */
(function initStoreMap() {
  const box = document.getElementById('storeMap');
  if (!box) return;

  /* ---------------- 门店信息：以后只改这里就够了 ---------------- */
  const STORE = {
    shortName: '富民农资门市部',
    fullName: '蒙城县富民农资经营门市部',
    address: '安徽省亳州市蒙城县城关街道办事处涡河路93号',
    // 门店坐标（GCJ-02 高德坐标系）｜来源：高德 POI「富民农资公司，涡河路93号」
    // 需要微调时：手机高德长按门店 → 复制坐标（经度,纬度），替换下面两个值即可
    lng: 116.552589,
    lat: 33.271841,
    zoom: 16,
  };

  /* ---------------- 高德 Key：留空则直接走通道 B ---------------- */
  // 注意：2021-12-02 之后申请的 Key 必须同时填「安全密钥」，
  //      否则地图会报 INVALID_USER_SCODE（安全密钥不是 Key，别混用）。
  const AMAP_KEY = '082baaa541c64a5ff9dbe3f08bdd366b';
  const AMAP_SECURITY = '8d32a3a49c0c679071d5dc6b94f34c74';

  const NAV_URL = 'https://uri.amap.com/marker?position=' + STORE.lng + ',' + STORE.lat +
    '&name=' + encodeURIComponent(STORE.fullName) + '&coordinate=gaode&callnative=0';

  /* 两条通道共用的门店标记与信息窗（外观须与 .store-pin / .pin-label 一致） */
  const PIN_HTML =
    '<div class="store-pin"><span class="pin-label">' + STORE.shortName + '</span></div>';

  const INFO_HTML =
    '<div class="store-info"><strong>' + STORE.fullName + '</strong>' +
    '<p>' + STORE.address + '</p>' +
    '<a href="' + NAV_URL + '" target="_blank" rel="noopener">高德地图导航 ↗</a></div>';

  let rendered = false;   // 两条通道互斥，确保只渲染一次

  function syncOpenLink() {
    const a = document.querySelector('.map-open');
    if (a) a.href = NAV_URL;
  }

  /* 自绘的「标准地图 / 卫星影像」按钮：通道 B 用得上，通道 A 用高德原生控件 */
  function setSwitchBtns(show) {
    document.querySelectorAll('.map-btn').forEach(b => { b.style.display = show ? '' : 'none'; });
  }

  /* ================= 通道 A：高德官方 JS API ================= */
  function renderAmap() {
    if (rendered) return;
    rendered = true;
    syncOpenLink();

    const center = new AMap.LngLat(STORE.lng, STORE.lat);
    const map = new AMap.Map('storeMap', {
      viewMode: '2D',
      zoom: STORE.zoom,
      center: center,
      lang: 'zh_cn',
      resizeEnable: true,
      zooms: [4, 19],
    });

    // 门店标记：自定义外观（比默认蓝水滴醒目，且直接带店名）
    map.add(new AMap.Marker({
      position: center,
      content: PIN_HTML,
      offset: new AMap.Pixel(-70, -47),   // 让标记底部"针尖"正好落在坐标点上
      zIndex: 120,
      title: STORE.fullName,
    }));

    // 信息窗：默认展开，客户一眼看到店名、地址和导航入口
    new AMap.InfoWindow({
      content: INFO_HTML,
      offset: new AMap.Pixel(0, -110),
    }).open(map, center);

    setSwitchBtns(false);   // 用高德原生控件，隐藏自绘按钮
    AMap.plugin(['AMap.ToolBar', 'AMap.Scale', 'AMap.MapType'], function () {
      map.addControl(new AMap.ToolBar({ position: 'LT' }));
      map.addControl(new AMap.Scale());
      map.addControl(new AMap.MapType({ defaultType: 0 }));   // 标准 / 卫星
    });
  }

  /* ================= 通道 B：Leaflet + 高德瓦片（免 Key） ================= */
  function renderLeaflet() {
    if (rendered) return;
    rendered = true;
    syncOpenLink();
    setSwitchBtns(true);

    if (!window.L) {   // Leaflet 也没加载出来 → 纯文字兜底
      box.classList.add('map-fallback');
      box.innerHTML =
        '<p>地图组件未能加载（可能是网络原因），不影响浏览其它内容。</p>' +
        '<p>门店地址：' + STORE.address + '</p>' +
        '<a class="btn-outline" href="' + NAV_URL + '" target="_blank" rel="noopener">在高德地图查看位置</a>';
      return;
    }

    const TILE = { subdomains: ['1', '2', '3', '4'], minZoom: 3, maxZoom: 18 };
    const layers = {
      road: L.tileLayer(
        'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
        Object.assign({ attribution: '地图数据 © 高德地图' }, TILE)),
      sat: L.tileLayer(
        'https://webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
        Object.assign({ attribution: '影像 © 高德地图' }, TILE)),
    };

    const map = L.map(box, {
      center: [STORE.lat, STORE.lng], zoom: STORE.zoom,
      layers: [layers.road], zoomControl: true, scrollWheelZoom: false,
    });

    let activeLayer = 'road';
    document.querySelectorAll('.map-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.layer === 'sat' ? 'sat' : 'road';
        if (key === activeLayer) return;
        map.removeLayer(layers[activeLayer]);
        layers[key].addTo(map);
        activeLayer = key;
        document.querySelectorAll('.map-btn')
          .forEach(b => b.classList.toggle('active', b === btn));
      });
    });

    // 与通道 A 同一套门店标记外观
    L.marker([STORE.lat, STORE.lng], {
      icon: L.divIcon({
        className: 'store-pin-wrap',
        html: PIN_HTML,
        iconSize: [140, 52],
        iconAnchor: [70, 47],
        popupAnchor: [0, -56],
      }),
      title: STORE.fullName,
    }).addTo(map).bindPopup(INFO_HTML).openPopup();

    setTimeout(() => map.invalidateSize(), 200);
    window.addEventListener('resize', () => map.invalidateSize());
  }

  /* ================= 装配：优先通道 A，失败自动切通道 B ================= */
  if (!AMAP_KEY || !AMAP_KEY.trim()) { renderLeaflet(); return; }

  // 高德要求：安全密钥必须在加载 JS API 之前设置（静态站点常用的明文方式）
  if (AMAP_SECURITY) window._AMapSecurityConfig = { securityJsCode: AMAP_SECURITY };

  const script = document.createElement('script');
  script.src = 'https://webapi.amap.com/maps?v=1.4.15&key=' + AMAP_KEY +
    '&plugin=AMap.ToolBar,AMap.Scale,AMap.MapType';
  script.onload = function () {
    try {
      if (!window.AMap) throw new Error('AMap 未就绪');
      renderAmap();
    } catch (e) {          // Key 失效 / 域名未加白名单等 → 退回瓦片通道
      rendered = false;
      box.innerHTML = '';
      renderLeaflet();
    }
  };
  script.onerror = function () {
    rendered = false;
    renderLeaflet();
  };
  document.head.appendChild(script);

  // 看门狗：6 秒仍没出图（脚本超时被墙）→ 退回瓦片通道
  setTimeout(function () {
    if (!rendered) { box.innerHTML = ''; renderLeaflet(); }
  }, 6000);
})();

/* 9. 留言表单（演示：本地提示，不发送） */
const form = document.getElementById('contactForm');
const tip = document.getElementById('formTip');
form?.addEventListener('submit', e => {
  e.preventDefault();
  if (!form.checkValidity()) {
    tip.textContent = '请填写带 * 的必填项（称呼、电话、需求）。';
    tip.style.color = '#c62828';
    return;
  }
  tip.textContent = '✅ 演示提交成功！如需真正接收留言，请按使用说明接入免费表单服务。';
  tip.style.color = 'var(--green)';
  form.reset();
});
