use std::rc::Rc;

use stylist::yew::styled_component;
use yew::classes;
use yew::html;
use yew::Html;
use yew::Properties;

#[derive(PartialEq, Properties)]
pub struct Props<'a> {
    pub classes: Option<Vec<&'a str>>,
    pub num_colors: usize,
    pub gradient: Rc<crate::Gradient>,
}

#[styled_component]
pub fn GradientRibbon(props: &Props<'static>) -> Html {
    let ribbon_gradient: Vec<String> = props
        .gradient
        .get_pivots()
        .iter()
        .map(|pivot| {
            format!(
                "{} {}%",
                pivot.color.as_hex(),
                100_f64 * pivot.value as f64 / props.num_colors as f64
            )
        })
        .collect();

    html! {
        <div
            class={ classes!(
                &props.classes,
                "Gradient-Ribbon",
                css!{
                    background: linear-gradient(
                        to right,
                        ${ribbon_gradient.join(", ")}
                    );
                },
            )}
        />
    }
}
