use std::{path::Path, process::Command};

fn main() {
    let out_dir = std::env::var_os("OUT_DIR").expect("Failed to determine output directory");
    let dest_path = Path::new(&out_dir).join("version.rs");

    let version: Option<String> = Command::new("git")
        .arg("describe")
        .arg("--always")
        .arg("--tags")
        .arg("--match=v*")
        .arg("--long")
        .output()
        .ok()
        .map(|o| o.stdout)
        .and_then(|o| String::from_utf8(o).ok())
        .map(|v| v.trim().replacen('-', ".", 1));

    std::fs::write(
        dest_path,
        format!(
            "mod version {{ pub fn git_version() -> Option<&'static str> {{ {} }} }}",
            version
                .map(|v| format!("Some(\"{v}\")"))
                .unwrap_or("None".to_string())
        ),
    )
    .expect("Failed to write version.rs");
}
