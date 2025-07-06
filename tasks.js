//DARK THEME 
document.getElementById("themeToggle").addEventListener("click", () => {
document.body.classList.toggle("dark-theme");

  
  const isDark = document.body.classList.contains("dark-theme");
  localStorage.setItem("theme", isDark ? "dark" : "light");
});

// checkboxes system to chose all 
const checkboxes = document.querySelectorAll('.importance');

checkboxes.forEach((checkbox, index) => {
  checkbox.addEventListener('change',() => {
    const level = index + 1;

    checkboxes.forEach((cb, i) => {
      cb.checked = i <= index;
    });
  });
});