const items = document.getElementsByClassName("track")

document.getElementById("search").addEventListener('input', function(e) {
  const search = document.getElementById('search').value

  if (search !== "") {
    for (var i = 0; i < items.length; i++) {
        const item = items[i];
        const attrs = item.getAttribute('data-keyword') ?? "";

        if (attrs.toLowerCase().includes(search.toLowerCase())) {
          item.style.display = "block";
        } else {
          item.style.display = "none";
        }
      }
    } else showAll(items)
})

document.getElementById('clear').addEventListener("click", function(e) {
  document.getElementById('search').value = "";
  showAll(items)
})


function showAll(items) {
  for (var i = 0; i < items.length; i++) {
    items[i].style.display = "block"
  }
}