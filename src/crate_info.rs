pub fn crate_name() -> &'static str {
    option_env!("CARGO_PKG_NAME").unwrap_or("<program name not set>")
}
