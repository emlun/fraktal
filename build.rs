use git2::DescribeFormatOptions;
use git2::DescribeOptions;
use git2::Repository;
use std::path::Path;

fn main() {
    let out_dir = std::env::var_os("OUT_DIR").expect("Failed to determine output directory");
    let dest_path = Path::new(&out_dir).join("version.rs");

    let version: Option<String> = std::env::var_os("CARGO_MANIFEST_DIR")
        .map(|dir| {
            Repository::open(dir)?
                .describe(DescribeOptions::new().describe_tags().pattern("v*"))?
                .format(Some(
                    DescribeFormatOptions::new().always_use_long_format(true),
                ))
        })
        .and_then(Result::ok)
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
