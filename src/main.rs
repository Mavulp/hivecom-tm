use anyhow::Context;
use axum::{
    http::StatusCode,
    prelude::*,
    service::{self, ServiceExt},
    AddExtensionLayer,
};
use tower_http::{services::ServeDir, trace::TraceLayer};
use tracing::{debug, error};

use std::net::SocketAddr;

mod api;
mod parse;
mod site;
mod util;

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

    if let Err(e) = run().await {
        let err = e
            .chain()
            .skip(1)
            .fold(e.to_string(), |acc, cause| format!("{}: {}", acc, cause));
        error!("{}", err);
        std::process::exit(1);
    }
}

async fn run() -> anyhow::Result<()> {
    let database_url: String = std::env::var("DATABASE_URL").context("DATABASE_URL not set")?;
    let bind_addr: SocketAddr = std::env::var("BIND_ADDRESS")
        .context("BIND_ADDRESS not set")?
        .parse()
        .context("BIND_ADDRESS could not be parsed")?;

    let pool = mysql_async::Pool::new(&database_url[..]);

    let app = route("/", get(site::root))
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
    axum::Server::try_bind(&bind_addr)?
        .serve(app.into_make_service())
        .await
        .unwrap();

    Ok(())
}
