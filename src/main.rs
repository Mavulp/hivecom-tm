use askama::Template;
use axum::{
    extract::Extension,
    http::StatusCode,
    prelude::*,
    response::Html,
    service::{self, ServiceExt},
    AddExtensionLayer,
};
use chrono::{Duration, NaiveDateTime};
use mysql_async::prelude::*;
use tower_http::{services::ServeDir, trace::TraceLayer};
use tracing::{debug, error};

use std::collections::BTreeMap;
use std::net::SocketAddr;

mod api;
mod parse;

#[tokio::main]
async fn main() {
    dotenv::dotenv().ok();

    if std::env::var("RUST_LOG").is_err() {
        std::env::set_var(
            "RUST_LOG",
            "tracing_aka_logging=debug,tower_http=debug,info",
        )
    }

    tracing_subscriber::fmt::init();

    let database_url: String =
        std::env::var("DATABASE_URL").expect("SQL_CONNECTION string should be set");
    let bind_addr: SocketAddr = std::env::var("BIND_ADDRESS")
        .expect("BIND_ADDRESS string should be set")
        .parse()
        .unwrap();

    let pool = mysql_async::Pool::new(&database_url[..]);

    let app = route("/", get(root))
        .route("/api/players", get(api::players_get))
        .route("/api/records", get(api::records_get))
        .route("/api/maps", get(api::maps_get))
        .layer(AddExtensionLayer::new(pool))
        .nest(
            "/static",
            service::get(ServeDir::new("./static")).handle_error(|error| {
                Ok::<_, std::convert::Infallible>((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    format!("Unhandled internal error: {}", error),
                ))
            }),
        )
        .layer(TraceLayer::new_for_http());

    debug!("listening on {}", bind_addr);
    axum::Server::bind(&bind_addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}

#[derive(Template)]
#[template(path = "index.html")]
struct IndexTemplate {
    maps: BTreeMap<Map, Vec<Record>>,
}

#[derive(Debug, Clone, Eq)]
struct Map {
    id: u64,
    name: String,
    author: String,
    environment: String,
}

impl Ord for Map {
    fn cmp(&self, other: &Self) -> std::cmp::Ordering {
        self.name.cmp(&other.name)
    }
}

impl PartialOrd for Map {
    fn partial_cmp(&self, other: &Self) -> Option<std::cmp::Ordering> {
        Some(self.cmp(other))
    }
}

impl PartialEq for Map {
    fn eq(&self, other: &Self) -> bool {
        self.id == other.id
    }
}

#[derive(Debug, Clone)]
struct Record {
    player: String,
    country: &'static str,
    time: DisplayDuration,
    date: NaiveDateTime,
}

async fn root(
    Extension(pool): Extension<mysql_async::Pool>,
) -> Result<Html<String>, (StatusCode, String)> {
    let mut conn = pool.get_conn().await.unwrap();

    let loaded_scores = conn
        .exec_iter(
            "SELECT
                challenges.Id,
                CONVERT(CAST(challenges.Name as BINARY) USING utf8),
                challenges.Author,
                challenges.Environment,
                players.Login,
                players.Nation,
                records.Score,
                records.Date
            FROM challenges
            JOIN records ON challenges.Id = records.ChallengeId
            JOIN players ON records.PlayerId = players.Id",
            (),
        )
        .await
        .unwrap()
        .collect::<(
            // Id
            u64,
            // Name
            String,
            // Author
            String,
            // Environment
            String,
            // Player
            String,
            // Country
            String,
            // Time
            i64,
            // Date
            NaiveDateTime,
        )>()
        .await
        .unwrap();

    let mut maps = BTreeMap::new();
    for (id, name, author, environment, player, country, time, date) in loaded_scores {
        let map = Map {
            id,
            name: sanitize_map_name(&name),
            author,
            environment,
        };

        let records = maps.entry(map).or_insert_with(Vec::new);

        let record = Record {
            player,
            country: map_country(&country),
            time: DisplayDuration(Duration::milliseconds(time)),
            date,
        };
        records.push(record);
    }

    for records in maps.values_mut() {
        records.sort_by(|a, b| a.time.cmp(&b.time));
    }

    Ok(Html(IndexTemplate { maps }.render().unwrap()))
}

fn map_country(name: &str) -> &'static str {
    match name {
        "GER" => "de",
        "SWE" => "se",
        "NOR" => "no",
        "KOR" => "kr",
        "NED" => "nl",
        "CZE" => "cz",
        "CAN" => "ca",
        "SUI" => "ch",
        _ => {
            error!("Unknown Country Code: {}", name);
            "global"
        }
    }
}

fn sanitize_map_name(name: &str) -> String {
    parse::map_name_string(name)
}


#[derive(Debug, Clone, Copy)]
pub struct DisplayDuration(Duration);

impl std::fmt::Display for DisplayDuration {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let minutes = self.num_minutes();
        let seconds = (self.num_milliseconds() - minutes * 60000) as f64 / 1000.0;
        write!(f, "{:02}:{:05.2}", minutes, seconds,)
    }
}

impl std::ops::Deref for DisplayDuration {
    type Target = Duration;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}
