use rand::prelude::SliceRandom;
use web_sys::UrlSearchParams;
use web_sys::Window;
use yew::classes;
use yew::function_component;
use yew::html;
use yew::use_callback;
use yew::use_state;
use yew::Html;

use crate::components::canvas::Canvas;
use crate::components::controls::Controls;
use crate::components::github_corner::GithubCorner;
use crate::components::sidebar::Sidebar;
use crate::crate_info::crate_name;
use crate::presets::PRESETS;
use crate::utils::error_println;
use crate::version::git_version;
use crate::EngineSettings;

fn extract_tree_ref(version: &str) -> &str {
    version.split("-g").nth(1).unwrap_or(version)
}

#[function_component]
pub fn App() -> Html {
    let sidebar_expanded = use_state(|| true);

    let settings = use_state(|| {
        let window: Window = web_sys::window().unwrap();

        let from_query = if let Ok(search_params) = window
            .location()
            .search()
            .and_then(|search| UrlSearchParams::new_with_str(&search))
        {
            search_params.get("state")
        } else {
            None
        };

        let state: &str = from_query.as_deref().unwrap_or_else(|| {
            let mut rng = rand::thread_rng();
            let preset = PRESETS.choose(&mut rng).unwrap();
            preset.state
        });

        match EngineSettings::try_restore(state) {
            Ok(settings) => settings,
            Err(err) => {
                error_println!("Failed to restore settings: {err:?}");
                EngineSettings::new()
            }
        }
    });

    let on_toggle_sidebar = use_callback(
        |_, sidebar_expanded| sidebar_expanded.set(!**sidebar_expanded),
        sidebar_expanded.clone(),
    );

    let version_href = git_version()
        .map(extract_tree_ref)
        .map(|v| format!("https://github.com/emlun/fraktal/tree/{v}"))
        .unwrap_or("https://github.com/emlun/fraktal/".to_string());

    let version = git_version().unwrap_or("v. unknown");

    html! {
        <div class="wrapper">
            <GithubCorner
                fill_color="#626262"
                repo="emlun/fraktal"
                visible={ *sidebar_expanded }
            />
            <Canvas settings={ settings.clone() } />
            <Sidebar
                content_classes={ vec!["Sidebar-Content"]}
                expanded={ *sidebar_expanded }
                max_height={ settings.get_height() }
                on_toggle={ on_toggle_sidebar }
                title="Settings"
            >
                <Controls settings={ settings.clone() } />

                <div class={ classes!("flex-stretch") }/>

                <footer class={ classes!("footer") }>
                    <div>
                        { crate_name() }
                        { ' ' }
                        <a href={ version_href }>
                        { version }
                        </a>
                    </div>
                    <div>
                        <a href="https://emlun.se/">
                        { "emlun.se" }
                        </a>
                    </div>
                </footer>
            </Sidebar>
        </div>
    }
}
