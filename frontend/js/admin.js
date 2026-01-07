
let salesChart = null;

/* ===============================
   CONFIG
================================ */
const API = "http://localhost:5000";

/* ===============================
   ADMIN PROTECTION
================================ */
const loggedUser = JSON.parse(localStorage.getItem("loggedUser"));
if (!loggedUser || loggedUser.emailphone !== "admin@nexcart.com") {
  alert("Admin only access");
  location.href = "login.html";
}


// showSection("dashboard");
function showSection(id) {
  document.querySelectorAll(".section").forEach(sec =>
    sec.classList.remove("active")
  );
  document.getElementById(id).classList.add("active");

  if (id === "dashboard") loadDashboard();
  if (id === "users") loadUsers();
  if (id === "orders") loadOrders();
  if (id === "sellers") loadSellers();
  if (id === "sellerProducts") loadSellerProducts();
  if (id === "payouts") loadPayouts();
  if (id === "sales") {
  setTimeout(() => {
    loadSalesChart();
  }, 300); // 🔥 delay until visible
}
}
/* ===============================
   LOGOUT
================================ */
function logout() {
  localStorage.removeItem("loggedUser");
  location.href = "login.html";
}


/* ===============================
   DASHBOARD DATA (FIXED)
================================ */
function loadDashboard() {
  /* USERS */
  fetch(`${API}/admin/users`)
    .then(res => res.json())
    .then(users => {
      document.getElementById("totalUsers").innerText = users.length;
    });

  /* ORDERS + REVENUE + CANCELLED */
  fetch(`${API}/admin/orders`)
    .then(res => res.json())
    .then(orders => {
      document.getElementById("totalOrders").innerText = orders.length;

      let revenue = 0;
      let cancelled = 0;

      orders.forEach(o => {
        revenue += Number(o.total_amount) || 0;
        if (o.status === "Cancelled") cancelled++;
      });

      document.getElementById("totalRevenue").innerText = revenue;
      document.getElementById("cancelledOrders").innerText = cancelled;
    });
}
showSection("dashboard");
loadDashboard();


/* ===============================
   ORDERS
================================ */
function loadOrders() {
  fetch(`${API}/admin/orders`)
    .then(r => r.json())
    .then(orders => {
      const table = document.getElementById("ordersTable");
      table.innerHTML = "";

      orders.forEach(o => {
        table.innerHTML += `
          <tr>
            <td>${o.order_id}</td>
            <td>₹${o.total_amount}</td>
            <td>
              <select onchange="updateOrderStatus('${o.order_id}', this.value)">
                ${["Confirmed","Shipped","Delivered","Cancelled"].map(s =>
                  `<option ${o.status===s?"selected":""}>${s}</option>`
                ).join("")}
              </select>
            </td>
            <td>
              <button onclick='viewOrderDetails(${JSON.stringify(o)})'>View</button>
            </td>
            <td>
              <button onclick="deleteOrder('${o.order_id}')">Delete</button>
            </td>
          </tr>
        `;
      });
    });
}

function viewOrderDetails(order) {
  let html = `
    <p><b>Order ID:</b> ${order.order_id}</p>
    <p><b>Status:</b> ${order.status}</p>
    <p><b>Items:</b></p>
  `;

  order.items.forEach(i => {
    html += `• ${i.title} × ${i.qty} (Size: ${i.size})<br>`;
  });

  html += `<p><b>Total:</b> ₹${order.total_amount}</p>`;

  document.getElementById("orderDetails").innerHTML = html;
  document.getElementById("orderModal").style.display = "flex";
}

function closeOrderModal() {
  document.getElementById("orderModal").style.display = "none";
}

function updateOrderStatus(order_id, status) {
  fetch(`${API}/admin/order/status`, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ order_id, status })
  }).then(() => loadOrders());
}

function deleteOrder(order_id) {
  if (!confirm("Delete this order?")) return;

  fetch(`${API}/admin/order/delete`, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ order_id })
  }).then(() => loadOrders());
}


/* ===============================
   USERS
================================ */
function loadUsers() {
  fetch(`${API}/admin/users`)
    .then(r => r.json())
    .then(users => {
      const table = document.getElementById("userTable");
      table.innerHTML = "";

      users.forEach(u => {
        table.innerHTML += `
          <tr>
            <td>${u.fullname}</td>
            <td>${u.emailphone}</td>
            <td class="status ${u.status}">${u.status}</td>
            <td>${u.order_count}</td>
            <td>
              <button class="green"
                onclick="changeUserStatus(${u.id}, '${u.status === "blocked" ? "active" : "blocked"}')">
                ${u.status === "blocked" ? "Activate" : "Block"}
              </button>
              <button class="black"
                onclick="terminateUser(${u.id})">
                Terminate
              </button>
            </td>
          </tr>
        `;
      });
    });
}

// Change user status: active / blocked
function changeUserStatus(id, status) {
  fetch(`${API}/admin/user/status`, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ id, status })
  }).then(() => loadUsers());
}

// Permanently delete user
function terminateUser(id) {
  if (!confirm("Permanently delete user?")) return;

  fetch(`${API}/admin/user/delete`, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ id })
  }).then(() => loadUsers());
}

/* ===============================
   SELLERS
================================ */
function loadSellers() {
  fetch(`${API}/admin/sellers`)
    .then(r => r.json())
    .then(sellers => {
      const table = document.getElementById("sellerTable");
      table.innerHTML = "";

      sellers.forEach(s => {
        table.innerHTML += `
          <tr>
            <td>${s.fullname}</td>
            <td>${s.email}</td>
            <td>${s.business_name}</td>
            <td>${s.mobile}</td>
            <td class="status ${s.status}">${s.status}</td>
            <td>
              <button class="green" onclick="updateSeller(${s.id}, 'approved')">Approve</button>
              <button onclick="updateSeller(${s.id}, 'blocked')">Block</button>
            </td>
          </tr>
        `;
      });
    });
}

function updateSeller(id, status) {
  fetch(`${API}/admin/seller/status`, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ id, status })
  }).then(() => loadSellers());
}

/* ================================
   SELLER PRODUCTS (ADMIN)
================================ */
function loadSellerProducts() {
  fetch(`${API}/admin/seller-products`)
    .then(res => res.json())
    .then(products => {
      const table = document.getElementById("sellerProductTable");

      let html = "";

      if (products.length === 0) {
        html = `<tr><td colspan="7">No products found</td></tr>`;
      }

      products.forEach(p => {
        html += `
          <tr>
            <td>${p.id}</td>
            <td>${p.title}</td>
            <td>${p.seller_name}</td>
            <td>${p.category}</td>
            <td>₹${p.price}</td>
            <td>
              <span class="status ${p.status}">
                ${p.status}
              </span>
            </td>
            <td>
  ${
    p.status === "pending"
      ? `
        <button class="green"
          onclick="approveProduct(${p.id})">
          Approve
        </button>
        <button
          onclick="rejectProduct(${p.id})">
          Reject
        </button>
      `
      : ""
  }

  <button class="black"
    onclick="deleteProduct(${p.id})">
    Delete
  </button>
</td>

          </tr>
        `;
      });

      table.innerHTML = html;
    });
}

function approveProduct(id) {
  if (!confirm("Approve this product?")) return;

  fetch(`${API}/admin/seller-product/approve/${id}`, {
    method: "POST"
  })
  .then(res => res.json())
  .then(() => {
    alert("Product approved");
    loadSellerProducts();
  });
}

function rejectProduct(id) {
  if (!confirm("Reject this product?")) return;

  fetch(`${API}/admin/seller-product/reject/${id}`, {
    method: "POST"
  })
  .then(res => res.json())
  .then(() => {
    alert("Product rejected");
    loadSellerProducts();
  });
}
if (id === "sellerProducts") {
  loadSellerProducts();
}

function deleteProduct(id) {
  if (!confirm("Are you sure you want to DELETE this product?")) return;

  fetch(`${API}/admin/seller-product/delete/${id}`, {
    method: "DELETE"
  })
  .then(res => res.json())
  .then(() => {
    alert("Product deleted");
    loadSellerProducts();
  });
}

/* ===============================
   PAYOUTS
================================ */
function loadPayouts() {
  fetch(`${API}/admin/payouts`)
    .then(r => r.json())
    .then(payouts => {
      const table = document.getElementById("payoutTable");
      table.innerHTML = "";

      payouts.forEach(p => {
        table.innerHTML += `
          <tr>
            <td>${p.fullname}</td>
            <td>₹${p.amount}</td>
            <td class="status ${p.status}">${p.status}</td>
            <td>${new Date(p.created_at).toLocaleString()}</td>
            <td>
              <button class="green" onclick="updatePayout(${p.id}, 'approved')">Approve</button>
              <button onclick="updatePayout(${p.id}, 'rejected')">Reject</button>
            </td>
          </tr>
        `;
      });
    });
}

function updatePayout(id, status) {
  fetch(`${API}/admin/payout/status`, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ id, status })
  }).then(() => loadPayouts());
}

/* ===============================
   SALES CHART (FIXED)
================================ */
function loadSalesChart() {
  fetch(`${API}/admin/orders`)
    .then(res => res.json())
    .then(orders => {

      if (!orders || orders.length === 0) {
        console.warn("No orders found for sales chart");
        return;
      }

      // 🔹 Prepare data
      const map = {};
      orders.forEach(o => {
        if (!o.created_at) return;
        const date = o.created_at.split(" ")[0]; // YYYY-MM-DD
        map[date] = (map[date] || 0) + Number(o.total_amount || 0);
      });

      const labels = Object.keys(map);
      const data = Object.values(map);

      const canvas = document.getElementById("salesChart");
      if (!canvas) {
        console.error("salesChart canvas not found");
        return;
      }

      // 🔥 FORCE HEIGHT (CRITICAL FIX)
      canvas.parentElement.style.height = "350px";
      canvas.style.height = "350px";

      const ctx = canvas.getContext("2d");

      // 🔥 DESTROY OLD CHART
      if (salesChart) {
        salesChart.destroy();
        salesChart = null;
      }

      salesChart = new Chart(ctx, {
        type: "line",
        data: {
          labels: labels,
          datasets: [{
            label: "Sales (₹)",
            data: data,
            borderColor: "#f4193e",
            backgroundColor: "rgba(244,25,62,0.15)",
            borderWidth: 2,
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { beginAtZero: true }
          }
        }
      });

    })
    .catch(err => {
      console.error("Sales chart error:", err);
    });
}


/* ===============================
   CHECKOUT SETTINGS
================================ */
const settings = JSON.parse(localStorage.getItem("adminSettings")) || {
  deliveryCharge: 40,
  discountType: "flat",
  discountValue: 0
};

document.getElementById("deliveryCharge").value = settings.deliveryCharge;
document.getElementById("discountType").value = settings.discountType;
document.getElementById("discountValue").value = settings.discountValue;

function saveSettings() {
  localStorage.setItem("adminSettings", JSON.stringify({
    deliveryCharge: +deliveryCharge.value,
    discountType: discountType.value,
    discountValue: +discountValue.value
  }));
  alert("Settings saved");
}





function addProduct() {
  const product = {
    title: title.value,
    brand: brand.value,
    category: category.value,       // shirts
    subcategory: subcategory.value, // formals
    price: price.value,
    old_price: oldPrice.value,
    sizes: sizes.value,
    images: imageUrlsArray          // array of image paths
  };

  fetch("http://localhost:5000/admin/product/add", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(product)
  })
  .then(res => res.json())
  .then(() => alert("Product Added"));
}



function loadDynamicProducts() {
  fetch("http://localhost:5000/api/products?category=shirts&subcategory=formals")
    .then(res => res.json())
    .then(products => {
      const container = document.getElementById("dynamicProducts");

      products.forEach(p => {
        const images = JSON.parse(p.images);

        container.insertAdjacentHTML("beforeend", `
          <div class="product-card" data-id="${p.id}">
            <div class="image-box">
              <div class="wishlist">❤</div>
              ${images.map((img,i)=>`
                <img src="${img}" class="product-img ${i===0?"active":""}">
              `).join("")}
            </div>

            <div class="details">
              <div class="brand">${p.brand}</div>
              <div class="title">${p.title}</div>
              <div class="price">
                <span class="current">₹${p.price}</span>
                <span class="old">₹${p.old_price}</span>
              </div>

              <div class="sizes">
                ${p.sizes.split(",").map(s=>`
                  <button class="size-btn">${s}</button>
                `).join("")}
              </div>

              <div class="buttons">
                <button class="cart">Add to Cart</button>
                <button class="buy">Buy Now</button>
              </div>
            </div>
          </div>
        `);
      });

      rebindProductEvents(); // 🔥 important
    });
}
