// Vue imports
const app = Vue.createApp({});
const { ref, watch, onMounted } = Vue;

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
};

// COMPONNENT: TRACK WRAPPER
const maps = {
  components: {
    "track-item": trackItem,
    search,
  },
  data() {
    return {
      maps: null,
      search: "",
      records: [],
      loading: false,
      interval: null,
      onlyRecords: false,
      alert: false,
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
      const s = this.search.toLowerCase();
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
            // Push notification that new records were added
            if (data.length > this.records.length && !init) this.alert = true;

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

        <template v-if="!loading">
          <div class="legend">
            <span>Tracks <strong>{{onlyRecords ? records.length : maps?.length}}</strong></span>
            <span v-if="search">
              <template v-if="renderMaps.length === 0">
                No results for '{{search}}'
              </template>
              <template v-else>Found <strong>{{renderMaps.length}}</strong> record(s)</template>
            </span>
            <span>Best Time</span>
          </div>
        
          <template v-for="map in renderMaps" :key="map.id">
            <track-item :id="map.id" :class="{'new-record': records.includes(map.id)}" :map="map" />
          </template>
        </template>
        <div v-else class="loading">Loading</div>
      </div>

      <div class="alert" v-if="alert">
        <div>
          <h2>Content update</h2>
          <p>New records were added to the list.</p>
        </div>
        <button @click="alert = false"><img src="../static/icons/times-solid.svg" /></button>
      </div>
    </div>
  `,
};

// COMPONENT: TABS
const tabs = {
  emits: ["set"],
  setup(props, { emit }) {
    const btns = ["Maps", "Players"];
    const selected = ref(0);

    watch(selected, (val) => {
      window.location.hash = btns[selected.value];
      emit("set", val);
    });

    onMounted(() => {
      const hash = window.location.hash?.split("#")[1];

      if (hash) {
        emit("set", btns.indexOf(hash));
        selected.value = btns.indexOf(hash);
      }
    });

    return { btns, selected };
  },
  template: `
    <div class="container">
      <div class="tabs">
        <button :class="{active: index === selected}" v-for="(b, index) in btns" :key="b" @click="selected = index">
          {{b}}
        </button>
      </div>
    </div>
  `,
};

// COMPONENT: LEADERBOARD
const leaderboards = {
  data() {
    return {
      players: null,
      loading: true,
    };
  },
  created() {
    this.fetchPlayers();

    const FETCH_TIMEOUT = 150000;

    this.interval = setInterval(() => {
      this.fetchPlayers(false);
    }, FETCH_TIMEOUT);
  },
  methods: {
    async fetchPlayers(init = true) {
      if (init) this.loading = true;

      await fetch(`https://records.hivecom.net/api/players`)
        .then((response) => response.json())
        .then((data) => {
          this.players = data.sort((a, b) => (a.records > b.records ? -1 : 1));
        })
        .finally(() => (this.loading = false));
    },
  },
  template: `
    <div class="container container-wide">
      <div class="player-table" v-if="!loading">
        <div class="player-row player-table-headers">
          <span>Player</span>
          <span>Newest Record</span>
          <span>Maps Played</span>
          <span><strong>Records</strong></span>
        </div>

        <div class="player-row" v-for="player in players" :key="player.name">
          <div class="track-player">
            <img
              :src="'../static/flags/' + player.country + '.svg'"
              :alt="player.country"
            />
            <p>{{player.name}}</p>
          </div>
          <div v-if="player.latest">
            <strong>{{player.latest.time}}</strong>
            <span>{{player.latest.map_name}}</span>
          </div>
          <span v-else>-</span>
          <span>{{player.maps}}</span>
          <span><strong>{{player.records}}</strong></span>
        </div>

      </div>
      <div v-else class="loading">Loading</div>
    </div>
  `,
};

// COMPONENT: APP
app.component("app", {
  components: {
    maps,
    tabs,
    leaderboards,
  },
  setup() {
    const tab = ref(0);
    const scrollUp = ref(false);

    window.addEventListener("scroll", () => {
      const s = document.documentElement.scrollTop;

      if (s > Math.round(window.innerHeight / 100)) scrollUp.value = true;
      else scrollUp.value = false;
    });

    return { tab, scrollUp };
  },
  methods: {
    scrollTop() {
      window.scroll({ top: 0, behavior: "smooth" });
    },
  },
  template: `
  <div class="app-rendered">
    <tabs @set="(t) => {tab = t}" />
    
    <maps v-if="tab === 0" />
    <leaderboards v-if="tab === 1" />

    <button class="btn-scroll" v-if="scrollUp" @click="scrollTop">
      <img src="../static/icons/arrow-up-solid.svg" />
    </button>
  </div>`,
});

app.mount("#app");
