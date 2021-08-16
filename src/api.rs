use axum::{
    extract::{Extension, Form},
    http::StatusCode,
    response::Json,
};
use chrono::{Duration, NaiveDateTime};
use mysql_async::prelude::*;
use serde::Deserialize;
use serde::{Serialize, Serializer};

use crate::{map_country, DisplayDuration};

#[derive(Deserialize, Debug)]
pub struct Input {
    since: i64,
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
