use stylist::yew::styled_component;
use wasm_bindgen::JsCast;
use wasm_bindgen::JsValue;
use web_sys::window;
use web_sys::Event;
use web_sys::HtmlInputElement;
use web_sys::SubmitEvent;
use yew::classes;
use yew::html;
use yew::use_callback;
use yew::use_state;
use yew::AttrValue;
use yew::Html;
use yew::Properties;
use yew::UseStateHandle;

use crate::components::collapse_box::CollapseBox;
use crate::components::presets::Presets;
use crate::yew::state::UpdateUseStateHandle;
use crate::EngineSettings;
use crate::GradientPivot;

fn on_submit(event: SubmitEvent) {
    event.prevent_default();
}

fn get_state_href(state_string: Option<&str>) -> Result<String, JsValue> {
    let location = window().unwrap().location();
    Ok(format!(
        "{origin}{pathname}?state={state}",
        origin = location.origin()?,
        pathname = location.pathname()?,
        state = state_string.unwrap_or_default(),
    ))
}

#[derive(PartialEq, Properties)]
pub struct Props {
    pub settings: UseStateHandle<EngineSettings>,
}

#[styled_component]
pub fn Controls(props: &Props) -> Html {
    let gradient = props.settings.get_gradient();
    let num_colors = props.settings.get_iteration_limit();

    let max_precision = use_state(|| std::cmp::max(100, num_colors));

    let state_string = props.settings.serialize();
    let state_href = get_state_href(state_string.as_deref()).unwrap_or_default();

    let set_pivot_value = use_callback(
        |(index, value), settings| {
            settings.update(|s| s.gradient_set_pivot_value(index, value));
        },
        props.settings.clone(),
    );

    let on_set_num_colors = use_callback(
        |num_colors: usize, settings| {
            settings.update(|s| s.set_iteration_limit(num_colors));
        },
        props.settings.clone(),
    );

    let on_reduce_max_precision = use_callback(
        move |_, (num_colors, max_precision, on_set_num_colors)| {
            max_precision.set((**max_precision) / 2);
            on_set_num_colors.emit(num_colors / 2);
        },
        (num_colors, max_precision.clone(), on_set_num_colors.clone()),
    );

    let on_increase_max_precision = use_callback(
        |_, (max_precision, num_colors, on_set_num_colors)| {
            if num_colors >= max_precision {
                let new_max = **max_precision * 2;
                max_precision.set(new_max);
                on_set_num_colors.emit(new_max);
            } else {
                on_set_num_colors.emit(**max_precision);
            }
        },
        (max_precision.clone(), num_colors, on_set_num_colors.clone()),
    );

    let set_pivot_color = use_callback(
        |(index, color): (_, String), settings| {
            settings.update(|s| s.gradient_set_pivot_color(index, &color));
        },
        props.settings.clone(),
    );

    let add_gradient_pivot = use_callback(
        |index, settings| {
            settings.update(|s| s.gradient_insert_pivot(index));
        },
        props.settings.clone(),
    );

    let delete_gradient_pivot = use_callback(
        |index, settings| {
            settings.update(|s| s.gradient_delete_pivot(index));
        },
        props.settings.clone(),
    );

    let on_set_inside_color = use_callback(
        |color: String, settings| {
            settings.update(|s| s.gradient_set_inside_color(&color));
        },
        props.settings.clone(),
    );

    let on_zoom_in = use_callback(
        |_, settings| {
            settings.update(|s| s.zoom_in());
        },
        props.settings.clone(),
    );

    let on_zoom_out = use_callback(
        |_, settings| {
            settings.update(|s| s.zoom_out());
        },
        props.settings.clone(),
    );

    let gradient_html: Html = {
        gradient
            .get_pivots()
            .iter()
            .enumerate()
            .map(|(index, pivot): (usize, &GradientPivot)| {
                let color_hex = pivot.color.as_hex();

                html! {
                    < key={ index }>
                        <input
                            class={ classes!("flex-stretch")}
                            max={ ( num_colors - 1 ).to_string() }
                            min={ 0 }
                            onchange={
                                let set_pivot_value = set_pivot_value.clone();
                                move |e: Event| {
                                    if let Some(value) = e.target()
                                        .and_then(|t| t.dyn_into::<HtmlInputElement>().ok())
                                        .and_then(|el| el.value().parse().ok()) {
                                        set_pivot_value.emit((index, value));
                                    }
                                }
                            }
                            type="range"
                            value={ pivot.value.to_string() }
                        />
                        <input
                            onchange={
                                let set_pivot_color = set_pivot_color.clone();
                                move |e: Event| {
                                    if let Some(el) = e.target()
                                        .and_then(|t| t.dyn_into::<HtmlInputElement>().ok()) {
                                        set_pivot_color.emit((index, el.value()));
                                    }
                                }
                            }
                            type="color"
                            value={ color_hex }
                        />
                        <button
                            onclick={
                                let add_gradient_pivot = add_gradient_pivot.clone();
                                move |_| add_gradient_pivot.emit(index)
                            }
                            type="button"
                        >
                            { "+" }
                        </button>
                        <button
                            onclick={
                                let delete_gradient_pivot = delete_gradient_pivot.clone();
                                move |_| delete_gradient_pivot.emit(index)
                            }
                            type="button"
                        >
                            { "-" }
                        </button>
                    </>
                }
            })
            .collect()
    };

    html! {
        <form
            class={ classes!("Controls") }
            onsubmit={ on_submit }
        >
            <div>
                <div class={ classes!("Precision-Slider", "flex-row", "flex-align-center") }>
                    <span class={ css!{ white-space: nowrap; } }>{ "Level of detail:" }</span>

                    <button
                        type="button"
                        disabled={ *max_precision <= 100 }
                        onclick={ on_reduce_max_precision }
                    >
                        { "-" }
                    </button>
                    <input
                        class={ classes!("flex-stretch")}
                        max={ max_precision.to_string() }
                        min={ 10 }
                        onchange={
                            let on_set_num_colors = on_set_num_colors.clone();
                            move |e: Event| {
                                if let Some(value) = e.target()
                                    .and_then(|t| t.dyn_into::<HtmlInputElement>().ok())
                                    .and_then(|el| el.value().parse().ok()) {
                                    on_set_num_colors.emit(value);
                                }
                            }
                        }
                        step={ std::cmp::max(*max_precision / 100, 10).to_string() }
                        type="range"
                        value={ num_colors.to_string() }
                    />
                    <button
                        type="button"
                        onclick={ on_increase_max_precision }
                    >
                        { "+" }
                    </button>
                    <span>
                        { num_colors }
                    </span>
                </div>

                <p class={ css!{ margin-bottom: ${"0.2em"}; }}>{ "Color map:" }</p>
                <div class={ classes!("Gradient") }>
                    { gradient_html }

                    <span>{ "Color inside set: " }</span>
                    <input
                        onchange={
                            let on_set_inside_color = on_set_inside_color.clone();
                            move |e: Event| {
                                if let Some(el) = e.target()
                                .and_then(|t| t.dyn_into::<HtmlInputElement>().ok()) {
                                    on_set_inside_color.emit(el.value());
                                }
                            }
                        }
                        type="color"
                        value={ gradient.get_inside_color().as_hex() }
                    />
                </div>

                <CollapseBox title="Presets">
                    <Presets current={ state_string.map(AttrValue::from) } />
                </CollapseBox>

                <div class={ css!{ margin-top: ${"1em"}; } }>
                    <div class={ classes!("flex-row", "flex-align-baseline") }>
                        <span class={ classes!("flex-stretch") }>{ "Viewing range:" }</span>
                        <div class={ classes!("flex-stretch") }>
                            <button
                                type="button"
                                onclick={ on_zoom_out  }
                                class={ css!{ margin-right: ${"0.5em"}; }}
                            >
                                { "Zoom out" }
                            </button>
                            <button type="button" onclick={ on_zoom_in }>
                                { "Zoom in" }
                            </button>
                        </div>
                    </div>
                    <pre class={ css!{ white-space: break-spaces; }}>
                        { props.settings.describe_range() }
                    </pre>
                </div>

                <div class={ classes!("Controls-Legend") }>
                    <p>
                        { "Pan: Click and drag" }
                    </p>
                    <p>
                        { "Zoom around pointer: Mouse\u{00a0}wheel, double\u{00a0}click, " }
                        <kbd>{ "Shift" }</kbd>
                        { "\u{00a0}+\u{00a0}double\u{00a0}click" }
                    </p>
                    <p>
                        { "Static zoom: " }
                        <kbd>{ "Shift" }</kbd>
                        { "\u{00a0}+\u{00a0}Mouse\u{00a0}wheel" }
                    </p>
                </div>

                <div class={ css!{ text-align: center; }}>
                    <a
                        class={ classes!("button") }
                        href={ state_href }
                    >
                        { "Share this view" }
                    </a>
                </div>
            </div>
        </form>
    }
}
