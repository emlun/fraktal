use stylist::yew::styled_component;
use web_sys::HtmlElement;
use yew::classes;
use yew::html;
use yew::use_node_ref;
use yew::use_state;
use yew::Children;
use yew::Html;
use yew::Properties;

#[derive(PartialEq, Properties)]
pub struct Props {
    pub children: Children,
    pub title: &'static str,
}

#[styled_component]
pub fn CollapseBox(props: &Props) -> Html {
    let expanded = use_state(|| true);
    let content_ref = use_node_ref();
    let content_height = content_ref
        .cast::<HtmlElement>()
        .map(|el| el.client_height().to_string());
    let content_height_unit = content_height.as_ref().map(|_| "px").unwrap_or("initial");

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
            <div class={
                classes!(
                    "content-wrapper",
                    css!{ max-height: ${content_height.as_deref().unwrap_or("")}${content_height_unit}; }
                )
            }>
                <div ref={content_ref} class={ classes!("Content") }>
                    { for props.children.iter() }
                </div>
            </div>
        </div>
    }
}
