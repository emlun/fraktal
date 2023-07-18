use std::rc::Rc;

use wasm_bindgen::prelude::Closure;
use wasm_bindgen::JsCast;
use web_sys::AddEventListenerOptions;
use web_sys::EventListenerOptions;
use web_sys::HtmlElement;
use web_sys::MouseEvent;
use web_sys::WheelEvent;
use yew::classes;
use yew::function_component;
use yew::html;
use yew::use_callback;
use yew::use_effect_with_deps;
use yew::use_mut_ref;
use yew::use_node_ref;
use yew::Callback;
use yew::Html;
use yew::NodeRef;
use yew::Properties;
use yew::UseStateHandle;

use crate::utils::error_log;
use crate::yew::state::UpdateUseStateHandle;
use crate::EngineSettings;

use super::canvas_surface::Canvas;
use super::Pos;

#[derive(PartialEq, Properties)]
pub struct Props {
    #[prop_or(10_f64)]
    pub pan_trigger_threshold: f64,
    pub settings: UseStateHandle<EngineSettings>,
}

#[function_component]
pub fn CanvasControls(props: &Props) -> Html {
    let mouse_pos = use_mut_ref::<Option<Pos>, _>(|| None);
    let scroll_start_pos = use_mut_ref::<Option<Pos>, _>(|| None);
    let wrapper = use_node_ref();

    let get_scroll_offset: Callback<(), Pos> = use_callback(
        |(), (scroll_start_pos, mouse_pos)| {
            if let (Some(scroll_start_pos), Some(mouse_pos)) = (
                Option::as_ref(&scroll_start_pos.borrow()),
                Option::as_ref(&mouse_pos.borrow()),
            ) {
                Pos {
                    x: mouse_pos.x - scroll_start_pos.x,
                    y: mouse_pos.y - scroll_start_pos.y,
                }
            } else {
                Pos { x: 0, y: 0 }
            }
        },
        (scroll_start_pos.clone(), mouse_pos.clone()),
    );

    use_effect_with_deps(
        {
            let scroll_start_pos = Rc::clone(&scroll_start_pos);
            let mouse_pos = Rc::clone(&mouse_pos);
            move |(get_scroll_offset, settings, wrapper, pan_trigger_threshold): &(
                Callback<(), Pos>,
                UseStateHandle<EngineSettings>,
                NodeRef,
                f64,
            )| {
                let wrapper: HtmlElement = wrapper.clone().cast().unwrap();

                fn get_zoom_factor(shift: bool) -> f64 {
                    if shift {
                        1.05
                    } else {
                        2_f64
                    }
                }

                let on_mouse_down: Closure<dyn Fn(MouseEvent)> = Closure::new({
                    let scroll_start_pos = Rc::clone(&scroll_start_pos);
                    let mouse_pos = Rc::clone(&mouse_pos);
                    move |event: MouseEvent| {
                        let pos = Pos {
                            x: event.offset_x(),
                            y: event.offset_y(),
                        };
                        *scroll_start_pos.borrow_mut() = Some(pos);
                        *mouse_pos.borrow_mut() = Some(pos);
                    }
                });

                let on_mouse_move: Closure<dyn Fn(MouseEvent)> = Closure::new({
                    let scroll_start_pos = Rc::clone(&scroll_start_pos);
                    let mouse_pos = Rc::clone(&mouse_pos);
                    move |event: MouseEvent| {
                        if scroll_start_pos.borrow().is_some() {
                            *mouse_pos.borrow_mut() = Some(Pos {
                                x: event.offset_x(),
                                y: event.offset_y(),
                            });
                        }
                    }
                });

                let on_mouse_up: Closure<dyn Fn(MouseEvent)> = Closure::new({
                    let scroll_start_pos = Rc::clone(&scroll_start_pos);
                    let mouse_pos = Rc::clone(&mouse_pos);
                    let pan_trigger_threshold = *pan_trigger_threshold;
                    let settings = settings.clone();
                    let get_scroll_offset = get_scroll_offset.clone();
                    move |event: MouseEvent| {
                        *mouse_pos.borrow_mut() = Some(Pos {
                            x: event.offset_x(),
                            y: event.offset_y(),
                        });
                        let scroll_offset: Pos = get_scroll_offset.emit(());

                        if scroll_offset.abs() >= pan_trigger_threshold {
                            let Pos { x, y } = scroll_offset;
                            settings.update(|s| s.pan(-x, -y));
                        }

                        *scroll_start_pos.borrow_mut() = None;
                    }
                });

                let on_click = Closure::new({
                    let settings = settings.clone();
                    move |event: MouseEvent| {
                        if event.ctrl_key() && event.alt_key() {
                            let x: i32 = event.offset_x();
                            let y: i32 = event.offset_y();
                            let w: i32 = settings.get_width().try_into().unwrap();
                            let h: i32 = settings.get_height().try_into().unwrap();
                            settings.update(|s| s.pan(x - w / 2, y - h / 2));
                        }
                    }
                });

                let on_double_click = Closure::new({
                    let settings = settings.clone();
                    move |event: MouseEvent| {
                        if !event.alt_key() {
                            let x = event.client_x().try_into().unwrap();
                            let y = event.client_y().try_into().unwrap();
                            let zoom_factor = get_zoom_factor(event.shift_key());
                            settings.update(|s| {
                                if event.ctrl_key() {
                                    s.zoom_out_around(x, y, zoom_factor)
                                } else {
                                    s.zoom_in_around(x, y, zoom_factor)
                                }
                            });
                        }
                    }
                });

                let on_wheel: Closure<dyn Fn(WheelEvent)> = Closure::new({
                    let settings = settings.clone();
                    move |event: WheelEvent| {
                        let zoom_factor = get_zoom_factor(event.shift_key());

                        if !(event.ctrl_key() && !event.alt_key() && !event.shift_key()) {
                            if event.delta_y() > 0_f64 {
                                if event.ctrl_key() && event.alt_key() {
                                    settings.update(|s| s.zoom_out(zoom_factor));
                                } else {
                                    settings.update(|s| {
                                        s.zoom_out_around(
                                            event.client_x().try_into().unwrap(),
                                            event.client_y().try_into().unwrap(),
                                            zoom_factor,
                                        )
                                    });
                                }
                            } else if event.ctrl_key() && event.alt_key() {
                                settings.update(|s| s.zoom_in(zoom_factor));
                            } else {
                                settings.update(|s| {
                                    s.zoom_in_around(
                                        event.client_x().try_into().unwrap(),
                                        event.client_y().try_into().unwrap(),
                                        zoom_factor,
                                    )
                                });
                            }
                        }
                    }
                });

                fn addevl<E>(target: &HtmlElement, ev: &str, l: &Closure<dyn Fn(E)>) {
                    if let Err(err) = target
                        .add_event_listener_with_callback_and_add_event_listener_options(
                            ev,
                            l.as_ref().dyn_ref().unwrap(),
                            AddEventListenerOptions::new().capture(true),
                        )
                    {
                        error_log!("Failed to add event listener:", ev, err);
                    }
                }

                fn remevl<E>(target: &HtmlElement, ev: &str, l: &Closure<dyn Fn(E)>) {
                    if let Err(err) = target
                        .remove_event_listener_with_callback_and_event_listener_options(
                            ev,
                            l.as_ref().dyn_ref().unwrap(),
                            EventListenerOptions::new().capture(true),
                        )
                    {
                        error_log!("Failed to remove event listener:", ev, err);
                    }
                }

                addevl(&wrapper, "click", &on_click);
                addevl(&wrapper, "dblclick", &on_double_click);
                addevl(&wrapper, "mousedown", &on_mouse_down);
                addevl(&wrapper, "mousemove", &on_mouse_move);
                addevl(&wrapper, "mouseup", &on_mouse_up);
                addevl(&wrapper, "wheel", &on_wheel);

                move || {
                    remevl(&wrapper, "click", &on_click);
                    remevl(&wrapper, "dblclick", &on_double_click);
                    remevl(&wrapper, "mousedown", &on_mouse_down);
                    remevl(&wrapper, "mousemove", &on_mouse_move);
                    remevl(&wrapper, "mouseup", &on_mouse_up);
                    remevl(&wrapper, "wheel", &on_wheel);
                }
            }
        },
        (
            get_scroll_offset.clone(),
            props.settings.clone(),
            wrapper.clone(),
            props.pan_trigger_threshold,
        ),
    );

    html! {
        <div
            ref={ wrapper }
        class={ classes!("Canvas-Controls") }
        >
            <Canvas
                { get_scroll_offset }
                settings={ props.settings.clone() }
            />
        </div>
    }
}
