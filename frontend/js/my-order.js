// /* =========================
//    LOGIN CHECK
// ========================= */
// const loggedUser = JSON.parse(localStorage.getItem("loggedUser"));

// if (!loggedUser || !loggedUser.id) {
//   alert("Please login to view orders");
//   window.location.href = "login.html";
// }

// /* =========================
//    DATE FORMATTER
// ========================= */
// function formatDateTime(dateString) {
//   const date = new Date(dateString);
//   return date.toLocaleString("en-IN", {
//     day: "2-digit",
//     month: "short",
//     year: "numeric",
//     hour: "2-digit",
//     minute: "2-digit",
//     hour12: true
//   });
// }

// /* =========================
//    LOAD ORDERS (BACKEND)
// ========================= */
// function loadOrders() {
//   fetch(`http://localhost:5000/api/orders/${loggedUser.id}`)
//     .then(res => res.json())
//     .then(orders => {
//       const container = document.getElementById("ordersContainer");
//       container.innerHTML = "";

//       if (!orders || orders.length === 0) {
//         container.innerHTML = "<p>No orders found.</p>";
//         return;
//       }

//       orders.forEach(order => {
//         const isCancelled = order.status === "Cancelled";
//         const items = JSON.parse(order.items);
//         const address = JSON.parse(order.address);

//         let itemsHTML = "";
//         items.forEach(item => {
//           itemsHTML += `
//             <div class="order-item">
//               <img src="${item.image}">
//               <div>
//                 <div>${item.title}</div>
//                 <div>Size: ${item.size}</div>
//                 <small>Qty: ${item.qty}</small>
//               </div>
//             </div>
//           `;
//         });

//         container.innerHTML += `
//           <div class="order-card">
//             <div class="order-header">
//               <div>
//                 <strong>Order ID: ${order.order_id}</strong><br>
//                 <small>${formatDateTime(order.created_at)}</small>
//               </div>
//               <div class="status ${isCancelled ? "cancelled" : ""}">
//                 ${order.status}
//               </div>
//             </div>

//             ${itemsHTML}

//             <div class="total">₹${order.total_amount}</div>

//             ${
//               !isCancelled
//                 ? `<button class="cancel-btn"
//                      onclick="cancelOrder('${order.order_id}')">
//                      Cancel Order
//                    </button>`
//                 : ""
//             }
//           </div>
//         `;
//       });
//     })
//     .catch(() => {
//       document.getElementById("ordersContainer").innerHTML =
//         "<p>Failed to load orders</p>";
//     });
// }

// /* =========================
//    CANCEL ORDER (BACKEND)
// ========================= */
// function cancelOrder(orderId) {
//   if (!confirm("Are you sure you want to cancel this order?")) return;

//   fetch("http://localhost:5000/api/order/cancel", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({
//       order_id: orderId,
//       user_id: loggedUser.id
//     })
//   })
//   .then(res => res.json())
//   .then(() => loadOrders())
//   .catch(() => alert("Cancel failed"));
// }

// function clearCancelledOrders() {
//   if (!confirm("Clear all cancelled orders history?")) return;

//   fetch("http://localhost:5000/api/orders/clear-cancelled", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({
//       user_id: loggedUser.id
//     })
//   })
//   .then(res => res.json())
//   .then(() => {
//     alert("Cancelled orders cleared");
//     loadOrders(); // reload list
//   })
//   .catch(() => alert("Failed to clear orders"));
// }

// /* =========================
//    INIT
// ========================= */
// loadOrders();

/* =========================
   LOGIN CHECK
========================= */
const loggedUser = JSON.parse(localStorage.getItem("loggedUser"));

if (!loggedUser || !loggedUser.id) {
  alert("Please login to view orders");
  window.location.href = "login.html";
}

/* =========================
   DATE FORMATTER
========================= */
function formatDateTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
}

/* =========================
   LOAD ORDERS
========================= */
function loadOrders() {
  fetch(`http://localhost:5000/api/orders/${loggedUser.id}`)
    .then(res => res.json())
    .then(orders => {
      const container = document.getElementById("ordersContainer");
      container.innerHTML = "";

      if (!orders || orders.length === 0) {
        container.innerHTML = "<p>No orders found.</p>";
        return;
      }

      orders.forEach(order => {
        const isCancelled = order.status === "Cancelled";
        const isShipped = order.status === "Shipped";
        const items = JSON.parse(order.items);

        let itemsHTML = "";
        items.forEach(item => {

          /* SMART VARIANT DISPLAY */
          let variantHTML = "";
          if (item.rom) {
            variantHTML = `<div><strong>ROM:</strong> ${item.rom}</div>`;
          } else if (item.size) {
            variantHTML = `<div><strong>Size:</strong> ${item.size}</div>`;
          }

          itemsHTML += `
            <div class="order-item">
              <img src="${item.image}">
              <div>
                <div>${item.title}</div>
                ${variantHTML}
                <small>Qty: ${item.qty}</small>
              </div>
            </div>
          `;
        });

        container.innerHTML += `
          <div class="order-card">
            <div class="order-header">
              <div>
                <strong>Order ID: ${order.order_id}</strong><br>
                <small>${formatDateTime(order.created_at)}</small>
              </div>
              <div class="status ${isCancelled ? "cancelled" : ""}">
                ${order.status}
              </div>
            </div>

            ${itemsHTML}

            <div class="total">
              ₹${Number(order.total_amount).toLocaleString("en-IN")}
            </div>

            <div class="order-actions">
              ${
                !isCancelled
                  ? `<button class="cancel-btn"
                       onclick="cancelOrder('${order.order_id}')">
                       Cancel Order
                     </button>`
                  : ""
              }

              ${
                isShipped
                  ? `<button class="return-btn"
                       onclick="returnOrder('${order.order_id}')">
                       Return Order
                     </button>`
                  : ""
              }
            </div>
          </div>
        `;
      });
    })
    .catch(() => {
      document.getElementById("ordersContainer").innerHTML =
        "<p>Failed to load orders</p>";
    });
}

/* =========================
   CANCEL ORDER
========================= */
function cancelOrder(orderId) {
  if (!confirm("Are you sure you want to cancel this order?")) return;

  fetch("http://localhost:5000/api/order/cancel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      order_id: orderId,
      user_id: loggedUser.id
    })
  })
    .then(res => res.json())
    .then(() => loadOrders())
    .catch(() => alert("Cancel failed"));
}

/* =========================
   RETURN ORDER
========================= */
function returnOrder(orderId) {
  if (!confirm("Do you want to return this order?")) return;

  fetch("http://localhost:5000/api/order/return", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      order_id: orderId,
      user_id: loggedUser.id
    })
  })
    .then(res => res.json())
    .then(() => {
      alert("Return request placed successfully");
      loadOrders();
    })
    .catch(() => alert("Return request failed"));
}

/* =========================
   CLEAR CANCELLED ORDERS
========================= */
function clearCancelledOrders() {
  if (!confirm("Clear all cancelled orders history?")) return;

  fetch("http://localhost:5000/api/orders/clear-cancelled", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: loggedUser.id
    })
  })
    .then(res => res.json())
    .then(() => {
      alert("Cancelled orders cleared");
      loadOrders();
    })
    .catch(() => alert("Failed to clear orders"));
}

/* =========================
   INIT
========================= */
loadOrders();
