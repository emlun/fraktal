use web_sys::MouseEvent;
use yew::classes;
use yew::function_component;
use yew::html;
use yew::Callback;
use yew::Children;
use yew::Html;
use yew::Properties;

#[derive(PartialEq, Properties)]
pub struct Props {
    pub children: Children,

    #[prop_or(true)]
    pub expanded: bool,

    pub title: &'static str,

    pub on_toggle: Callback<MouseEvent>,
}

#[function_component]
pub fn Sidebar(props: &Props) -> Html {
    html! {
        <div class={ classes!("Sidebar", Some("expanded").filter(|_| props.expanded)) }>
            <button
                class={ classes!("toggle") }
                onclick={ props.on_toggle.clone() }
                type="button"
            >
                <span class={ classes!("toggle-icon") }/>
                <span class={ classes!("toggle-text") }>
                    { props.title }
                </span>
                <span class={ classes!("toggle-icon") }/>
            </button>
            <div class={ classes!("Content") }>
                { for props.children.iter() }
            </div>
        </div>
    }
}
