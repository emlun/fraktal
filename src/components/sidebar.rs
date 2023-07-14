use stylist::yew::styled_component;
use web_sys::HtmlElement;
use web_sys::MouseEvent;
use yew::classes;
use yew::html;
use yew::use_node_ref;
use yew::Callback;
use yew::Children;
use yew::Html;
use yew::Properties;

#[derive(PartialEq, Properties)]
pub struct Props {
    pub children: Children,
    pub content_classes: Option<Vec<&'static str>>,

    #[prop_or(true)]
    pub expanded: bool,

    pub max_height: Option<usize>,
    pub on_toggle: Callback<MouseEvent>,
    pub title: &'static str,
}

#[styled_component]
pub fn Sidebar(props: &Props) -> Html {
    let button_ref = use_node_ref();
    let button_height: usize = button_ref
        .cast::<HtmlElement>()
        .map(|el| el.client_height())
        .unwrap_or(0)
        .try_into()
        .unwrap();

    let height_class = props
        .max_height
        .map(|h| if props.expanded { h } else { button_height })
        .map(|h| css! { height: ${h}px; });

    let max_height_class = props.max_height.map(|h| css! { max-height: ${h}px; });

    html! {
        <div class={ classes!("Sidebar", Some("expanded").filter(|_| props.expanded), height_class) }>
            <button
                ref={ button_ref }
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
            <div class={ classes!("Content", max_height_class, &props.content_classes) }>
                { for props.children.iter() }
            </div>
        </div>
    }
}
