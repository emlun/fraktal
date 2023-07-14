use stylist::yew::styled_component;
use web_sys::MouseEvent;
use yew::classes;
use yew::html;
use yew::use_callback;
use yew::use_state;
use yew::Callback;
use yew::Children;
use yew::Html;
use yew::Properties;

#[derive(PartialEq, Properties)]
pub struct Props {
    pub children: Children,

    #[prop_or_default]
    pub classes: Option<Vec<&'static str>>,

    #[prop_or_default]
    pub content_classes: Option<Vec<&'static str>>,

    #[prop_or_default]
    pub expanded: Option<bool>,

    #[prop_or(false)]
    pub icon_left: bool,

    #[prop_or(true)]
    pub icon_right: bool,

    pub on_toggle: Option<Callback<MouseEvent>>,
    pub title: &'static str,
}

#[styled_component]
pub fn CollapseBox(props: &Props) -> Html {
    let expanded = use_state(|| props.expanded.unwrap_or(true));
    let is_expanded: bool = props.expanded.unwrap_or(*expanded);

    let toggle_icon = html! { <span class={ classes!("toggle-icon") }/> };
    let toggle_icon_left = Some(toggle_icon.clone()).filter(|_| props.icon_left);
    let toggle_icon_right = Some(toggle_icon).filter(|_| props.icon_right);

    let title_align = match (props.icon_left, props.icon_right) {
        (true, true) => css! { text-align: center; },
        _ => css! { text-align: left; },
    };

    let on_toggle = use_callback(
        move |_, expanded| {
            expanded.set(!**expanded);
        },
        expanded,
    );

    html! {
        <div
            class={ classes!("CollapseBox", Some("expanded").filter(|_| is_expanded), &props.classes) }
        >
            <button
                class={ classes!("toggle") }
                onclick={ props.on_toggle.as_ref().unwrap_or(&on_toggle) }
                type="button"
            >
                { toggle_icon_left }
                <span class={ classes!("toggle-text", title_align) }>
                    { props.title }
                </span>
                { toggle_icon_right }
            </button>
            <div class={ classes!("Content", &props.content_classes) }>
                { for props.children.iter() }
            </div>
        </div>
    }
}
