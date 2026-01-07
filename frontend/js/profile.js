
/* ======================
   LOGIN CHECK
====================== */
const loggedUser = JSON.parse(localStorage.getItem("loggedUser"));

if (!loggedUser || !loggedUser.id) {
  alert("Session expired. Please login again.");
  window.location.href = "login.html";
}

/* ======================
   HEADER INTERACTIONS
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

/* ======================
   MOBILE ACCORDION
====================== */
document.querySelectorAll(".accordion-title").forEach(title => {
  title.addEventListener("click", () => {
    const item = title.parentElement;
    document.querySelectorAll(".accordion-item").forEach(i => {
      if (i !== item) i.classList.remove("active");
    });
    item.classList.toggle("active");
  });
});

/* ======================
   LETTER AVATAR
====================== */
function renderAvatarLetter() {
  const avatarDiv = document.getElementById("avatarLetter");
  if (!avatarDiv) return;

  if (loggedUser.name && loggedUser.name.trim() !== "") {
    avatarDiv.innerText = loggedUser.name.trim().charAt(0).toUpperCase();
  } else {
    avatarDiv.innerText = "U";
  }
}

/* ======================
   LOAD PROFILE
====================== */
function loadProfile() {

  // Load name
  if (loggedUser.name) {
    document.getElementById("name").value = loggedUser.name;
  }

  renderAvatarLetter();

  // Load gender from backend
  fetch(`http://localhost:5000/api/profile/${loggedUser.id}`)
    .then(res => res.json())
    .then(data => {
      if (data && data.gender) {
        document.getElementById("gender").value = data.gender;
      }
    });
}

/* ======================
   SAVE BASIC INFO
====================== */
function saveBasic() {
  const fullName = document.getElementById("name").value.trim();
  const gender = document.getElementById("gender").value;

  if (!fullName) {
    alert("Full name required");
    return;
  }

  fetch("http://localhost:5000/api/profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: loggedUser.id,
      name: fullName,
      gender: gender
    })
  })
  .then(res => res.json())
  .then(() => {
    loggedUser.name = fullName;
    localStorage.setItem("loggedUser", JSON.stringify(loggedUser));
    renderAvatarLetter();
    alert("Profile saved successfully ✅");
  })
  .catch(() => alert("Failed to save profile"));
}

/* ======================
   CONTACT
====================== */
function enableContactEdit() {
  const input = document.getElementById("contactValue");
  input.disabled = false;
  input.focus();
}

function saveContact() {
  const value = document.getElementById("contactValue").value.trim();

  if (!value) {
    alert("Email or phone required");
    return;
  }

  fetch("http://localhost:5000/api/user/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: loggedUser.id,
      emailphone: value
    })
  })
  .then(() => {
    document.getElementById("contactValue").disabled = true;
    loggedUser.emailphone = value;
    localStorage.setItem("loggedUser", JSON.stringify(loggedUser));
    alert("Contact updated successfully");
  });
}

/* ======================
   ADDRESS
====================== */
function saveAddress() {
  fetch("http://localhost:5000/api/address", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: loggedUser.id,
      door: door.value,
      street: street.value,
      village: village.value,
      city: city.value,
      state: state.value,
      pincode: pincode.value,
      is_default: true
    })
  }).then(renderAddresses);
}

function renderAddresses() {
  fetch(`http://localhost:5000/api/addresses/${loggedUser.id}`)
    .then(res => res.json())
    .then(addresses => {
      addressList.innerHTML = "";

      if (!addresses || addresses.length === 0) {
        addressList.innerHTML = "<p>No addresses saved.</p>";
        return;
      }

      addresses.forEach(a => {
        addressList.innerHTML += `
          <div class="address-card ${a.is_default ? "default" : ""}">
            <p><b>${a.door}</b>, ${a.street || ""}</p>
            <p>${a.village || ""}, ${a.city || ""}, ${a.state || ""} ${a.pincode || ""}</p>
          </div>
        `;
      });
    });
}

/* ======================
   INIT
====================== */
loadProfile();
renderAddresses();


function loadContact() {
  fetch(`http://localhost:5000/api/user/${loggedUser.id}`)
    .then(res => res.json())
    .then(user => {
      document.getElementById("contactValue").value =
        user.emailphone || "";
    });
}

loadContact();
function enableContactEdit() {
  const input = document.getElementById("contactValue");
  input.disabled = false;
  input.focus();
}
function saveContact() {
  const value = document.getElementById("contactValue").value.trim();

  if (!value) {
    alert("Email or phone required");
    return;
  }

  fetch("http://localhost:5000/api/user/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: loggedUser.id,
      emailphone: value
    })
  })
  .then(res => res.json())
  .then(() => {
    document.getElementById("contactValue").disabled = true;
    alert("Contact updated successfully");

    // keep localStorage in sync
    loggedUser.emailphone = value;
    localStorage.setItem("loggedUser", JSON.stringify(loggedUser));
  });
}


function setDefaultAddress(addressId) {
  fetch("http://localhost:5000/api/address/default", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: loggedUser.id,
      address_id: addressId
    })
  }).then(renderAddresses);
}

function renderAddresses() {
  fetch(`http://localhost:5000/api/addresses/${loggedUser.id}`)
    .then(res => res.json())
    .then(addresses => {
      addressList.innerHTML = "";

      addresses.forEach(a => {
        
        addressList.innerHTML += `
  <div class="address-card ${a.is_default ? "default" : ""}">
    <p><b>${a.door}</b>, ${a.street || ""}</p>
    <p>
      ${a.village || ""}, ${a.city}, ${a.state || ""} - 
      <b>${a.pincode || ""}</b>
    </p>

    ${a.is_default ? "<p style='color:green'><b>Default</b></p>" : ""}

    <div class="address-actions">
      <button class="btn edit" onclick="fillEdit(${a.id})">Edit</button>
      <button class="btn delete-btn" onclick="removeAddress(${a.id})">Delete</button>
    </div>
  </div>
`;

      });
    });
}



let editingId = null;

function fillEdit(id) {
  fetch(`http://localhost:5000/api/addresses/${loggedUser.id}`)
    .then(res => res.json())
    .then(list => {
      const a = list.find(x => x.id === id);
      door.value = a.door;
      street.value = a.street;
      village.value = a.village;
      city.value = a.city;
      state.value = a.state;
      pincode.value = a.pincode;
      editingId = id;
    });
}

function removeAddress(id) {
  if (!confirm("Delete address?")) return;

  fetch(`http://localhost:5000/api/address/${id}?user_id=${loggedUser.id}`, {
    method: "DELETE"
  }).then(renderAddresses);
}

/* ======================
   LOGOUT
====================== */
function logout() {
  if (confirm("Logout now?")) {
    localStorage.clear();  // clears everything
    sessionStorage.clear();

    window.location.replace("index.html");
  }
}