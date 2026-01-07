
/* =========================
   LOGIN CHECK
========================= */
const loggedUser = JSON.parse(localStorage.getItem("loggedUser"));

if (!loggedUser || !loggedUser.id) {
  alert("Please login first");
  window.location.href = "login.html";
}

/* =========================
   USER-SPECIFIC CART KEY
========================= */
const CART_KEY = `cart_${loggedUser.id}`;

/* =========================
   ADMIN SETTINGS
========================= */
const adminSettings = JSON.parse(localStorage.getItem("adminSettings")) || {
  deliveryCharge: 40,
  discountType: "percent", // flat | percent
  discountValue: 0
};

/* =========================
   GLOBAL STATE
========================= */
let selectedAddress = null;

/* =========================
   PRICE PARSER (FIX NaN)
========================= */
function parsePrice(price) {
  return Number(price.replace(/[₹,]/g, ""));
}

/* =========================
   GET CHECKOUT ITEMS
========================= */
function getCheckoutItems() {
  const buyNow = JSON.parse(localStorage.getItem("buyNow"));
  if (buyNow) return [buyNow];

  return JSON.parse(localStorage.getItem(CART_KEY)) || [];
}

/* =========================
   CALCULATE TOTALS
========================= */
function calculateTotals(items) {
  let subtotal = 0;

  items.forEach(item => {
    const price = parsePrice(item.price);
    subtotal += price * item.qty;
  });

  let discount = 0;
  if (adminSettings.discountType === "percent") {
    discount = Math.round(subtotal * adminSettings.discountValue / 100);
  } else {
    discount = adminSettings.discountValue;
  }

  let deliveryCharge = subtotal >= 999 ? 0 : adminSettings.deliveryCharge;
  const total = subtotal - discount + deliveryCharge;

  return { subtotal, discount, deliveryCharge, total };
}

/* =========================
   RENDER ORDER SUMMARY
========================= */
function renderSummary() {
  const items = getCheckoutItems();
  const container = document.getElementById("orderItems");

  if (!container) return;

  container.innerHTML = "";

  if (!items.length) {
    container.innerHTML = "<p>Your cart is empty</p>";
    setTotals(0, 0, 0, 0);
    return;
  }

  items.forEach(item => {
    const price = parsePrice(item.price);
    const itemTotal = price * item.qty;

    let variant = "";
    if (item.rom) variant = ` (${item.rom})`;
    else if (item.size) variant = ` (Size: ${item.size})`;

    container.innerHTML += `
      <div class="summary-item">
        <span>${item.title}${variant} × ${item.qty}</span>
        <span>₹${itemTotal.toLocaleString("en-IN")}</span>
      </div>
    `;
  });

  const { subtotal, discount, deliveryCharge, total } =
    calculateTotals(items);

  setTotals(subtotal, discount, deliveryCharge, total);
}

/* =========================
   SET TOTAL VALUES
========================= */
function setTotals(sub, dis, del, tot) {
  document.getElementById("subtotal").innerText =
    "₹" + sub.toLocaleString("en-IN");

  document.getElementById("discount").innerText =
    "₹" + dis.toLocaleString("en-IN");

  document.getElementById("delivery").innerText =
    "₹" + del.toLocaleString("en-IN");

  document.getElementById("grandTotal").innerText =
    "₹" + tot.toLocaleString("en-IN");
}

/* =========================
   LOAD ADDRESS SELECTOR
========================= */
function loadAddressSelector() {
  fetch(`http://localhost:5000/api/addresses/${loggedUser.id}`)
    .then(res => res.json())
    .then(addresses => {
      const box = document.getElementById("addressSelector");
      box.innerHTML = "";

      if (!addresses || !addresses.length) {
        box.innerHTML = "<p>No saved addresses. Please add one.</p>";
        return;
      }

      addresses.forEach((addr, index) => {
        const div = document.createElement("div");
        div.className = "address-option";

        if (addr.is_default || index === 0) {
          div.classList.add("active");
          selectedAddress = addr;
        }

        div.innerHTML = `
          <input type="radio" name="address" ${addr.is_default || index === 0 ? "checked" : ""}>
          <div>
            <p><b>${addr.door}</b>, ${addr.street || ""}</p>
            <p>
              ${addr.village || ""}, ${addr.city},
              ${addr.state} - <b>${addr.pincode || ""}</b>
            </p>
            ${addr.is_default ? "<small style='color:green'>Default</small>" : ""}
          </div>
        `;

        div.onclick = () => {
          document.querySelectorAll(".address-option")
            .forEach(a => a.classList.remove("active"));

          div.classList.add("active");
          div.querySelector("input").checked = true;
          selectedAddress = addr;
        };

        box.appendChild(div);
      });
    });
}

/* =========================
   PAY NOW
========================= */
function payNow() {
  const items = getCheckoutItems();

  if (!items.length) {
    alert("Cart is empty");
    return;
  }

  if (!selectedAddress) {
    alert("Please select a delivery address");
    return;
  }

  const paymentInput =
    document.querySelector('input[name="payment"]:checked');

  if (!paymentInput) {
    alert("Please select payment method");
    return;
  }

  const paymentMethod = paymentInput.value;
  const { total } = calculateTotals(items);

  if (paymentMethod === "cod") {
    saveOrder("COD", total, items);
    return;
  }

  alert("Online payment integration next 🚀");
}

/* =========================
   SAVE ORDER
========================= */
function saveOrder(paymentId, amount, items) {
  fetch("http://localhost:5000/api/order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: loggedUser.id,
      payment_id: paymentId,
      payment_mode: paymentId === "COD" ? "COD" : "ONLINE",
      total_amount: amount,
      items,
      address: selectedAddress
    })
  })
    .then(res => res.json())
    .then(() => {
      localStorage.removeItem(CART_KEY);
      localStorage.removeItem("buyNow");
      window.location.href = "order-success.html";
    })
    .catch(() => alert("Order failed"));
}

/* =========================
   INIT
========================= */
window.addEventListener("DOMContentLoaded", () => {
  loadAddressSelector();
  renderSummary();
});
