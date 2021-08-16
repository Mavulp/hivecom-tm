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

    if (results === 0) {
      setResults(`No results for &#39;${search}&#39;`, 'block')
    } else {
      setResults(`Found <strong>${results}</strong> record(s)`, 'block')
    }
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

async function fetchRecords(init = true) {
  // Get the time when data was last fetched
  const since = localStorage.getItem('since') ?? 1629133137
  // const since = 1629133137

  await fetch(`https://records.hivecom.net/api/records?since=${since}`)
    .then((response) => response.json())
    .then((data) => {
      if (data) renderAlerts(data.map((item) => item.mapId))
    })
    .catch((e) => {
      console.log('err:', e)
    })
    .finally(() => {
      // Get current fetch timestamp and save it
      const now = (new Date() / 1000).toFixed(0)
      localStorage.setItem('since', now)
    })
}

function renderAlerts(ids) {
  document.getElementsByClassName('track')

  for (let i = 0; i < items.length; i++) {
    const item = items[i]

    // First clear all previous wins
    item.classList.remove('new-record')

    if (ids.includes(Number(item.id))) {
      item.classList.add('new-record')
    }
  }
}

// Runtime
fetchRecords()

// TODO: Implement refresh notification, make it nicer
// TODO: Add checkbox for "Filter new records"

// const FETCH_TIMEOUT = 300000

// const interval = setInterval(() => {
//   // Set init to false, this renders the notification
//   fetchRecords(false)
// }, FETCH_TIMEOUT)
