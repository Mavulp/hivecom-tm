// Vue imports
const app = Vue.createApp({});
const { ref, watch } = Vue;

/**
 * Components
 */

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

// COMPONENT: SEARCH
const search = {
  props: { item: String },
  emits: ["search", "check"],
  setup(_, { emit }) {
    const check = ref(false);
    const search = ref("");

    watch(search, (val) => emit("search", val));
    watch(check, (val) => emit("check", val));

    return { search, check };
  },
  template: `
    <div class="search">
      <input type="checkbox" name="ch" id="ch" @change="(e) => check = e.target.checked" />
      <label for="ch">Show only new records</label>

      <input type="search" v-model="search" placeholder="Search maps & players" /> 
      <button @click="search = ''"><img src="../static/icons/times-solid.svg" /></button>
    </div>
  `,

  // <div class="results" v-if="search !== ''">
  //       <template v-if="results === 0">No results for '{{search}}'</template>
  //       <template v-else>Found <strong>{{results}}</strong> record(s)</template>
  //     </div>
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

      search: "",
      onlyRecords: false,
    };
  },
  created() {
    this.fetchMaps();

    const FETCH_TIMEOUT = 150000;

    this.interval = setInterval(() => {
      this.fetchMaps(false);
    }, FETCH_TIMEOUT);
  },
  computed: {
    renderMaps() {
      const s = this.search;
      const r = this.onlyRecords;
      if (r) {
        const recordMaps = this.maps.filter((map) =>
          this.records.includes(map.id)
        );

        if (s !== "") {
          return recordMaps.filter(
            (map) => map.name.includes(s) || map.records[0].player.includes(s)
          );
        }

        return recordMaps;
      }

      if (s !== "" && !r) {
        return this.maps.filter(
          (map) => map.name.includes(s) || map.records[0].player.includes(s)
        );
      }

      return this.maps;
    },
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
              // TODO: If there are new records, push notification
              console.log("refreshed with changes");
            }

            this.records = data.map((item) => item.mapId);
          }
        });

      await fetch("https://records.hivecom.net/api/maps")
        .then((response) => response.json())
        .then((data) => {
          if (data.length > 0) this.maps = data;
          if (init) this.loading = false;
        });
    },
    s(val) {
      this.search = val;
    },
    n(val) {
      this.onlyRecords = val;
    },
  },
  template: `
    <div>
      <div class="track-list container">
        <search @search="s" @check="n" />

        <div class="legend">
          <span>Track</span>
          <span v-if="search">
          <template v-if="this.renderMaps.length === 0">No results for '{{search}}'</template>
          <template v-else>Found <strong>{{this.renderMaps.length}}</strong> record(s)</template>
          </span>
          <span>Best Time</span>
        </div>

        <template v-if="!loading">
          <template v-for="map in renderMaps" :key="map.id">
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
