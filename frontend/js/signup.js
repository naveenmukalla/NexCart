/* SIGNUP FUNCTIONALITY */
document.getElementById("signupForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const form = e.target;
  const data = {
    fullname: form.fullname.value,
    emailphone: form.emailphone.value,
    password: form.password.value
  };

  const res = await fetch("http://localhost:5000/signup", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(data)
  });

  const result = await res.json();
  alert(result.message);

  if (res.status === 201) {
    window.location.href = "login.html";
  }
});
