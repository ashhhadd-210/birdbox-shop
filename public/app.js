/* Hollow & Home — storefront client.
   Hash routing, a localStorage basket, and a checkout that posts to /api/orders. */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const BASKET_KEY = 'hh.basket.v1';
  let CATALOG = null;
  let basket = load();

  /* ---------- money + text ---------- */

  const money = (n) => `£${n.toFixed(2)}`;
  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const byId = (id) => CATALOG.products.find((p) => p.id === id);
  const catName = (id) => (CATALOG.categories.find((c) => c.id === id) || {}).name || 'Shop';

  /* ---------- basket state ---------- */

  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(BASKET_KEY));
      return Array.isArray(raw) ? raw.filter((l) => l && l.id && l.qty > 0) : [];
    } catch {
      return [];
    }
  }

  function save() {
    try {
      localStorage.setItem(BASKET_KEY, JSON.stringify(basket));
    } catch {
      /* private mode — the basket just won't survive a reload */
    }
    paintBasketCount();
  }

  const basketCount = () => basket.reduce((s, l) => s + l.qty, 0);
  const subtotal = () => basket.reduce((s, l) => s + (byId(l.id)?.price || 0) * l.qty, 0);

  function add(id, qty = 1) {
    const p = byId(id);
    if (!p || p.stock < 1) return;
    const line = basket.find((l) => l.id === id);
    const next = Math.min(p.stock, (line ? line.qty : 0) + qty);
    if (line) line.qty = next;
    else basket.push({ id, qty: next });
    save();
    toast(`${p.name} added to your basket`);
  }

  function setQty(id, qty) {
    const p = byId(id);
    const line = basket.find((l) => l.id === id);
    if (!line) return;
    line.qty = Math.max(0, Math.min(p ? p.stock : 20, qty));
    if (line.qty === 0) basket = basket.filter((l) => l.id !== id);
    save();
    paintDrawer();
    if (location.hash.startsWith('#checkout')) paintCheckout();
  }

  /* ---------- chrome ---------- */

  function paintBasketCount() {
    $('#basketCount').textContent = basketCount();
  }

  let toastTimer;
  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (el.hidden = true), 2600);
  }

  /* ---------- cards ---------- */

  function stockTag(p) {
    if (p.stock === 0) return '<span class="tag tag--out">Sold out</span>';
    if (p.stock <= 5) return `<span class="tag tag--low">Only ${p.stock} left</span>`;
    return '';
  }

  function card(p) {
    const off = p.compareAt ? `<s>${money(p.compareAt)}</s>` : '';
    return `
      <article class="pcard">
        <a class="pcard__media" href="#product/${p.id}" data-nav="product/${p.id}">
          <img src="${p.img}" alt="${esc(p.name)}" width="640" height="520" loading="lazy">
          <div class="pcard__badges">
            ${p.badge ? `<span class="tag${p.compareAt ? ' tag--offer' : ''}">${esc(p.badge)}</span>` : ''}
            ${stockTag(p)}
          </div>
        </a>
        <div class="pcard__body">
          <h3 class="pcard__name"><a href="#product/${p.id}" data-nav="product/${p.id}">${esc(p.name)}</a></h3>
          <p class="pcard__tag">${esc(p.tagline)}</p>
          <div class="pcard__meta">
            <span class="stars" aria-hidden="true">★★★★★</span>
            <span>${p.rating} (${p.reviews})</span>
            <span>·</span>
            <span>${p.holeMm ? `${p.holeMm}mm hole` : 'open front'}</span>
          </div>
          <div class="pcard__foot">
            <span class="price">${money(p.price)}${off}</span>
            <button class="addbtn" data-add="${p.id}" ${p.stock === 0 ? 'disabled' : ''}>
              ${p.stock === 0 ? 'Sold out' : 'Add to basket'}
            </button>
          </div>
        </div>
      </article>`;
  }

  const sorters = {
    featured: (a, b) => Number(b.bestseller) - Number(a.bestseller) || b.rating - a.rating,
    'price-asc': (a, b) => a.price - b.price,
    'price-desc': (a, b) => b.price - a.price,
    rating: (a, b) => b.rating - a.rating || b.reviews - a.reviews,
  };

  function paintGrid(el, products, sort) {
    el.innerHTML = products.slice().sort(sorters[sort] || sorters.featured).map(card).join('');
  }

  /* ---------- home ---------- */

  const PROMISE_ICONS = {
    guarantee: '<svg viewBox="0 0 32 32"><path d="M16 3l11 4v9c0 7-5 11-11 13C10 27 5 23 5 16V7l11-4z" fill="#eaf0e6" stroke="#3f6b3c" stroke-width="1.8"/><path d="M11 16l4 4 7-8" fill="none" stroke="#3f6b3c" stroke-width="2.2" stroke-linecap="round"/></svg>',
    timber: '<svg viewBox="0 0 32 32"><path d="M16 3L6 18h20L16 3z" fill="#3f6b3c"/><path d="M16 11l-6 10h12l-6-10z" fill="#5a8f52"/><rect x="14" y="21" width="4" height="8" rx="1.5" fill="#8a5628"/></svg>',
    hand: '<svg viewBox="0 0 32 32"><path d="M6 20c0-3 2-5 5-5h3V6a2.5 2.5 0 015 0v9h2V8a2.5 2.5 0 015 0v13c0 5-4 8-9 8s-11-3-11-9z" fill="#f4ece1" stroke="#8a5628" stroke-width="1.8"/></svg>',
    spec: '<svg viewBox="0 0 32 32"><rect x="5" y="4" width="22" height="24" rx="3" fill="#fff" stroke="#3f6b3c" stroke-width="1.8"/><path d="M10 11h12M10 16h12M10 21h7" stroke="#3f6b3c" stroke-width="1.8" stroke-linecap="round"/></svg>',
  };

  function paintHome() {
    paintGrid($('#homeGrid'), CATALOG.products.filter((p) => p.bestseller || p.badge), $('#homeSort').value);

    $('#promises').innerHTML = CATALOG.promises
      .map(
        (x) => `<div class="promise">${PROMISE_ICONS[x.icon] || ''}<h3>${esc(x.title)}</h3><p>${esc(x.text)}</p></div>`
      )
      .join('');

    $('#charities').innerHTML = CATALOG.charities
      .map((c) => `<div class="charity"><strong>${esc(c.name)}</strong><span>${esc(c.note)}</span></div>`)
      .join('');

    $('#footLinks').innerHTML = CATALOG.products
      .filter((p) => p.bestseller)
      .slice(0, 5)
      .map((p) => `<li><a href="#product/${p.id}" data-nav="product/${p.id}">${esc(p.name)}</a></li>`)
      .join('');
  }

  /* ---------- shop ---------- */

  let shopCat = 'bird';

  function paintShop(cat) {
    shopCat = cat || shopCat;
    const c = CATALOG.categories.find((x) => x.id === shopCat);
    $('#shopTitle').textContent = c ? c.name : 'Everything';
    $('#shopBlurb').textContent = c ? c.blurb : '';
    $('#shopCrumb').textContent = c ? c.name : 'Shop';

    $('#catChips').innerHTML = CATALOG.categories
      .map(
        (x) =>
          `<button class="chip${x.id === shopCat ? ' is-active' : ''}" data-cat="${x.id}">${esc(x.name)}</button>`
      )
      .join('');

    paintGrid($('#shopGrid'), CATALOG.products.filter((p) => p.cat === shopCat), $('#shopSort').value);
  }

  /* ---------- product detail ---------- */

  let pdpQty = 1;

  function paintProduct(id) {
    const p = byId(id);
    if (!p) return go('shop/bird');
    pdpQty = 1;

    const stockClass = p.stock === 0 ? 'is-out' : p.stock <= 5 ? 'is-low' : '';
    const stockText =
      p.stock === 0 ? '<b>Sold out</b> — ring the workshop for the next batch'
      : p.stock <= 5 ? `<b>Only ${p.stock} left</b> in this batch`
      : `<b>In stock</b> — cut and posted within two working days`;

    $('#productPane').innerHTML = `
      <nav class="crumbs">
        <a href="#home" data-nav="home">Home</a> <span>/</span>
        <a href="#shop/${p.cat}" data-nav="shop/${p.cat}">${esc(catName(p.cat))}</a> <span>/</span>
        <b>${esc(p.name)}</b>
      </nav>
      <div class="pdp">
        <div class="pdp__art">
          <img src="${p.img}" alt="${esc(p.name)}" width="640" height="520">
          <div class="pdp__thumbs">
            <div>${esc(p.wood)}</div>
            <div>${p.holeMm ? `${p.holeMm}mm entrance` : 'Open front'}</div>
            <div>${esc(p.dims)}</div>
          </div>
        </div>
        <div class="pdp__info">
          ${p.badge ? `<span class="tag${p.compareAt ? ' tag--offer' : ''}">${esc(p.badge)}</span>` : ''}
          <h1>${esc(p.name)}</h1>
          <div class="pdp__rating">
            <span class="stars" aria-hidden="true">★★★★★</span>
            <span>${p.rating} from ${p.reviews} reviews</span>
          </div>
          <div class="pdp__price">
            <span class="price">${money(p.price)}</span>
            ${p.compareAt ? `<s style="color:var(--ink-3)">${money(p.compareAt)}</s>` : ''}
            <span style="font-size:.85rem;color:var(--ink-3)">Free UK shipping</span>
          </div>
          <p class="pdp__story">${esc(p.story)}</p>
          <ul class="ticks">${p.features.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
          <div class="buybar">
            <div class="stepper">
              <button data-pdp="-" aria-label="Fewer">−</button>
              <span id="pdpQty">1</span>
              <button data-pdp="+" aria-label="More">+</button>
            </div>
            <button class="btn btn--primary" data-add="${p.id}" data-usepdpqty="1" ${p.stock === 0 ? 'disabled' : ''}>
              ${p.stock === 0 ? 'Sold out' : `Add to basket — ${money(p.price)}`}
            </button>
          </div>
          <p class="stockline ${stockClass}">${stockText}</p>
          <table class="spec">
            <tr><th>Suits</th><td>${p.birds.map(esc).join(', ')}</td></tr>
            <tr><th>Timber</th><td>${esc(p.wood)}</td></tr>
            <tr><th>Entrance</th><td>${p.holeMm ? `${p.holeMm}mm` : 'Open front'}</td></tr>
            <tr><th>Dimensions</th><td>${esc(p.dims)}</td></tr>
            <tr><th>Guarantee</th><td>5 years</td></tr>
            <tr><th>Delivery</th><td>Free UK shipping, 2–3 working days</td></tr>
          </table>
        </div>
      </div>
      <div class="band" style="padding-top:0">
        <div class="band__head"><div><p class="eyebrow">You might also like</p><h2>More ${esc(catName(p.cat)).toLowerCase()}</h2></div></div>
        <div class="grid">
          ${CATALOG.products.filter((x) => x.cat === p.cat && x.id !== p.id).slice(0, 3).map(card).join('')}
        </div>
      </div>`;
  }

  /* ---------- checkout ---------- */

  function paintCheckout() {
    const pane = $('#checkoutPane');

    if (!basket.length) {
      pane.innerHTML = `
        <div class="empty" style="grid-column:1/-1">
          <p>Your basket is empty.</p>
          <a class="btn btn--primary" href="#shop/bird" data-nav="shop/bird">Shop the boxes</a>
        </div>`;
      return;
    }

    const lines = basket.map((l) => ({ p: byId(l.id), qty: l.qty })).filter((x) => x.p);
    const sub = lines.reduce((s, x) => s + x.p.price * x.qty, 0);
    const trees = lines.reduce((s, x) => s + x.qty * 2, 0);

    pane.innerHTML = `
      <form class="card form" id="orderForm" novalidate>
        <h2>Delivery details</h2>
        <p style="font-size:.87rem;color:var(--ink-2);margin:0">This is a demonstration storefront — no card details are asked for and no payment is taken.</p>
        <div id="orderErrors"></div>
        <label>Full name <input name="name" required autocomplete="name"></label>
        <div class="form__row">
          <label>Email <input name="email" type="email" required autocomplete="email"></label>
          <label>Telephone <input name="phone" autocomplete="tel"></label>
        </div>
        <label>Address line 1 <input name="address1" required autocomplete="address-line1"></label>
        <label>Address line 2 <input name="address2" autocomplete="address-line2"></label>
        <div class="form__row">
          <label>Town or city <input name="city" required autocomplete="address-level2"></label>
          <label>Postcode <input name="postcode" required autocomplete="postal-code"></label>
        </div>
        <label>Delivery notes <textarea name="notes" rows="3" placeholder="Safe place to leave it, gate codes, that sort of thing"></textarea></label>
        <button class="btn btn--primary btn--wide" type="submit" id="placeBtn">Place order — ${money(sub)}</button>
      </form>

      <aside class="card summary">
        <h2>Your order</h2>
        ${lines
          .map(
            (x) => `
          <div class="sumitem">
            <img src="${x.p.img}" alt="" width="60">
            <div style="flex:1">
              <b>${esc(x.p.name)}</b>
              <small>${x.qty} × ${money(x.p.price)}</small>
            </div>
            <span>${money(x.p.price * x.qty)}</span>
          </div>`
          )
          .join('')}
        <div class="sumline"><span>Subtotal</span><span>${money(sub)}</span></div>
        <div class="sumline"><span>UK shipping</span><span>Free</span></div>
        <div class="sumline sumline--total"><span>Total</span><span>${money(sub)}</span></div>
        <ul class="reassure">
          <li>${trees} native trees planted with this order</li>
          <li>5 year guarantee on every box</li>
          <li>Made in Kent from sustainable timber</li>
          <li>Free UK shipping, 2–3 working days</li>
        </ul>
      </aside>`;

    $('#orderForm').addEventListener('submit', submitOrder);
  }

  async function submitOrder(ev) {
    ev.preventDefault();
    const form = ev.target;
    const btn = $('#placeBtn');
    const errBox = $('#orderErrors');
    const customer = Object.fromEntries(new FormData(form).entries());

    btn.disabled = true;
    btn.textContent = 'Placing your order…';
    errBox.innerHTML = '';

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer, items: basket }),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        errBox.innerHTML = `<div class="errors"><strong>We could not place that order:</strong><ul>${(data.errors || ['Something went wrong.'])
          .map((e) => `<li>${esc(e)}</li>`)
          .join('')}</ul></div>`;
        btn.disabled = false;
        btn.textContent = 'Place order';
        errBox.scrollIntoView({ block: 'center' });
        return;
      }

      basket = [];
      save();
      CATALOG = await (await fetch('/api/catalog')).json(); // stock moved
      paintThanks(data.order);
      go('thanks');
    } catch {
      errBox.innerHTML = `<div class="errors">The workshop server did not respond. Is it still running?</div>`;
      btn.disabled = false;
      btn.textContent = 'Place order';
    }
  }

  function paintThanks(order) {
    $('#thanksPane').innerHTML = `
      <div class="thanks">
        <svg class="thanks__mark" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="29" fill="#eaf0e6" stroke="#3f6b3c" stroke-width="2"/>
          <path d="M20 33l8 9 16-19" fill="none" stroke="#3f6b3c" stroke-width="4" stroke-linecap="round"/>
        </svg>
        <p class="eyebrow">Order received</p>
        <h1>Thank you, ${esc(order.customer.name.split(' ')[0])}</h1>
        <p class="thanks__ref">${esc(order.ref)}</p>
        <p class="lede" style="margin-inline:auto">We have emailed a confirmation to ${esc(order.customer.email)}. Your boxes go on the bench this week and we will send a tracking number the day they post. ${order.treesPlanted} native trees have been added to this winter&rsquo;s planting.</p>
        <div class="card">
          <h2>Order summary</h2>
          ${order.items
            .map(
              (i) => `<div class="sumline"><span>${esc(i.name)} × ${i.qty}</span><span>${money(i.lineTotal)}</span></div>`
            )
            .join('')}
          <div class="sumline"><span>UK shipping</span><span>Free</span></div>
          <div class="sumline sumline--total"><span>Total paid on delivery</span><span>${money(order.total)}</span></div>
          <div class="sumline" style="margin-top:1rem"><span>Delivering to</span><span style="text-align:right">${esc(order.customer.address1)}<br>${esc(order.customer.city)} ${esc(order.customer.postcode)}</span></div>
        </div>
        <p style="margin-top:2rem"><a class="btn btn--ghost" href="#home" data-nav="home">Back to the workshop</a></p>
      </div>`;
  }

  /* ---------- drawer ---------- */

  function paintDrawer() {
    const body = $('#drawerBody');
    const foot = $('#drawerFoot');

    if (!basket.length) {
      body.innerHTML = `
        <div class="empty">
          <svg viewBox="0 0 24 24"><path d="M6 8h12l-1.2 11a2 2 0 0 1-2 1.8H9.2a2 2 0 0 1-2-1.8L6 8Zm3 0a3 3 0 0 1 6 0" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>
          <p>Nothing in the basket yet.</p>
        </div>`;
      foot.innerHTML = `<a class="btn btn--primary btn--wide" href="#shop/bird" data-nav="shop/bird">Shop the boxes</a>`;
      return;
    }

    body.innerHTML = basket
      .map((l) => {
        const p = byId(l.id);
        if (!p) return '';
        return `
        <div class="bitem">
          <img src="${p.img}" alt="" width="76">
          <div class="bitem__main">
            <b>${esc(p.name)}</b>
            <small>${money(p.price)} each${p.stock <= 5 ? ` · only ${p.stock} left` : ''}</small>
            <div class="bitem__row">
              <div class="qty">
                <button data-qty="-" data-id="${p.id}" aria-label="Fewer">−</button>
                <span>${l.qty}</span>
                <button data-qty="+" data-id="${p.id}" aria-label="More">+</button>
              </div>
              <strong>${money(p.price * l.qty)}</strong>
            </div>
            <button class="linkbtn" data-remove="${p.id}">Remove</button>
          </div>
        </div>`;
      })
      .join('');

    foot.innerHTML = `
      <div class="sumline"><span>Subtotal</span><span>${money(subtotal())}</span></div>
      <div class="sumline"><span>UK shipping</span><span>Free</span></div>
      <div class="sumline sumline--total"><span>Total</span><span>${money(subtotal())}</span></div>
      <a class="btn btn--primary btn--wide" href="#checkout" data-nav="checkout" style="margin-top:.9rem">Checkout</a>`;
  }

  const openDrawer = () => {
    paintDrawer();
    $('#drawer').hidden = false;
    $('#scrim').hidden = false;
    document.body.style.overflow = 'hidden';
  };
  const closeDrawer = () => {
    $('#drawer').hidden = true;
    $('#scrim').hidden = true;
    document.body.style.overflow = '';
  };

  /* ---------- routing ---------- */

  const VIEWS = ['home', 'shop', 'product', 'checkout', 'thanks', 'about', 'contact'];

  function go(route) {
    location.hash = `#${route}`;
  }

  function route() {
    const raw = (location.hash || '#home').slice(1);
    const [name, arg] = raw.split('/');
    const view = VIEWS.includes(name) ? name : 'home';

    if (view === 'shop') paintShop(arg);
    if (view === 'product') paintProduct(arg);
    if (view === 'checkout') paintCheckout();

    VIEWS.forEach((v) => ($(`#view-${v}`).hidden = v !== view));
    $$('.nav a').forEach((a) => a.classList.toggle('is-active', a.dataset.nav === raw));
    $('#nav')?.classList.remove('is-open');
    $('.nav').classList.remove('is-open');
    closeDrawer();
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  /* ---------- events ---------- */

  document.addEventListener('click', (ev) => {
    const t = ev.target;

    const addBtn = t.closest('[data-add]');
    if (addBtn && !addBtn.disabled) {
      const qty = addBtn.dataset.usepdpqty ? pdpQty : 1;
      add(addBtn.dataset.add, qty);
      openDrawer();
      return;
    }

    const pdpBtn = t.closest('[data-pdp]');
    if (pdpBtn) {
      const p = byId(location.hash.split('/')[1]);
      const max = p ? Math.max(1, p.stock) : 10;
      pdpQty = Math.max(1, Math.min(max, pdpQty + (pdpBtn.dataset.pdp === '+' ? 1 : -1)));
      $('#pdpQty').textContent = pdpQty;
      return;
    }

    const qtyBtn = t.closest('[data-qty]');
    if (qtyBtn) {
      const line = basket.find((l) => l.id === qtyBtn.dataset.id);
      setQty(qtyBtn.dataset.id, (line ? line.qty : 0) + (qtyBtn.dataset.qty === '+' ? 1 : -1));
      return;
    }

    const rm = t.closest('[data-remove]');
    if (rm) return setQty(rm.dataset.remove, 0);

    const chip = t.closest('[data-cat]');
    if (chip) return go(`shop/${chip.dataset.cat}`);

    if (t.closest('#basketBtn')) return openDrawer();
    if (t.closest('#drawerClose') || t.closest('#scrim')) return closeDrawer();
    if (t.closest('#burger')) return $('.nav').classList.toggle('is-open');
  });

  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') closeDrawer();
  });

  $('#homeSort').addEventListener('change', () =>
    paintGrid($('#homeGrid'), CATALOG.products.filter((p) => p.bestseller || p.badge), $('#homeSort').value)
  );
  $('#shopSort').addEventListener('change', () => paintShop());

  $('#contactForm').addEventListener('submit', (ev) => {
    ev.preventDefault();
    if (!ev.target.reportValidity()) return;
    ev.target.reset();
    $('#contactNote').hidden = false;
    toast('Message sent — we reply within two working days');
  });

  window.addEventListener('hashchange', route);

  /* ---------- boot ---------- */

  fetch('/api/catalog')
    .then((r) => r.json())
    .then((data) => {
      CATALOG = data;
      // drop anything stale from a previous catalogue
      basket = basket.filter((l) => byId(l.id));
      save();
      paintHome();
      route();
    })
    .catch(() => {
      $('#main').innerHTML =
        '<div class="wrap band"><h1>The workshop server is not responding</h1><p class="lede">Start it with <code>node server.js</code> and reload this page.</p></div>';
    });
})();
