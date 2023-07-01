use yew::classes;
use yew::function_component;
use yew::html;
use yew::AttrValue;
use yew::Html;
use yew::Properties;

use crate::presets::Preset;
use crate::presets::PRESETS;

#[derive(PartialEq, Properties)]
struct PresetItemProps {
    current: bool,
    name: AttrValue,
    state: AttrValue,
}

#[function_component]
fn PresetItem(props: &PresetItemProps) -> Html {
    html! {
        <li>
            <a
                class={ classes!(Some("current").filter(|_| props.current)) }
                href={ format!("?state={}", props.state) }
            >
                { &props.name }
            </a>
        </li>
    }
}

#[derive(PartialEq, Properties)]
pub struct Props {
    pub current: Option<AttrValue>,
}

#[function_component]
pub fn Presets(props: &Props) -> Html {
    let is_current = |preset: &Preset| -> bool {
        props
            .current
            .as_ref()
            .map(|state| state == preset.state)
            .unwrap_or(false)
    };

    html! {
        <div class={ classes!("Presets") }>
            <ul>
                {
                    PRESETS.iter().map(|preset| {
                        html! {
                            <PresetItem
                                key={ preset.state }
                                current={ is_current(preset) }
                                name={ preset.name }
                                state={ preset.state }
                            />
                        }
                    }).collect::<Html>()
                }
            </ul>
        </div>
    }
}
