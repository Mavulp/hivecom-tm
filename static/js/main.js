// Import app
const app = Vue.createApp({});

// Components
// COMPONENT: TRACK ITEM
const trackItem = {
  props: {
    map: Object,
  },
  template: `
    <div class="track">
      <details>
        <summary>
          <div class="track-name">
            <h2>{{this.map.name}}</h2>
            <span>{{this.map.author}}</span>
          </div>

          <div class="track-record">
            <strong>{{this.map.records[0].time}}</strong>
            <p>{{this.map.records[0].player}}</p>
          </div>
        </summary>

        <div class="track-content">
          <div class="track-time" v-for="record in this.map.records" :key="record.player">
            <strong>{{record.time}}</strong>
            <div class="track-player">
              <img
                :src="'../static/flags/' + record.country + '.svg'"
                :alt="record.country"
              />
              <p>{{record.player}}</p>
            </div>
            <span>{{record.date}}</span>
          </div>
        </div>
      </details>
    </div>
  `,
};

// COMPONNENT: TRACK WRAPPER
const maps = {
  components: {
    "track-item": trackItem,
  },
  data() {
    return {
      loading: false,
      maps: null,
      records: [],
      interval: null,
    };
  },
  created() {
    this.fetchMaps();

    const FETCH_TIMEOUT = 150000;

    this.interval = setInterval(() => {
      this.fetchMaps(false);
    }, FETCH_TIMEOUT);
  },
  methods: {
    async fetchMaps(init = true) {
      this.loading = true;
      const now = new Date();
      const since = (now / 1000).toFixed(0) - 86400;

      await fetch(`https://records.hivecom.net/api/records?since=${since}`)
        .then((response) => response.json())
        .then((data) => {
          if (data.length > 0) {
            if (data.length !== this.records.length && !init) {
              // TODO:
              // If there are new records, push notification
              console.log("refreshed with changes");
            }

            this.records = data.map((item) => item.mapId);
          }
        });

      await fetch("https://records.hivecom.net/api/maps")
        .then((response) => response.json())
        .then((data) => {
          if (data.length > 0) this.maps = data;
        })
        .catch((e) => {
          console.log(e);
        })
        .finally(() => (this.loading = false));
    },
  },
  // TODO: Add legend, search, checkbox components
  template: `
    <div class="track-list container">
      <template v-if="!loading">
        <template v-for="map in maps" :key="map.id">
          <track-item :id="map.id" :class="{'new-record': records.includes(map.id)}" :map="map" />
        </template>
      </template>
      <template v-else>
        Loading
      </template>
    </div>
  `,
};

// COMPONENT

app.component("app", {
  components: {
    maps,
  },
  //TODO: Add description and tabs to this template
  template: `<div class="app-rendered">


    <maps></maps>
  </div>`,
});

app.mount("#app");
