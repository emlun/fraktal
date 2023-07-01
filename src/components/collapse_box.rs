use yew::classes;
use yew::function_component;
use yew::html;
use yew::use_state;
use yew::Children;
use yew::Html;
use yew::Properties;

#[derive(PartialEq, Properties)]
pub struct Props {
    pub children: Children,
    pub title: &'static str,
}

#[function_component]
pub fn CollapseBox(props: &Props) -> Html {
    let expanded = use_state(|| true);

    html! {
        <div
            class={ classes!("CollapseBox", Some("expanded").filter(|_| *expanded)) }
        >
            <button
                class={ classes!("toggle") }
                type="button"
                onclick={ move |_| {expanded.set(!*expanded); } }
            >
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
