document.addEventListener("DOMContentLoaded",function(){let t=document.querySelector(".mobile-menu-btn"),n=document.querySelector(".mobile-nav");t.addEventListener("click",function(){this.classList.toggle("active"),n.classList.toggle("active")});document.querySelectorAll(".mobile-nav a").forEach(e=>{e.addEventListener("click",function(){t.classList.remove("active"),n.classList.remove("active")})});var e=document.querySelector(".expand-timeline");let o=document.querySelectorAll(".timeline-item.hidden"),i=(e&&e.addEventListener("click",function(){o.forEach(e=>{e.classList.toggle("hidden")}),this.textContent.includes("See more")?this.innerHTML='See less experience <span class="icon-chevron-up"></span>':this.innerHTML='See more experience <span class="icon-chevron-down"></span>'}),document.querySelectorAll("section[id]")),r=document.querySelectorAll(".desktop-nav a");window.addEventListener("scroll",function(){let c=window.pageYOffset;i.forEach(e=>{var t=e.offsetTop-100,n=e.offsetHeight;let o=e.getAttribute("id");c>=t&&c<t+n&&r.forEach(e=>{e.classList.remove("active"),e.getAttribute("href")==="#"+o&&e.classList.add("active")})})}),document.querySelectorAll('a[href^="#"]').forEach(e=>{e.addEventListener("click",function(e){e.preventDefault();var e=this.getAttribute("href");"#"!==e&&(e=document.querySelector(e))&&window.scrollTo({top:e.offsetTop-80,behavior:"smooth"})})})});