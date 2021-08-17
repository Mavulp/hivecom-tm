use axum::{
    extract::{Extension, Form},
    http::StatusCode,
    response::Json,
};
use chrono::{Duration, NaiveDateTime};
use mysql_async::prelude::*;
use serde::Deserialize;
use serde::{Serialize, Serializer};
use std::collections::HashMap;

use crate::{map_country, DisplayDuration};

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
    pub date: NaiveDateTime,
}

pub async fn records_get(
    Extension(pool): Extension<mysql_async::Pool>,
    Form(input): Form<Input>,
) -> Result<Json<Vec<Record>>, (StatusCode, Json<String>)> {
    let mut conn = pool.get_conn().await.unwrap();

    let records = conn
        .exec_iter(
            "SELECT
                records.ChallengeId,
                players.Login,
                players.Nation,
                records.Score,
                records.Date
            FROM records
            JOIN players ON records.PlayerId = players.Id
            WHERE records.Date > :requested",
            params! {
                "requested" => NaiveDateTime::from_timestamp(input.since, 0),
            },
        )
        .await
        .unwrap()
        .collect::<(u64, String, String, i64, NaiveDateTime)>()
        .await
        .unwrap();

    let records = records
        .into_iter()
        .map(|(id, player, country, time, date)| Record {
            map_id: id,
            player,
            country: map_country(&country),
            time: DisplayDuration(Duration::milliseconds(time)),
            date,
        })
        .collect::<Vec<_>>();

    Ok(Json(records))
}

#[derive(Debug, Clone, Serialize)]
pub struct Map {
    id: u64,
    name: String,
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
) -> Result<Json<Vec<Map>>, (StatusCode, Json<String>)> {
    let mut conn = pool.get_conn().await.unwrap();

    let loaded_scores = conn
        .exec_iter(
            "SELECT
                challenges.Id,
                challenges.Name,
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

    let mut maps: HashMap<u64, Map> = HashMap::new();
    for (id, name, author, environment, player, country, time, date) in loaded_scores {
        if let Some(map) = maps.get_mut(&id) {
            let record = Record {
                map_id: id,
                player,
                country: map_country(&country),
                time: DisplayDuration(Duration::milliseconds(time)),
                date,
            };
            map.records.push(record);
        } else {
            let map = Map {
                id,
                name: crate::sanitize_map_name(&name),
                author,
                environment,
                records: vec![Record {
                    map_id: id,
                    player,
                    country: map_country(&country),
                    time: DisplayDuration(Duration::milliseconds(time)),
                    date,
                }],
            };

            maps.insert(id, map);
        }
    }

    let mut maps = maps.into_values().collect::<Vec<_>>();
    maps.sort_by(|a, b| a.name.cmp(&b.name));
    for map in &mut maps {
        map.records.sort_by(|a, b| a.time.cmp(&b.time));
    }

    let maps = maps.into_iter().collect::<Vec<_>>();

    Ok(Json(maps))
}

#[derive(Debug, Clone, Serialize)]
pub struct Player {
    pub name: String,
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
    pub date: NaiveDateTime,
}

pub async fn players_get(
    Extension(pool): Extension<mysql_async::Pool>,
) -> Result<Json<Vec<Player>>, (StatusCode, Json<String>)> {
    let mut conn = pool.get_conn().await.unwrap();

    let loaded_scores = conn
        .exec_iter(
            "SELECT
                players.Id,
                challenges.Name,
                players.Login,
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
            // Player
            String,
            // Time
            i64,
            // Date
            NaiveDateTime,
        )>()
        .await
        .unwrap();

    let mut players = HashMap::new();
    let mut records = HashMap::new();
    for (player_id, map, player, time, date) in loaded_scores {
        let player = Player {
            name: player,
            maps: 0,
            records: 0,
            latest: None,
        };

        let player = players.entry(player_id).or_insert(player);
        player.maps += 1;

        let (record_id, record_map, record_time, record_date) = records
            .entry(map.clone())
            .or_insert((player_id, map.clone(), time, date));
        if *record_time > time || (*record_time == time && *record_date < date) {
            *record_id = player_id;
            *record_map = map;
            *record_time = time;
            *record_date = date;
        }
    }

    for (id, map, time, date) in records.into_values() {
        if let Some(player) = players.get_mut(&id) {
            player.records += 1;
            if let Some(latest) = &mut player.latest {
                if latest.date > date {
                    latest.time = DisplayDuration(Duration::milliseconds(time));
                    latest.date = date;
                }
            } else {
                player.latest = Some(LatestRecord {
                    map_name: map,
                    time: DisplayDuration(Duration::milliseconds(time)),
                    date,
                });
            }
        }
    }

    let mut players = players.into_values().collect::<Vec<_>>();
    players.sort_by(|a, b| a.records.cmp(&b.records));

    Ok(Json(players))
}

pub fn serialize_duration<S>(dur: &DisplayDuration, s: S) -> Result<S::Ok, S::Error>
where
    S: Serializer,
{
    s.serialize_str(&dur.to_string())
}

pub fn serialize_date<S>(date: &NaiveDateTime, s: S) -> Result<S::Ok, S::Error>
where
    S: Serializer,
{
    s.serialize_str(&date.format("%d.%m.%Y %H:%M").to_string())
}
