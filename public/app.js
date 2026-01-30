// IMPORTANT:
// Auto checkout will work ONLY when the site is running with the backend (Render/Node).
// Because the browser calls YOUR server route below, not UPayments directly.
const UPAYMENTS_CREATE_URL = "/api/upayments/create";

// Products
const products = [
  { id: "p1", name: "Casio G-Shock (Test)", price: 19.900, note: "Demo product" },
  { id: "p2", name: "Vintage Digital (Test)", price: 9.500, note: "Demo product" },
  { id: "p3", name: "Premium Strap (Test)", price: 3.250, note: "Demo product" },
];

const state = { cart: new Map() };
const $ = (id) => document.getElementById(id);

function fmtKWD(x){ return `${Number(x).toFixed(3)} KWD`; }

function cartCount(){
  let c = 0;
  for (const q of state.cart.values()) c += q;
  return c;
}

function cartTotal(){
  let t = 0;
  for (const [id, q] of state.cart.entries()){
    const p = products.find(pp => pp.id === id);
    t += p.price * q;
  }
  return t;
}

function renderProducts(){
  $("products").innerHTML = products.map(p => `
    <div class="card">
      <div class="thumb">${p.note}</div>
      <div class="name">${p.name}</div>
      <div class="price">${fmtKWD(p.price)}</div>
      <div class="actions">
        <button class="btn" onclick="addToCart('${p.id}', 1)">Add</button>
        <button class="btn primary" onclick="addToCart('${p.id}', 1); openCart()">Add + Checkout</button>
      </div>
    </div>
  `).join("");
}

function renderCart(){
  $("cartCount").textContent = cartCount();
  $("cartTotal").textContent = fmtKWD(cartTotal());

  const items = $("cartItems");
  if (state.cart.size === 0){
    items.innerHTML = `<div class="hint">Your cart is empty.</div>`;
    return;
  }

  items.innerHTML = [...state.cart.entries()].map(([id, qty]) => {
    const p = products.find(pp => pp.id === id);
    return `
      <div class="line">
        <div>
          <div><strong>${p.name}</strong></div>
          <small>${fmtKWD(p.price)} each</small>
        </div>
        <div style="text-align:right">
          <div class="qty">
            <button onclick="addToCart('${id}', -1)">−</button>
            <strong>${qty}</strong>
            <button onclick="addToCart('${id}', 1)">+</button>
          </div>
          <small>${fmtKWD(p.price * qty)}</small>
        </div>
      </div>
    `;
  }).join("");
}

window.addToCart = function(id, delta){
  const cur = state.cart.get(id) || 0;
  const next = cur + delta;
  if (next <= 0) state.cart.delete(id);
  else state.cart.set(id, next);
  renderCart();
};

function openCart(){
  $("drawer").classList.add("open");
  $("backdrop").classList.add("show");
}
function closeCart(){
  $("drawer").classList.remove("open");
  $("backdrop").classList.remove("show");
}

$("openCartBtn").addEventListener("click", openCart);
$("closeCartBtn").addEventListener("click", closeCart);
$("backdrop").addEventListener("click", closeCart);

// Payment - Auto
async function payWithUPaymentsAuto(){
  const total = cartTotal();
  $("hint").textContent = "";

  if (total <= 0){
    $("hint").textContent = "Add items to cart first.";
    return;
  }

  const name = ($("custName").value || "Test Customer").trim();
  const email = ($("custEmail").value || "test@test.com").trim();
  const mobile = ($("custMobile").value || "96550000000").trim();

  const now = Date.now();

  // Payload format that worked for you in Postman:
  const payload = {
    language: "en",
    order: {
      id: `ORDER${now}`,
      currency: "KWD",
      amount: total.toFixed(3)
    },
    reference: { id: `REF${now}` },
    returnUrl: `${location.origin}/success.html`,
    cancelUrl: `${location.origin}/cancel.html`,
    notificationUrl: `${location.origin}/notify`, // demo placeholder
    customer: { name, email, mobile }
  };

  try{
    $("upayAutoBtn").disabled = true;
    $("upayAutoBtn").textContent = "Creating session…";

    const r = await fetch(UPAYMENTS_CREATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await r.json();

    const url =
      data?.paymentURL ||
      data?.payment_url ||
      data?.redirectUrl ||
      data?.redirect_url ||
      data?.url ||
      data?.payment_link;

    if (!url){
      $("hint").textContent = "No payment link returned. Check console (F12).";
      console.log("UPayments response:", data);
      $("upayAutoBtn").disabled = false;
      $("upayAutoBtn").textContent = "Pay with UPayments (Auto)";
      return;
    }

    window.location.href = url;
  } catch (e){
    $("hint").textContent = "Network/server error. (Check Render logs if hosted.)";
    console.log("Error:", e);
    $("upayAutoBtn").disabled = false;
    $("upayAutoBtn").textContent = "Pay with UPayments (Auto)";
  }
}

$("upayAutoBtn").addEventListener("click", payWithUPaymentsAuto);

// Payment - Manual Link (still useful as backup)
$("manualGoBtn").addEventListener("click", () => {
  const link = ($("manualLink").value || "").trim();
  $("hint").textContent = "";

  if (!link.startsWith("https://sandbox.upayments.com")){
    $("hint").textContent = "Paste a valid sandbox link (starts with https://sandbox.upayments.com).";
    return;
  }

  window.location.href = link;
});

// Init
renderProducts();
renderCart();
