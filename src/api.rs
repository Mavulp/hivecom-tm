use axum::{
    extract::{Extension, Form},
    http::StatusCode,
    response::{IntoResponse, Json, Response},
};

use mysql_async::prelude::*;
use serde::Deserialize;
use serde::{Serialize, Serializer};
use thiserror::Error;
use time::{format_description, Duration, OffsetDateTime, PrimitiveDateTime};

use std::collections::HashMap;

use crate::site::{map_country, DisplayDuration};
use crate::util::sanitize_map_name;

#[derive(Deserialize, Debug)]
pub struct Input {
    since: i64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Record {
    pub map_id: u64,
    pub player: String,
    pub country: &'static str,
    #[serde(serialize_with = "serialize_duration")]
    pub time: DisplayDuration,
    #[serde(serialize_with = "serialize_date")]
    pub date: OffsetDateTime,
    pub unix_date: i64,
}

pub async fn records_get(
    Extension(pool): Extension<mysql_async::Pool>,
    Form(input): Form<Input>,
) -> Result<Json<Vec<Record>>, ApiError> {
    let mut conn = pool.get_conn().await?;

    let loaded_records = conn
        .exec_iter(
            "SELECT
                records.ChallengeId,
                players.Login,
                players.Nation,
                records.Score,
                records.Date
            FROM records
            JOIN players ON records.PlayerId = players.Id",
            (),
        )
        .await?
        .collect::<(u64, String, String, i64, PrimitiveDateTime)>()
        .await?;

    let mut best_scores = HashMap::new();
    for (map_id, player, country, time, date) in loaded_records {
        let date = date.assume_utc();
        let time = DisplayDuration(Duration::milliseconds(time));
        let record = best_scores.entry(map_id).or_insert_with(|| Record {
            map_id,
            player: player.clone(),
            country: map_country(&country),
            time,
            date,
            unix_date: date.unix_timestamp(),
        });

        if *record.time > *time || (*record.time == *time && record.date > date) {
            *record = Record {
                map_id,
                player,
                country: map_country(&country),
                time,
                date,
                unix_date: date.unix_timestamp(),
            };
        }
    }

    let since =
        OffsetDateTime::from_unix_timestamp(input.since).map_err(|_| ApiError::InvalidTimestamp)?;
    let records = best_scores
        .into_values()
        .filter(|r| r.date >= since)
        .collect::<Vec<_>>();

    Ok(Json(records))
}

#[derive(Debug, Clone, Serialize)]
pub struct Map {
    id: u64,
    name: String,
    name_styled: String,
    author: String,
    environment: String,
    records: Vec<Record>,
}

impl PartialEq for Map {
    fn eq(&self, other: &Self) -> bool {
        self.id == other.id
    }
}

impl Eq for Map {}

pub async fn maps_get(
    Extension(pool): Extension<mysql_async::Pool>,
) -> Result<Json<Vec<Map>>, ApiError> {
    let mut conn = pool.get_conn().await?;

    let loaded_maps = conn
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
            PrimitiveDateTime,
        )>()
        .await?;

    let mut maps: HashMap<u64, Map> = HashMap::new();
    for (id, name, author, environment, player, country, time, date) in loaded_maps {
        let date = date.assume_utc();
        if let Some(map) = maps.get_mut(&id) {
            let record = Record {
                map_id: id,
                player,
                country: map_country(&country),
                time: DisplayDuration(Duration::milliseconds(time)),
                date,
                unix_date: date.unix_timestamp(),
            };
            map.records.push(record);
        } else {
            let map = Map {
                id,
                name: crate::util::sanitize_map_name(&name),
                name_styled: crate::util::map_name_html(&name),
                author,
                environment,
                records: vec![Record {
                    map_id: id,
                    player,
                    country: map_country(&country),
                    time: DisplayDuration(Duration::milliseconds(time)),
                    date,
                    unix_date: date.unix_timestamp(),
                }],
            };

            maps.insert(id, map);
        }
    }

    let mut maps = maps.into_values().collect::<Vec<_>>();
    maps.sort_by(|a, b| a.name.cmp(&b.name));
    for map in &mut maps {
        map.records
            .sort_by(|a, b| a.time.cmp(&b.time).then(a.date.cmp(&b.date)));
    }

    let maps = maps.into_iter().collect::<Vec<_>>();

    Ok(Json(maps))
}

#[derive(Debug, Clone, Serialize)]
pub struct Player {
    pub name: String,
    pub country: &'static str,
    pub maps: u64,
    pub records: u64,
    pub latest: Option<LatestRecord>,
}

#[derive(Debug, Clone, Serialize)]
pub struct LatestRecord {
    pub map_name: String,
    #[serde(serialize_with = "serialize_duration")]
    pub time: DisplayDuration,
    #[serde(serialize_with = "serialize_date")]
    pub date: OffsetDateTime,
    pub unix_date: i64,
}

pub async fn players_get(
    Extension(pool): Extension<mysql_async::Pool>,
) -> Result<Json<Vec<Player>>, ApiError> {
    let mut conn = pool.get_conn().await?;

    let loaded_players = conn
        .exec_iter(
            "SELECT
                players.Id,
                CONVERT(CAST(challenges.Name as BINARY) USING utf8),
                players.Nation,
                players.Login,
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
            // Country
            String,
            // Player
            String,
            // Time
            i64,
            // Date
            PrimitiveDateTime,
        )>()
        .await?;

    let mut players = HashMap::new();
    let mut records = HashMap::new();
    for (player_id, map, country, player, time, date) in loaded_players {
        let player = Player {
            name: player,
            country: map_country(&country),
            maps: 0,
            records: 0,
            latest: None,
        };

        let player = players.entry(player_id).or_insert(player);
        player.maps += 1;

        let (record_id, record_time, record_date) = records
            .entry(map.clone())
            .or_insert((player_id, time, date));

        if *record_time > time || (*record_time == time && *record_date > date) {
            *record_id = player_id;
            *record_time = time;
            *record_date = date;
        }
    }

    for (map, (id, time, date)) in records.into_iter() {
        if let Some(player) = players.get_mut(&id) {
            player.records += 1;
            let date = date.assume_utc();
            if let Some(latest) = &mut player.latest {
                if latest.date < date {
                    *latest = LatestRecord {
                        map_name: sanitize_map_name(&map),
                        time: DisplayDuration(Duration::milliseconds(time)),
                        date,
                        unix_date: date.unix_timestamp(),
                    };
                }
            } else {
                player.latest = Some(LatestRecord {
                    map_name: sanitize_map_name(&map),
                    time: DisplayDuration(Duration::milliseconds(time)),
                    date,
                    unix_date: date.unix_timestamp(),
                });
            }
        }
    }

    let mut players = players.into_values().collect::<Vec<_>>();
    players.sort_by(|a, b| a.records.cmp(&b.records).then(a.maps.cmp(&b.maps)));

    Ok(Json(players))
}

pub fn serialize_duration<S>(dur: &DisplayDuration, s: S) -> Result<S::Ok, S::Error>
where
    S: Serializer,
{
    s.serialize_str(&dur.to_string())
}

pub fn serialize_date<S>(date: &OffsetDateTime, s: S) -> Result<S::Ok, S::Error>
where
    S: Serializer,
{
    let format = format_description::parse("[day].[month].[year] [hour]:[minute]").unwrap();
    s.serialize_str(&date.format(&format).map_err(serde::ser::Error::custom)?)
}

#[derive(Error, Debug)]
pub enum ApiError {
    #[error("can not connect to database")]
    DatabaseConnection(#[from] mysql_async::Error),
    #[error("the requested timestamp is not within allowed range")]
    InvalidTimestamp,
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let status = match &self {
            ApiError::DatabaseConnection(_) => StatusCode::SERVICE_UNAVAILABLE,
            ApiError::InvalidTimestamp => StatusCode::BAD_REQUEST,
        };

        (status, self.to_string()).into_response()
    }
}
