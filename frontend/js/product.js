/* ======================
   LOGIN CHECK
====================== */
const loggedUser = JSON.parse(localStorage.getItem("loggedUser"));

if (!loggedUser || !loggedUser.id) {
  alert("Please login to continue");
  window.location.href = "login.html";
}

/* ======================
   USER-SPECIFIC CART KEY
====================== */
const CART_KEY = `cart_${loggedUser.id}`;

/* ======================
   IMAGE HOVER SLIDER
====================== */
document.querySelectorAll(".product-card").forEach(card => {

  const imageBox = card.querySelector(".image-box");
  const images = card.querySelectorAll(".product-img");

  let index = 0;
  let interval;

  function showImage(i) {
    images.forEach(img => img.classList.remove("active"));
    images[i].classList.add("active");
  }

  imageBox.addEventListener("mouseenter", () => {
    interval = setInterval(() => {
      index = (index + 1) % images.length;
      showImage(index);
    }, 1500);
  });

  imageBox.addEventListener("mouseleave", () => {
    clearInterval(interval);
    index = 0;
    showImage(index);
  });
});

/* ======================
   SIZE SELECTION (PER CARD)
====================== */
document.querySelectorAll(".product-card").forEach(card => {
  const sizeButtons = card.querySelectorAll(".size-btn");

  sizeButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      sizeButtons.forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
    });
  });
});

/* ======================
   HEADER DROPDOWN
====================== */
const userIcon = document.getElementById("userIcon");
if (userIcon) {
  userIcon.addEventListener("click", e => {
    if (window.innerWidth <= 768) return;
    e.stopPropagation();
    userIcon.classList.toggle("active");
  });
  document.addEventListener("click", () =>
    userIcon.classList.remove("active")
  );
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
   CART STORAGE (USER-SPECIFIC)
====================== */
function getCart() {
  return JSON.parse(localStorage.getItem(CART_KEY)) || [];
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function updateCartCount() {
  const cart = getCart();
  const el = document.getElementById("cartCount");
  if (el) el.innerText = cart.length;
}

/* ======================
   ADD TO CART
====================== */
function addToCart(btn) {
  const card = btn.closest(".product-card");

  const selectedSize = card.querySelector(".size-btn.selected");
  if (!selectedSize) {
    alert("Please select a size");
    return;
  }

  const product = {
    id: Date.now() + Math.random(),
    brand: card.querySelector(".brand")?.innerText || "",
    title: card.querySelector(".title")?.innerText || "",
    size: selectedSize.innerText,
    price: card.querySelector(".current")?.innerText || "",
    image: card.querySelector(".product-img")?.src || "",
    qty: 1
  };

  const cart = getCart();
  cart.push(product);
  saveCart(cart);
  updateCartCount();

  btn.innerText = "Added ✓";
  btn.disabled = true;
}

/* ======================
   BUY NOW
====================== */
document.addEventListener("click", e => {
  if (!e.target.classList.contains("buy")) return;

  const card = e.target.closest(".product-card");
  if (!card) return;

  const selectedSize = card.querySelector(".size-btn.selected");
  if (!selectedSize) {
    alert("Please select size");
    return;
  }

  const product = {
    id: Date.now(),
    brand: card.querySelector(".brand")?.innerText || "",
    title: card.querySelector(".title")?.innerText || "",
    price: card.querySelector(".current")?.innerText || "",
    image: card.querySelector(".product-img")?.src || "",
    size: selectedSize.innerText,
    qty: 1
  };

  localStorage.setItem("buyNow", JSON.stringify(product));
  window.location.href = "checkout.html";
});

/* ======================
   ATTACH CART BUTTONS
====================== */
document.querySelectorAll(".cart").forEach(btn => {
  btn.addEventListener("click", function () {
    addToCart(this);
  });
});

/* ======================
   WISHLIST STORAGE
====================== */
function getWishlist() {
  return JSON.parse(localStorage.getItem("wishlist")) || [];
}

function saveWishlist(list) {
  localStorage.setItem("wishlist", JSON.stringify(list));
}

function updateWishlistCount() {
  const el = document.getElementById("wishlistCount");
  if (el) el.innerText = getWishlist().length;
}

/* ======================
   TOGGLE WISHLIST
====================== */
document.addEventListener("click", e => {
  if (!e.target.classList.contains("wishlist")) return;

  const icon = e.target;
  const card = icon.closest(".product-card");
  if (!card) return;

  const product = {
    id: card.dataset.id || card.querySelector(".product-img").src,
    brand: card.querySelector(".brand")?.innerText || "",
    title: card.querySelector(".title")?.innerText || "",
    price: card.querySelector(".current")?.innerText || "",
    image: card.querySelector(".product-img")?.src || ""
  };

  let wishlist = getWishlist();
  const index = wishlist.findIndex(p => p.id === product.id);

  if (index > -1) {
    wishlist.splice(index, 1);
    icon.classList.remove("active");
  } else {
    wishlist.push(product);
    icon.classList.add("active");
  }

  saveWishlist(wishlist);
  updateWishlistCount();
});

/* ======================
   INIT WISHLIST STATE
====================== */
document.querySelectorAll(".product-card").forEach(card => {
  const id = card.dataset.id || card.querySelector(".product-img").src;
  const wishlist = getWishlist();
  if (wishlist.find(item => item.id === id)) {
    card.querySelector(".wishlist")?.classList.add("active");
  }
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
                <div class="sizes">
                  <span class="size-label">Size:</span>
                  ${p.sizes.split(",").map(s =>
                    `<button class="size-btn">${s}</button>`
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
