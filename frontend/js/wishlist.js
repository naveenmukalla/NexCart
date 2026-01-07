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
const loggedUser = JSON.parse(localStorage.getItem("loggedUser"));
const CART_KEY = loggedUser ? `cart_${loggedUser.id}` : "cart";

/* ======================
   WISHLIST STORAGE
====================== */
function getWishlist() {
  return JSON.parse(localStorage.getItem("wishlist")) || [];
}

function saveWishlist(list) {
  localStorage.setItem("wishlist", JSON.stringify(list));
}

/* ======================
   RENDER WISHLIST
====================== */
function renderWishlist() {
  const list = getWishlist();
  const container = document.getElementById("wishlistItems");

  /* EMPTY */
  if (list.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:40px;">
        <h3>Your wishlist is empty ❤️</h3>
        <p>Add products you love to see them here</p><br>
        <button style="
          background:#f4193e;
          color:#fff;
          border:none;
          padding:10px 20px;
          border-radius:6px;
          cursor:pointer;
        " onclick="goShop()">
          Shop Now
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = "";

  list.forEach((item, index) => {

    /* SMART VARIANT DISPLAY */
    let variantHTML = "";
    if (item.rom) {
      variantHTML = `<p><strong>ROM:</strong> ${item.rom}</p>`;
    } else if (item.size) {
      variantHTML = `<p><strong>Size:</strong> ${item.size}</p>`;
    }

    container.innerHTML += `
      <div class="wishlist-item">
        <img src="${item.image}">
        <div>
          <h4>${item.title}</h4>
          <p>${item.brand || ""}</p>

          ${variantHTML}

          <p class="price">${item.price}</p>

          <div class="actions">
            <button onclick="moveToCart(${index})">
              Add to Cart
            </button>
          </div>

          <span class="remove" onclick="removeItem(${index})">
            Remove
          </span>
        </div>
      </div>
    `;
  });
}

/* ======================
   REMOVE FROM WISHLIST
====================== */
function removeItem(index) {
  const list = getWishlist();
  list.splice(index, 1);
  saveWishlist(list);
  renderWishlist();
}

/* ======================
   MOVE TO CART (SMART)
====================== */
function moveToCart(index) {
  const wishlist = getWishlist();
  const item = wishlist[index];

  const cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];

  /* CHECK DUPLICATE (ID + VARIANT) */
  const exists = cart.find(p =>
    p.id === item.id &&
    p.size === item.size &&
    p.rom === item.rom
  );

  if (exists) {
    exists.qty += 1;
  } else {
    cart.push({
      ...item,
      qty: 1
    });
  }

  localStorage.setItem(CART_KEY, JSON.stringify(cart));

  wishlist.splice(index, 1);
  saveWishlist(wishlist);

  alert("Added to cart 🛒");
  renderWishlist();
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
renderWishlist();

/* LOGOUT FUNCTIONALITY */
function logout() {
  if (confirm("Logout now?")) {
    localStorage.clear();  // clears everything
    sessionStorage.clear();

    window.location.replace("index.html");
  }
}