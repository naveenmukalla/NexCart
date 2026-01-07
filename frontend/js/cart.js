
/* ======================
   LOGIN CHECK (PROTECTED)
====================== */
const loggedUser = JSON.parse(localStorage.getItem("loggedUser"));

if (!loggedUser || !loggedUser.id) {
  alert("Please login to view your cart");
  window.location.href = "login.html";
}

/* ======================
   MOBILE MENU
====================== */
const hamburger = document.getElementById("hamburger");
const mobileMenu = document.getElementById("mobileMenu");
const overlay = document.getElementById("overlay");
const closeMenu = document.getElementById("closeMenu");

if (hamburger) {
  hamburger.onclick = () => {
    mobileMenu.classList.add("active");
    overlay.classList.add("active");
  };
}
if (closeMenu) closeMenu.onclick = closeAll;
if (overlay) overlay.onclick = closeAll;

function closeAll() {
  mobileMenu.classList.remove("active");
  overlay.classList.remove("active");
}

/* MOBILE ACCORDION */
document.querySelectorAll(".accordion-title").forEach(title=>{
  title.addEventListener("click",()=>{
    const item=title.parentElement;
    document.querySelectorAll(".accordion-item").forEach(i=>{if(i!==item)i.classList.remove("active")});
    item.classList.toggle("active");
  });
});
/* ======================
   USER-SPECIFIC CART KEY
====================== */
const CART_KEY = `cart_${loggedUser.id}`;

/* ======================
   CART STORAGE HELPERS
====================== */
function getCart() {
  return JSON.parse(localStorage.getItem(CART_KEY)) || [];
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

/* ======================
   PRICE PARSER (FIX NaN)
====================== */
function parsePrice(price) {
  return Number(price.replace(/[₹,]/g, ""));
}

/* ======================
   RENDER CART
====================== */
function renderCart() {
  const cart = getCart();
  const container = document.getElementById("cartItems");
  const totalEl = document.getElementById("totalPrice");
  let total = 0;

  /* EMPTY CART */
  if (cart.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:40px;">
        <h3>Your cart is empty 🛒</h3>
        <p>Add items to your cart</p><br>
        <button class="checkout" onclick="goShop()">Shop Now</button>
      </div>
    `;
    totalEl.innerText = "₹0";
    return;
  }

  container.innerHTML = "";

  cart.forEach((item, index) => {
    const price = parsePrice(item.price);
    const itemTotal = price * item.qty;
    total += itemTotal;

    /* ✅ SMART VARIANT DISPLAY */
    let variantHTML = "";
    if (item.rom) {
      variantHTML = `<p><strong>ROM:</strong> ${item.rom}</p>`;
    } else if (item.size) {
      variantHTML = `<p><strong>Size:</strong> ${item.size}</p>`;
    }

    container.innerHTML += `
      <div class="cart-item">
        <img src="${item.image}" alt="${item.title}">
        <div class="cart-info">
          <h4>${item.title}</h4>
          <p>${item.brand || ""}</p>

          ${variantHTML}

          <p class="price">₹${itemTotal.toLocaleString("en-IN")}</p>

          <div class="qty-box">
            <button onclick="changeQty(${index}, -1)">−</button>
            <span>${item.qty}</span>
            <button onclick="changeQty(${index}, 1)">+</button>
          </div>

          <div class="cart-actions">
            <button class="remove" onclick="removeItem(${index})">
              Remove
            </button>
            <button class="buy-btn" onclick="buyNow(${index})">
              Buy Now
            </button>
          </div>
        </div>
      </div>
    `;
  });

  totalEl.innerText = "₹" + total.toLocaleString("en-IN");
}

/* ======================
   CHANGE QUANTITY
====================== */
function changeQty(index, delta) {
  const cart = getCart();
  cart[index].qty += delta;
  if (cart[index].qty < 1) cart[index].qty = 1;
  saveCart(cart);
  renderCart();
}

/* ======================
   REMOVE ITEM
====================== */
function removeItem(index) {
  const cart = getCart();
  cart.splice(index, 1);
  saveCart(cart);
  renderCart();
}

/* ======================
   BUY NOW (SINGLE ITEM)
====================== */
function buyNow(index) {
  const cart = getCart();
  localStorage.setItem("buyNow", JSON.stringify(cart[index]));
  window.location.href = "checkout.html";
}

/* ======================
   PROCEED TO CHECKOUT
====================== */
function goToCheckout() {
  if (getCart().length === 0) {
    alert("Your cart is empty");
    return;
  }
  localStorage.removeItem("buyNow");
  window.location.href = "checkout.html";
}

/* ======================
   SHOP PAGE
====================== */
function goShop() {
  window.location.href = "home.html";
}

/* ======================
   INIT
====================== */
renderCart();


/* LOGOUT FUNCTIONALITY */
function logout() {
  if (confirm("Logout now?")) {
    localStorage.clear();  // clears everything
    sessionStorage.clear();

    window.location.replace("index.html");
  }
}