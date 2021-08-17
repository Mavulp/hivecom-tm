const items = document.getElementsByClassName('track')
const resultsEl = document.getElementById('results')
const notifEl = document.getElementById('notification')


/**
 * Search
*/

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

  await fetch(`https://records.hivecom.net/api/records?since=${since}`)
    .then((response) => response.json())
    .then((data) => {
      if (data.length > 0) {
        renderAlerts(data.map((item) => item.mapId))
        if (!init) renderNotif(true)
      }
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

    if (ids.includes(Number(item.id))) {
      item.classList.add('new-record')
    }
  }
}

function renderNotif(state) {
  if (state) {
    notifEl.style.display = "flex"
  } else {
    notifEl.style.display = "none"
  }
}

document.getElementById('clear-notif').addEventListener('click', () => { renderNotif(false) })


/**
 * Fetching loop
 */
fetchRecords()

// TODO: Add checkbox for "Filter new records"

const FETCH_TIMEOUT = 300000

const interval = setInterval(() => {
  // Set init to false, this renders the notification as its not the first time this function is called
  fetchRecords(false)
}, FETCH_TIMEOUT)
