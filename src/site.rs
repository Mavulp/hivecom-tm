use askama::Template;
use axum::{extract::Extension, response::Html};
use chrono::{Duration, NaiveDateTime};
use mysql_async::prelude::*;
use tracing::error;

use std::collections::BTreeMap;

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

pub async fn root(
    Extension(pool): Extension<mysql_async::Pool>,
    // FIXME Create an actual error page
) -> Result<Html<String>, crate::api::ApiError> {
    let mut conn = pool.get_conn().await?;

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
        .await?
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
        .await?;

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

pub fn map_country(name: &str) -> &'static str {
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

pub fn sanitize_map_name(name: &str) -> String {
    crate::parse::map_name_string(name).expect("Parser supports all valid map names")
}

#[derive(Debug, Clone, Copy)]
pub struct DisplayDuration(pub Duration);

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
