// Vue imports
const app = Vue.createApp({});
const { ref, watch } = Vue;

// Components
// COMPONENT: TRACK ITEM
const trackItem = {
  props: {
    map: Object,
  },
  template: `
    <div class="track" :data-keywords="[this.map.name, this.map.records[0].player]">
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

// COMPONENT: SEARCH
const search = {
  props: { item: String },
  setup(props) {
    const search = ref("");
    const check = ref(false);
    const results = ref(0);

    const elements = document.getElementsByClassName(props.item);

    watch(search, (val) => {
      results.value = 0;

      if (val !== "") {
        for (let i = 0; i < elements.length; i++) {
          const attrs = elements[i].getAttribute("data-keywords") ?? "";
          // prettier-ignore
          if (attrs.toLowerCase().includes(search.value.toLowerCase())) {
            elements[i].style.display = "block";
            results.value++
          }
          else elements[i].style.display = "none";
        }
      } else {
        // prettier-ignore
        for (var i = 0; i < elements.length; i++) elements[i].style.display = "block";
      }
    });

    watch(check, (val) => {
      for (var i = 0; i < elements.length; i++) {
        const el = elements[i];

        console.log(el);

        if (val) {
          if (el.classList.contains("new-record")) el.style.display = "block";
          else el.style.display = "none";
        } else {
          el.style.display = "block";
        }
      }
    });

    return { search, results, check };
  },
  template: `
    <div class="search">
      <input type="checkbox" name="ch" id="ch" @change="(e) => check = e.target.checked" />
      <label for="ch">Show only new records</label>

      <input type="search" v-model="search" placeholder="Search maps & players" v-if="!check" /> 
      <button @click="search = ''"><img src="../static/icons/times-solid.svg" /></button>

      <div class="results" v-if="search !== ''">
        <template v-if="results === 0">No results for '{{search}}'</template>
        <template v-else>Found <strong>{{results}}</strong> record(s)</template>
      </div>
    </div>
  `,
};

// COMPONNENT: TRACK WRAPPER
const maps = {
  components: {
    "track-item": trackItem,
    search,
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
      if (init) this.loading = true;

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
          if (data.length > 0) {
            this.maps = data;
          }
        })
        .catch((e) => {
          console.log(e);
        })
        .finally(() => {
          if (init) this.loading = false;
        });
    },
  },
  template: `
    <div>
      <div class="track-list container">
        <search item="track" />

        <div class="legend">
          <span>Track</span>
          <span>Best Time</span>
        </div>

        <template v-if="!loading">
          <template v-for="map in maps" :key="map.id">
            <track-item :id="map.id" :class="{'new-record': records.includes(map.id)}" :map="map" />
          </template>
        </template>
        <template v-else>
          Loading
        </template>
      </div>
    </div>
  `,
};

// COMPONENT: APP
app.component("app", {
  components: {
    maps,
  },
  //TODO: Add description and tabs to this template
  template: `
  <div class="app-rendered">
    <maps />
  </div>`,
});

app.mount("#app");
