/**
 * Search
 */

const items = document.getElementsByClassName('track')
// TODO: Implement showing of results & 'nothing found'
const resultsEl = document.getElementById('results')

document.getElementById('search').addEventListener('input', function (e) {
  const search = document.getElementById('search').value

  if (search !== '') {
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      const attrs = item.getAttribute('data-keyword') ?? ''

      if (attrs.toLowerCase().includes(search.toLowerCase())) {
        item.style.display = 'block'
      } else {
        item.style.display = 'none'
      }
    }
  } else showAll(items)

  // Run through visible items and count results

  let results = 0
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (item.offsetParent !== null) results++
  }

  if (results < items.length) {
    // Show results
    setResults(`Found <strong>${results}</strong> record(s)`, 'block')
  } else {
    // Hide results
    setResults('', 'none')
  }
})

document.getElementById('clear').addEventListener('click', function (e) {
  document.getElementById('search').value = ''
  showAll(items)
})

function setResults(inner, display) {
  resultsEl.innerHTML = inner
  resultsEl.style.display = display
}

function showAll(items) {
  for (var i = 0; i < items.length; i++) {
    items[i].style.display = 'block'
  }
  setResults('', 'none')
}

/**
 * Add notifications since last login
 */

async function fetchRecords() {
  // Get the time when data was last fetched
  const since = localStorage.getItem('since')

  await fetch('url', {
    method: 'POST',
    body: JSON.stringify({ since: since }),
  })
    .then((response) => {
      const data = response.json()
      // New records since last fetch?, render new notifications
      if (data) renderAlerts(data)
    })
    .catch((e) => {
      console.log('err:')
      alert('Error fetching data. Fuck off.')
    })
    .finally(() => {
      // Get current fetch timestamp and save it
      const now = new Date()
      localStorage.setItem('since', now)
    })
}

function renderAlerts() {
  // First clear all previous notifications

  // Render new notifications
  console.log('piss off')
}

// Runtime
// fetchRecords()

// const FETCH_TIMEOUT = 300000

// const interval = setInterval(() => {
//   fetchRecords()
// }, FETCH_TIMEOUT)
