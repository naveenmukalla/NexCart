const slider = document.querySelector(".slider");
const slides = document.querySelectorAll(".slide");
const dotsContainer = document.querySelector(".dots");

let index = 0;
let interval;

/* Create Dots */
slides.forEach((_, i) => {
    const dot = document.createElement("span");
    dot.classList.add("dot");
    if (i === 0) dot.classList.add("active");
    dot.addEventListener("click", () => {
        index = i;
        updateSlider();
        resetAutoSlide();
    });
    dotsContainer.appendChild(dot);
});

const dots = document.querySelectorAll(".dot");

function updateSlider() {
    slider.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach(dot => dot.classList.remove("active"));
    dots[index].classList.add("active");
}

function nextSlide() {
    index++;
    if (index >= slides.length) index = 0; // infinite loop
    updateSlider();
}

function prevSlide() {
    index--;
    if (index < 0) index = slides.length - 1; // infinite loop
    updateSlider();
}

/* Auto Slide */
function autoSlide() {
    interval = setInterval(nextSlide, 3000); // 3 seconds
}

function resetAutoSlide() {
    clearInterval(interval);
    autoSlide();
}

autoSlide();

// heart color
    function changeImage(src) {
        document.getElementById("mainImg").src = src;
    }
    function changeImage(src) {
        document.getElementById("mainImg").src = src;
    }

    function toggleWishlist(el) {
        el.classList.toggle("active");
    }

/* DROPDOWN DESKTOP */
const userIcon=document.getElementById("userIcon");
userIcon.addEventListener("click",e=>{
  if(window.innerWidth<=768) return;
  e.stopPropagation();
  userIcon.classList.toggle("active");
});
document.addEventListener("click",()=>userIcon.classList.remove("active"));

/* MOBILE MENU */
const hamburger=document.getElementById("hamburger");
const mobileMenu=document.getElementById("mobileMenu");
const overlay=document.getElementById("overlay");
const closeMenu=document.getElementById("closeMenu");

hamburger.onclick=()=>{
  mobileMenu.classList.add("active");
  overlay.classList.add("active");
}
closeMenu.onclick=closeAll;
overlay.onclick=closeAll;

function closeAll(){
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

/* Scroll Animation */
const reveals = document.querySelectorAll(".reveal");

function revealOnScroll() {
  const windowHeight = window.innerHeight;
  reveals.forEach(el => {
    const top = el.getBoundingClientRect().top;
    if (top < windowHeight - 100) {
      el.classList.add("active");
    }
  });
}

window.addEventListener("scroll", revealOnScroll);
revealOnScroll();


function logout() {
  if (confirm("Logout now?")) {
    localStorage.clear();  // clears everything
    sessionStorage.clear();

    window.location.replace("index.html");
  }
}
/* LOGOUT FUNCTIONALITY */