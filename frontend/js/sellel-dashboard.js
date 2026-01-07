// /* ================================
//    BASIC CONFIG
// ================================ */
// const API = "http://localhost:5000";
// const seller = JSON.parse(localStorage.getItem("seller"));

// /* ================================
//    AUTH CHECK
// ================================ */
// if (!seller || !seller.id) {
//   alert("Seller not logged in");
//   window.location.href = "seller-login.html";
// }

// /* ================================
//    PROFILE
// ================================ */
// function loadProfile() {
//   document.getElementById("p_fullname").innerText =
//     seller.fullname || "-";
//   document.getElementById("p_business").innerText =
//     seller.business_name || "-";
//   document.getElementById("p_email").innerText =
//     seller.email || "-";
//   document.getElementById("p_phone").innerText =
//     seller.mobile || seller.phone || "-";
// }

// /* ================================
//    SECTION SWITCH
// ================================ */
// function showSection(id, el) {
//   document.querySelectorAll(".section").forEach(sec =>
//     sec.classList.remove("active")
//   );

//   document.querySelectorAll(".sidebar a").forEach(a =>
//     a.classList.remove("active")
//   );

//   document.getElementById(id).classList.add("active");
//   if (el) el.classList.add("active");

//   if (id === "profile") loadProfile();
//   if (id === "add-product") loadProductStats();
//   if (id === "products") loadMyProducts();
//   if (id === "payouts") loadWallet();

//   if (window.innerWidth <= 768) {
//     document.getElementById("sidebar").classList.remove("show");
//   }
// }

// /* ================================
//    MOBILE SIDEBAR
// ================================ */
// function toggleSidebar() {
//   document.getElementById("sidebar").classList.toggle("show");
// }

// /* ================================
//    LOGOUT
// ================================ */
// function logout() {
//   localStorage.removeItem("seller");
//   window.location.href = "seller-login.html";
// }



// /* ================================
//    CATEGORY → SUBCATEGORY MAP
// ================================ */
// const subCategoryMap = {
//   men: ["shirts", "tshirts", "pants"],
//   women: ["sarees", "tshirts", "anarkalis"],
//   kids: ["boys", "girls", "boysfootwear", "girlsfootwear"],
//   electronics: ["mobiles", "laptops"]
// };

// const categorySelect = document.getElementById("category");
// const subCategorySelect = document.getElementById("subcategory");
// const sizeBox = document.getElementById("sizeBox");
// const romBox = document.getElementById("romBox");

// if (categorySelect) {
//   categorySelect.addEventListener("change", () => {
//     const cat = categorySelect.value;

//     // reset subcategory
//     subCategorySelect.innerHTML =
//       `<option value="">Select Subcategory</option>`;

//     (subCategoryMap[cat] || []).forEach(sc => {
//       const opt = document.createElement("option");
//       opt.value = sc;
//       opt.textContent = sc.charAt(0).toUpperCase() + sc.slice(1);
//       subCategorySelect.appendChild(opt);
//     });

//     // toggle size / rom
//     if (cat === "electronics") {
//       sizeBox.style.display = "none";
//       romBox.style.display = "block";
//     } else {
//       sizeBox.style.display = "block";
//       romBox.style.display = "none";
//     }
//   });
// }


// /* ================================
//    ADD PRODUCT
// ================================ */
// const addProductForm = document.getElementById("addProductForm");

// if (addProductForm) {
//   addProductForm.addEventListener("submit", e => {
//     e.preventDefault();

//     const formData = new FormData(addProductForm);
//     formData.append("seller_id", seller.id);

//     fetch(`${API}/seller/product/add`, {
//       method: "POST",
//       body: formData
//     })
//     .then(res => res.json())
//     .then(() => {
//       alert("Product submitted for approval");
//       addProductForm.reset();
//       loadProductStats();
//     })
//     .catch(() => alert("Server error"));
//   });
// }

// /* ================================
//    PRODUCT STATS
// ================================ */
// function loadProductStats() {
//   fetch(`${API}/seller/product/stats/${seller.id}`)
//     .then(res => res.json())
//     .then(data => {
//       document.getElementById("pendingCount").innerText =
//         data.pending || 0;
//       document.getElementById("approvedCount").innerText =
//         data.approved || 0;
//     });
// }

// /* ================================
//    MY PRODUCTS
// ================================ */
// function loadMyProducts() {
//   fetch(`${API}/seller/products/${seller.id}`)
//     .then(res => res.json())
//     .then(products => {
//       const container = document.getElementById("products");

//       let html = `
//         <div class="card">
//           <h3>My Products</h3>
//       `;

//       if (!products || products.length === 0) {
//         html += `<p>No products added yet</p>`;
//       } else {
//         products.forEach(p => {
//           html += `
//             <div style="margin-bottom:12px;">
//               <b>${p.title}</b><br>
//               ₹${p.price}
//               <span style="
//                 margin-left:10px;
//                 color:${p.status === "approved" ? "green" : "orange"};
//                 font-weight:bold
//               ">
//                 ${p.status}
//               </span>
//             </div>
//             <hr>
//           `;
//         });
//       }

//       html += `</div>`;
//       container.innerHTML = html;
//     });
// }

// /* ================================
//    WALLET
// ================================ */
// function loadWallet() {
//   fetch(`${API}/seller/wallet/${seller.id}`)
//     .then(res => res.json())
//     .then(data => {
//       document.getElementById("walletBalance").innerText =
//         "₹" + (data.balance || 0);
//     });
// }

// /* ================================
//    PAYOUT REQUEST
// ================================ */
// function requestPayout() {
//   const amount = document.getElementById("payoutAmount").value;

//   if (!amount || amount <= 0) {
//     alert("Enter valid amount");
//     return;
//   }

//   fetch(`${API}/seller/payout/request`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({
//       seller_id: seller.id,
//       amount: amount
//     })
//   })
//   .then(res => res.json())
//   .then(data => {
//     alert(data.message || "Payout requested");
//     document.getElementById("payoutAmount").value = "";
//     loadWallet();
//   });
// }

// /* ================================
//    INITIAL LOAD
// ================================ */
// loadProfile();
// loadProductStats();

// function loadMyProducts() {
//   fetch(`${API}/seller/products/${seller.id}`)
//     .then(res => res.json())
//     .then(products => {
//       const container = document.getElementById("products");

//       let html = `<div class="card"><h3>My Products</h3>`;

//       if (!products || products.length === 0) {
//         html += `<p>No products added yet</p>`;
//       } else {
//         products.forEach(p => {
//           html += `
//             <div style="border-bottom:1px solid #eee;padding:12px 0">
//               <b>${p.title}</b><br>
//               ₹${p.price}
//               <span style="margin-left:10px;color:${
//                 p.status === "approved" ? "green" : "orange"
//               }">${p.status}</span>

//               <div style="margin-top:8px">
//                 <button onclick='editProduct(${JSON.stringify(p)})'>
//                   Edit
//                 </button>
//                 <button class="black"
//                   onclick="deleteMyProduct(${p.id})">
//                   Delete
//                 </button>
//               </div>
//             </div>
//           `;
//         });
//       }

//       html += `</div>`;
//       container.innerHTML = html;
//     });
// }

// function editProduct(product) {
//   // open Add Product section
//   showSection("add-product");

//   // store editing product id
//   document.getElementById("editProductId").value = product.id;

//   // fill form fields
//   setField("category", product.category);
//   setField("subcategory", product.subcategory);
//   setField("product_type", product.product_type);
//   setField("brand", product.brand);
//   setField("title", product.title);
//   setField("price", product.price);
//   setField("old_price", product.old_price);
//   setField("sizes", product.sizes);
//   setField("rom", product.rom);

//   // change button text
//   document.getElementById("productSubmitBtn").innerText =
//     "Update Product";
// }

// function setField(name, value) {
//   const el = document.querySelector(`[name="${name}"]`);
//   if (el) el.value = value || "";
// }


// function deleteMyProduct(productId) {
//   if (!confirm("Delete this product permanently?")) return;

//   fetch(`${API}/seller/product/delete/${productId}?seller_id=${seller.id}`, {
//     method: "DELETE"
//   })
//   .then(res => res.json())
//   .then(() => {
//     alert("Product deleted");
//     loadMyProducts();
//     loadProductStats();
//   });
// }


/* ================================
   BASIC CONFIG
================================ */
const API = "http://localhost:5000";
const seller = JSON.parse(localStorage.getItem("seller"));

if (!seller || !seller.id) {
  alert("Seller not logged in");
  window.location.href = "seller-login.html";
}

/* ================================
   SECTION SWITCH
================================ */
function showSection(id) {
  document.querySelectorAll(".section").forEach(sec =>
    sec.classList.remove("active")
  );
  document.getElementById(id).classList.add("active");

  if (id === "profile") loadProfile();
  if (id === "products") loadMyProducts();
  if (id === "add-product") loadProductStats();
  if (id === "payouts") loadWallet();
}

/* ================================
   PROFILE
================================ */
function loadProfile() {
  document.getElementById("p_fullname").innerText = seller.fullname || "-";
  document.getElementById("p_business").innerText = seller.business_name || "-";
  document.getElementById("p_email").innerText = seller.email || "-";
  document.getElementById("p_phone").innerText = seller.mobile || "-";
}

/* ================================
   CATEGORY → SUBCATEGORY MAP
================================ */
const subCategoryMap = {
  mens: ["shirts", "tshirts", "pants","mensfootwear"],
  womens: ["sarees", "womens-tshirts", "jeans", "anarkalis", "lehangas", "womenfootwear"],
  kids: ["boyswear", "girlswear", "boysfootwear", "girlsfootwear"],
  electronics: ["mobiles", "laptops"]
};

const categorySelect = document.querySelector("[name='category']");
const subcategorySelect = document.querySelector("[name='subcategory']");
const sizeInput = document.querySelector("[name='sizes']");
const romInput = document.querySelector("[name='rom']");

categorySelect?.addEventListener("change", () => {
  const cat = categorySelect.value;
  subcategorySelect.innerHTML = `<option value="">Select Subcategory</option>`;

  (subCategoryMap[cat] || []).forEach(sc => {
    subcategorySelect.innerHTML += `<option value="${sc}">${sc}</option>`;
  });

   // Default state
  sizeInput.style.display = "block";
  romInput.style.display = "none";
});

/* ================================
   SUBCATEGORY CHANGE
================================ */
subcategorySelect.addEventListener("change", () => {
  const sub = subcategorySelect.value;

  if (sub === "mobiles" || sub === "laptops") {
    sizeInput.style.display = "none";
    romInput.style.display = "block";
  } else {
    sizeInput.style.display = "block";
    romInput.style.display = "none";
  }
});
//   if (cat === "mobiles" || cat === "laptops") {
//     sizeInput.style.display = "none";
//     romInput.style.display = "block";
//   } else {
//     sizeInput.style.display = "block";
//     romInput.style.display = "none";
//   }
// });

/* ================================
   ADD PRODUCT
================================ */
const form = document.getElementById("addProductForm");
let editingProductId = null;

form?.addEventListener("submit", e => {
  e.preventDefault();

  const formData = new FormData(form);
  formData.append("seller_id", seller.id);

  const url = editingProductId
    ? `${API}/seller/product/update/${editingProductId}`
    : `${API}/seller/product/add`;

  fetch(url, {
    method: "POST",
    body: formData
  })
  .then(res => res.json())
  .then(() => {
    alert(editingProductId ? "Product updated (sent for approval)" : "Product submitted");
    form.reset();
    editingProductId = null;
    showSection("products");
    loadMyProducts();
    loadProductStats();
  });
});

/* ================================
   PRODUCT STATS
================================ */
function loadProductStats() {
  fetch(`${API}/seller/product/stats/${seller.id}`)
    .then(res => res.json())
    .then(d => {
      document.getElementById("pendingCount").innerText = d.pending || 0;
      document.getElementById("approvedCount").innerText = d.approved || 0;
    });
}

/* ================================
   MY PRODUCTS
================================ */
function loadMyProducts() {
  fetch(`${API}/seller/products/${seller.id}`)
    .then(res => res.json())
    .then(products => {
      const tbody = document.getElementById("myProducts");
      tbody.innerHTML = "";

      if (!products.length) {
        tbody.innerHTML = `<tr><td colspan="4">No products</td></tr>`;
        return;
      }

      products.forEach(p => {
        tbody.innerHTML += `
          <tr>
            <td>${p.title}</td>
            <td>${p.category}</td>
            <td>₹${p.price}</td>
            <td>${p.status}</td>
            <td>
              <button onclick='startEdit(${JSON.stringify(p)})'>Edit</button>
              <button onclick="deleteProduct(${p.id})">Delete</button>
            </td>
          </tr>
        `;
      });
    });
}

/* ================================
   EDIT PRODUCT
================================ */
function startEdit(p) {
  editingProductId = p.id;
  showSection("add-product");

  categorySelect.value = p.category;
  categorySelect.dispatchEvent(new Event("change"));
  subcategorySelect.value = p.subcategory;

  form.brand.value = p.brand;
  form.title.value = p.title;
  form.price.value = p.price;
  form.old_price.value = p.old_price || "";
  form.sizes.value = p.sizes || "";
  form.rom.value = p.rom || "";
}

/* ================================
   DELETE PRODUCT
================================ */
function deleteProduct(pid) {
  if (!confirm("Delete this product?")) return;

  fetch(`${API}/seller/product/delete/${pid}?seller_id=${seller.id}`, {
    method: "DELETE"
  })
  .then(() => {
    alert("Product deleted");
    loadMyProducts();
    loadProductStats();
  });
}

/* ================================
   WALLET
================================ */
function loadWallet() {
  fetch(`${API}/seller/wallet/${seller.id}`)
    .then(res => res.json())
    .then(w => {
      document.getElementById("walletBalance").innerText = "₹" + (w.balance || 0);
    });
}

/* ================================
   PAYOUT
================================ */
function requestPayout() {
  const amount = document.getElementById("payoutAmount").value;
  if (!amount || amount <= 0) return alert("Invalid amount");

  fetch(`${API}/seller/payout/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ seller_id: seller.id, amount })
  })
  .then(res => res.json())
  .then(d => {
    alert(d.message);
    loadWallet();
  });
}

/* ================================
   INIT
================================ */
loadProfile();
loadProductStats();
