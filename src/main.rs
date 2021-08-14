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
use lazy_static::lazy_static;
use mysql_async::prelude::*;
use regex::Regex;
use tower_http::{services::ServeDir, trace::TraceLayer};

use std::collections::BTreeMap;
use std::net::SocketAddr;

lazy_static! {
    static ref RE: Regex = Regex::new("\\$([\\dabcdefABCDEF]{3}|.)").unwrap();
}

#[tokio::main]
async fn main() {
    dotenv::dotenv().ok();
    tracing_subscriber::fmt::init();

    let database_url: String =
        std::env::var("DATABASE_URL").expect("SQL_CONNECTION string should be set");
    let bind_addr: SocketAddr =
        std::env::var("BIND_ADDRESS").expect("BIND_ADDRESS string should be set").parse().unwrap();

    let pool = mysql_async::Pool::new(&database_url[..]);

    let app = route("/", get(root))
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

    tracing::debug!("listening on {}", bind_addr);
    axum::Server::bind(&bind_addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}

#[derive(Template)]
#[template(path = "index.htm")]
struct IndexTemplate<'a> {
    maps: BTreeMap<Map, Vec<Record<'a>>>,
}

#[derive(Debug, Clone, Eq)]
struct Map {
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
        self.name == other.name
    }
}

#[derive(Debug, Clone)]
struct Record<'a> {
    player: String,
    country: &'a str,
    time: Duration,
    date: NaiveDateTime,
}

// basic handler that responds with a static string
async fn root(
    Extension(pool): Extension<mysql_async::Pool>,
) -> Result<Html<String>, (StatusCode, String)> {
    let mut conn = pool.get_conn().await.unwrap();

    let loaded_scores = conn
        .exec_iter(
            "SELECT challenges.Name,
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
                  //Name,   Author, Env,    Login,  Nation, Score, Date
        .collect::<(String, String, String, String, String, i64, NaiveDateTime)>()
        .await
        .unwrap();

    let mut maps = BTreeMap::new();
    for (name, author, environment, player, country, time, date) in loaded_scores {
        let map = Map {
            name: sanitize_map_name(&name),
            author,
            environment,
        };

        let records = maps.entry(map).or_insert(Vec::new());

        let record = Record {
            player,
            country: map_country(&country),
            time: Duration::milliseconds(time),
            date,
        };
        records.push(record);
    }

    for (_, records) in &mut maps {
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
            dbg!(&name);
            "global"
        }
    }
}

fn sanitize_map_name(name: &str) -> String {
    RE.replace_all(name, "").to_string()
}

mod filters {
    use chrono::Duration;

    pub fn fmt_duration(duration: &Duration) -> Result<String, askama::Error> {
        let minutes = duration.num_minutes();
        let seconds = (duration.num_milliseconds() - minutes * 60000) as f64 / 1000.0;
        Ok(format!(
            "{:02}:{:05.2}",
            minutes,
            seconds,
        ))
    }
}
