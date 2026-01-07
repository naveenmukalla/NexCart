
/* ======================
   LOGIN CHECK
====================== */
const loggedUser = JSON.parse(localStorage.getItem("loggedUser"));
if (!loggedUser || !loggedUser.id) {
  alert("Please login to continue");
  window.location.href = "login.html";
}

/* ======================
   USER CART KEY
====================== */
const CART_KEY = `cart_${loggedUser.id}`;

/* ======================
   IMAGE HOVER SLIDER
====================== */
document.querySelectorAll(".product-card").forEach(card => {
  const imageBox = card.querySelector(".image-box");
  const images = card.querySelectorAll(".product-img");
  let index = 0, interval;

  function show(i) {
    images.forEach(img => img.classList.remove("active"));
    images[i].classList.add("active");
  }

  imageBox.addEventListener("mouseenter", () => {
    interval = setInterval(() => {
      index = (index + 1) % images.length;
      show(index);
    }, 1500);
  });

  imageBox.addEventListener("mouseleave", () => {
    clearInterval(interval);
    index = 0;
    show(index);
  });
});


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
   ROM PRICE MAP
====================== */
const ROM_PRICES = {
  "64": 0,
  "128": 0,
  "256": 10000,
  "512": 20000,
  "1 TB": 35000
};

/* ======================
   CHANGE ROM
====================== */
function changeROM(btn, rom) {
  const card = btn.closest(".product-card");

  card.querySelectorAll(".rom-btn").forEach(b =>
    b.classList.remove("active")
  );
  btn.classList.add("active");

  const priceEl = card.querySelector(".current");
  const basePrice = Number(
    priceEl.dataset.base ||
    priceEl.innerText.replace(/[₹,]/g, "")
  );

  priceEl.dataset.base = basePrice;
  const newPrice = basePrice + (ROM_PRICES[rom] || 0);

  priceEl.innerText = "₹" + newPrice.toLocaleString("en-IN");
}

/* ======================
   CART HELPERS
====================== */
function getCart() {
  return JSON.parse(localStorage.getItem(CART_KEY)) || [];
}
function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}
function updateCartCount() {
  const el = document.getElementById("cartCount");
  if (el) el.innerText = getCart().length;
}

/* ======================
   ADD TO CART
====================== */
document.querySelectorAll(".cart").forEach(btn => {
  btn.addEventListener("click", () => {
    const card = btn.closest(".product-card");
    const romBtn = card.querySelector(".rom-btn.active");

    if (!romBtn) {
      alert("Please select ROM");
      return;
    }

    const product = {
      id: card.querySelector(".title").innerText + "_" + romBtn.innerText,
      brand: card.querySelector(".brand").innerText,
      title: card.querySelector(".title").innerText,
      rom: romBtn.innerText,
      price: card.querySelector(".current").innerText,
      image: card.querySelector(".product-img.active").src,
      qty: 1
    };

    const cart = getCart();
    cart.push(product);
    saveCart(cart);
    updateCartCount();

    btn.innerText = "Added ✓";
    btn.disabled = true;
  });
});

/* ======================
   BUY NOW
====================== */
document.addEventListener("click", e => {
  if (!e.target.classList.contains("buy")) return;

  const card = e.target.closest(".product-card");
  const romBtn = card.querySelector(".rom-btn.active");

  if (!romBtn) {
    alert("Please select ROM");
    return;
  }

  const product = {
    id: Date.now(),
    brand: card.querySelector(".brand").innerText,
    title: card.querySelector(".title").innerText,
    rom: romBtn.innerText,
    price: card.querySelector(".current").innerText,
    image: card.querySelector(".product-img.active").src,
    qty: 1
  };

  localStorage.setItem("buyNow", JSON.stringify(product));
  window.location.href = "checkout.html";
});

/* ======================
   WISHLIST
====================== */
function getWishlist() {
  return JSON.parse(localStorage.getItem("wishlist")) || [];
}
function saveWishlist(w) {
  localStorage.setItem("wishlist", JSON.stringify(w));
}
function updateWishlistCount() {
  const el = document.getElementById("wishlistCount");
  if (el) el.innerText = getWishlist().length;
}

document.addEventListener("click", e => {
  if (!e.target.classList.contains("wishlist")) return;

  const card = e.target.closest(".product-card");
  const id = card.querySelector(".title").innerText;

  let list = getWishlist();
  const index = list.findIndex(p => p.id === id);

  if (index > -1) {
    list.splice(index, 1);
    e.target.classList.remove("active");
  } else {
    list.push({
      id,
      title: card.querySelector(".title").innerText,
      price: card.querySelector(".current").innerText,
      image: card.querySelector(".product-img.active").src
    });
    e.target.classList.add("active");
  }

  saveWishlist(list);
  updateWishlistCount();
});

/* ======================
   INIT
====================== */
updateCartCount();
updateWishlistCount();

/* ======================
   LOGOUT
====================== */
function logout() {
  localStorage.removeItem("loggedUser");
  localStorage.removeItem("role");
  window.location.href = "login.html";
}


const API = "http://localhost:5000";

function loadDynamicProducts() {
  const body = document.body;
  const category = body.dataset.category;
  const subcategory = body.dataset.subcategory;

  if (!category || !subcategory) return;

  fetch(`${API}/products?category=${category}&subcategory=${subcategory}`)
    .then(res => res.json())
    .then(products => {
      const container = document.getElementById("dynamicProducts");
      if (!container || !products.length) return;

      products.forEach(p => {
        const images = JSON.parse(p.images || "[]");

        container.insertAdjacentHTML("beforeend", `
          <div class="product-card" data-id="${p.id}">
            <div class="image-box">
              <div class="wishlist">❤</div>

              ${images.map((img, i) => `
                <img
                  src="${API}/uploads/products/${img}"
                  class="product-img ${i === 0 ? "active" : ""}"
                >
              `).join("")}
            </div>

            <div class="details">
              <div class="brand">${p.brand}</div>
              <div class="title">${p.title}</div>

              <div class="price">
                <span class="current">₹${p.price}</span>
                ${p.old_price ? `
                  <span class="old">₹${p.old_price}</span>
                  <span class="off">
                    ${Math.round(((p.old_price - p.price) / p.old_price) * 100)}% off
                  </span>
                ` : ""}
              </div>

              ${p.sizes ? `
                <div class="rom-selection">
                  <span class="rom-label">Rom:</span>
                  ${p.sizes.split(",").map(s =>
                    `<button class="rom-btn">${s}</button>`
                  ).join("")}
                </div>
              ` : ""}

              <div class="buttons">
                <button class="cart">Add to Cart</button>
                <button class="buy">Buy Now</button>
              </div>
            </div>
          </div>
        `);
      });

      rebindProductEvents();
    });
}

document.addEventListener("DOMContentLoaded", loadDynamicProducts);

/* ============================
   REBIND EVENTS (IMPORTANT)
============================ */
function rebindProductEvents() {

  // Size selection
  document.querySelectorAll(".product-card").forEach(card => {
    const sizeBtns = card.querySelectorAll(".size-btn");

    sizeBtns.forEach(btn => {
      btn.onclick = () => {
        sizeBtns.forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
      };
    });
  });

  // Add to cart
  document.querySelectorAll(".cart").forEach(btn => {
    btn.onclick = () => addToCart(btn);
  });
}
