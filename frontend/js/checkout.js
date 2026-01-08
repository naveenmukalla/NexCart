
// /* =========================
//    LOGIN CHECK
// ========================= */
// const loggedUser = JSON.parse(localStorage.getItem("loggedUser"));

// if (!loggedUser || !loggedUser.id) {
//   alert("Please login first");
//   window.location.href = "login.html";
// }

// /* =========================
//    USER-SPECIFIC CART KEY
// ========================= */
// const CART_KEY = `cart_${loggedUser.id}`;

// /* =========================
//    ADMIN SETTINGS
// ========================= */
// const adminSettings = JSON.parse(localStorage.getItem("adminSettings")) || {
//   deliveryCharge: 40,
//   discountType: "percent", // flat | percent
//   discountValue: 0
// };

// /* =========================
//    GLOBAL STATE
// ========================= */
// let selectedAddress = null;

// /* =========================
//    PRICE PARSER (FIX NaN)
// ========================= */
// function parsePrice(price) {
//   return Number(price.replace(/[₹,]/g, ""));
// }

// /* =========================
//    GET CHECKOUT ITEMS
// ========================= */
// function getCheckoutItems() {
//   const buyNow = JSON.parse(localStorage.getItem("buyNow"));
//   if (buyNow) return [buyNow];

//   return JSON.parse(localStorage.getItem(CART_KEY)) || [];
// }

// /* =========================
//    CALCULATE TOTALS
// ========================= */
// function calculateTotals(items) {
//   let subtotal = 0;

//   items.forEach(item => {
//     const price = parsePrice(item.price);
//     subtotal += price * item.qty;
//   });

//   let discount = 0;
//   if (adminSettings.discountType === "percent") {
//     discount = Math.round(subtotal * adminSettings.discountValue / 100);
//   } else {
//     discount = adminSettings.discountValue;
//   }

//   let deliveryCharge = subtotal >= 999 ? 0 : adminSettings.deliveryCharge;
//   const total = subtotal - discount + deliveryCharge;

//   return { subtotal, discount, deliveryCharge, total };
// }

// /* =========================
//    RENDER ORDER SUMMARY
// ========================= */
// function renderSummary() {
//   const items = getCheckoutItems();
//   const container = document.getElementById("orderItems");

//   if (!container) return;

//   container.innerHTML = "";

//   if (!items.length) {
//     container.innerHTML = "<p>Your cart is empty</p>";
//     setTotals(0, 0, 0, 0);
//     return;
//   }

//   items.forEach(item => {
//     const price = parsePrice(item.price);
//     const itemTotal = price * item.qty;

//     let variant = "";
//     if (item.rom) variant = ` (${item.rom})`;
//     else if (item.size) variant = ` (Size: ${item.size})`;

//     container.innerHTML += `
//       <div class="summary-item">
//         <span>${item.title}${variant} × ${item.qty}</span>
//         <span>₹${itemTotal.toLocaleString("en-IN")}</span>
//       </div>
//     `;
//   });

//   const { subtotal, discount, deliveryCharge, total } =
//     calculateTotals(items);

//   setTotals(subtotal, discount, deliveryCharge, total);
// }

// /* =========================
//    SET TOTAL VALUES
// ========================= */
// function setTotals(sub, dis, del, tot) {
//   document.getElementById("subtotal").innerText =
//     "₹" + sub.toLocaleString("en-IN");

//   document.getElementById("discount").innerText =
//     "₹" + dis.toLocaleString("en-IN");

//   document.getElementById("delivery").innerText =
//     "₹" + del.toLocaleString("en-IN");

//   document.getElementById("grandTotal").innerText =
//     "₹" + tot.toLocaleString("en-IN");
// }

// /* =========================
//    LOAD ADDRESS SELECTOR
// ========================= */
// function loadAddressSelector() {
//   fetch(`http://localhost:5000/api/addresses/${loggedUser.id}`)
//     .then(res => res.json())
//     .then(addresses => {
//       const box = document.getElementById("addressSelector");
//       box.innerHTML = "";

//       if (!addresses || !addresses.length) {
//         box.innerHTML = "<p>No saved addresses. Please add one.</p>";
//         return;
//       }

//       addresses.forEach((addr, index) => {
//         const div = document.createElement("div");
//         div.className = "address-option";

//         if (addr.is_default || index === 0) {
//           div.classList.add("active");
//           selectedAddress = addr;
//         }

//         div.innerHTML = `
//           <input type="radio" name="address" ${addr.is_default || index === 0 ? "checked" : ""}>
//           <div>
//             <p><b>${addr.door}</b>, ${addr.street || ""}</p>
//             <p>
//               ${addr.village || ""}, ${addr.city},
//               ${addr.state} - <b>${addr.pincode || ""}</b>
//             </p>
//             ${addr.is_default ? "<small style='color:green'>Default</small>" : ""}
//           </div>
//         `;

//         div.onclick = () => {
//           document.querySelectorAll(".address-option")
//             .forEach(a => a.classList.remove("active"));

//           div.classList.add("active");
//           div.querySelector("input").checked = true;
//           selectedAddress = addr;
//         };

//         box.appendChild(div);
//       });
//     });
// }

// /* =========================
//    PAY NOW
// ========================= */
// function payNow() {
//   const items = getCheckoutItems();

//   if (!items.length) {
//     alert("Cart is empty");
//     return;
//   }

//   if (!selectedAddress) {
//     alert("Please select a delivery address");
//     return;
//   }

//   const paymentInput =
//     document.querySelector('input[name="payment"]:checked');

//   if (!paymentInput) {
//     alert("Please select payment method");
//     return;
//   }

//   const paymentMethod = paymentInput.value;
//   const { total } = calculateTotals(items);

//   if (paymentMethod === "cod") {
//     saveOrder("COD", total, items);
//     return;
//   }

//   alert("Online payment integration next 🚀");
// }

// /* =========================
//    SAVE ORDER
// ========================= */
// function saveOrder(paymentId, amount, items) {
//   fetch("http://localhost:5000/api/order", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({
//       user_id: loggedUser.id,
//       payment_id: paymentId,
//       payment_mode: paymentId === "COD" ? "COD" : "ONLINE",
//       total_amount: amount,
//       items,
//       address: selectedAddress
//     })
//   })
//     .then(res => res.json())
//     .then(() => {
//       localStorage.removeItem(CART_KEY);
//       localStorage.removeItem("buyNow");
//       window.location.href = "order-success.html";
//     })
//     .catch(() => alert("Order failed"));
// }

// /* =========================
//    INIT
// ========================= */
// window.addEventListener("DOMContentLoaded", () => {
//   loadAddressSelector();
//   renderSummary();
// });

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
   PAY NOW (COD + UPI + CARD)
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
    document.querySelector('input[name="payMethod"]:checked');

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

  if (paymentMethod === "upi") {
    startUPIPayment(total, items);
    return;
  }

  if (paymentMethod === "card") {
    processCardPayment(total, items);
    return;
  }
}

/* =========================
   UPI PAYMENT
========================= */
let pendingUPIOrder = null;

function startUPIPayment(total, items) {
  const upiId = "6304192004@ibl";
  const name = "NexCart";
  const note = "Order Payment";

  const upiURL =
    `upi://pay?pa=${upiId}` +
    `&pn=${encodeURIComponent(name)}` +
    `&am=${total}` +
    `&tn=${encodeURIComponent(note)}` +
    `&cu=INR`;

  // Save pending order in memory
  pendingUPIOrder = { total, items };

  // Show amount in modal
  document.getElementById("upiPayAmount").innerText = total;

  // Try opening UPI app
  window.location.href = upiURL;

  // Fallback → show QR
  setTimeout(() => {
    if (!document.hidden) {
      document.getElementById("upiModal").style.display = "block";
    }
  }, 1000);
}

function confirmUPIPayment() {
  if (!pendingUPIOrder) {
    alert("No payment found");
    return;
  }

  saveOrder(
    "UPI_PENDING_CONFIRMATION",
    pendingUPIOrder.total,
    pendingUPIOrder.items
  );

  window.location.href = "order-success.html";
}


function closeUPIModal() {
  document.getElementById("upiModal").style.display = "none";
}


/* =========================
   CARD PAYMENT (DEMO)
========================= */
function processCardPayment(total, items) {
  const cardNumber =
    document.querySelector('#cardBox input[placeholder="Card Number"]')?.value;

  const expiry =
    document.querySelector('#cardBox input[placeholder="MM / YY"]')?.value;

  const cvv =
    document.querySelector('#cardBox input[placeholder="CVV"]')?.value;

  if (!cardNumber || !expiry || !cvv) {
    alert("Please fill card details");
    return;
  }

  if (cardNumber.replace(/\s/g, "").length < 16) {
    alert("Invalid card number");
    return;
  }

  saveOrder("CARD", total, items);
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
      payment_mode:
        paymentId === "COD" ? "COD" : paymentId === "UPI" ? "UPI" : "CARD",
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

/* =========================
   PAYMENT UI TOGGLE FIX
========================= */
document.addEventListener("DOMContentLoaded", () => {
  const methodRadios = document.querySelectorAll(
    'input[name="payMethod"]'
  );

  methodRadios.forEach(radio => {
    radio.addEventListener("change", () => {
      // hide all
      document.querySelectorAll(".pay-body")
        .forEach(box => box.classList.remove("active"));

      // show selected
      if (radio.value === "cod") {
        document.getElementById("codBox")?.classList.add("active");
      }

      if (radio.value === "upi") {
        document.getElementById("upiBox")?.classList.add("active");
      }

      if (radio.value === "card") {
        document.getElementById("cardBox")?.classList.add("active");
      }
    });
  });
});
