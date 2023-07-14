use std::cell::RefCell;
use std::num::TryFromIntError;
use std::rc::Rc;

use wasm_bindgen::prelude::Closure;
use wasm_bindgen::JsCast;
use wasm_bindgen::JsValue;
use web_sys::window;
use web_sys::AddEventListenerOptions;
use web_sys::CanvasRenderingContext2d;
use web_sys::EventListenerOptions;
use web_sys::HtmlCanvasElement;
use web_sys::HtmlElement;
use web_sys::ImageData;
use web_sys::MouseEvent;
use web_sys::WheelEvent;
use yew::classes;
use yew::function_component;
use yew::html;
use yew::use_effect_with_deps;
use yew::use_mut_ref;
use yew::use_node_ref;
use yew::Html;
use yew::NodeRef;
use yew::Properties;
use yew::UseStateHandle;

use crate::utils::error_log;
use crate::utils::error_println;
use crate::utils::PtrEq;
use crate::yew::state::UpdateUseStateHandle;
use crate::Engine;
use crate::EngineSettings;

#[derive(PartialEq, Properties)]
pub struct Props {
    pub settings: UseStateHandle<EngineSettings>,
    #[prop_or(10_f64)]
    pub pan_trigger_threshold: f64,
}

#[derive(Clone, Copy)]
struct Pos {
    x: i32,
    y: i32,
}

#[derive(Debug)]
enum CatchallError {
    TryFromInt(TryFromIntError),
    JsError(JsValue),
    NodeRefCast,
}

impl From<TryFromIntError> for CatchallError {
    fn from(v: TryFromIntError) -> Self {
        Self::TryFromInt(v)
    }
}

impl From<JsValue> for CatchallError {
    fn from(v: JsValue) -> Self {
        Self::JsError(v)
    }
}

fn resize_canvas(
    canvas_ref: &NodeRef,
    settings: &UseStateHandle<EngineSettings>,
) -> Result<(), CatchallError> {
    let canvas: HtmlCanvasElement = canvas_ref.cast().ok_or(CatchallError::NodeRefCast)?;
    let width = usize::try_from(canvas.offset_width())?;
    let height = usize::try_from(canvas.offset_height())?;
    canvas.set_width(width.try_into()?);
    canvas.set_height(height.try_into()?);
    if !(width == settings.get_width() && height == settings.get_height()) {
        settings.update(|s| s.set_size(width, height));
    }
    Ok(())
}

impl Pos {
    fn abs(&self) -> f64 {
        (f64::from(self.x).powi(2) + f64::from(self.y).powi(2)).sqrt()
    }
}

#[function_component]
pub fn Canvas(props: &Props) -> Html {
    let mouse_pos = use_mut_ref::<Option<Pos>, _>(|| None);
    let scroll_start_pos = use_mut_ref::<Option<Pos>, _>(|| None);
    let wrapper = use_node_ref();
    let canvas_ref = use_node_ref();
    let engine = use_mut_ref(|| Engine::new(&props.settings));

    use_effect_with_deps(
        |(engine, settings)| {
            settings.update(|mut settings| {
                engine.borrow_mut().apply_settings(&mut settings);
                settings
            });
        },
        (PtrEq::new(Rc::clone(&engine)), props.settings.clone()),
    );

    fn get_scroll_offset(
        scroll_start_pos: &RefCell<Option<Pos>>,
        mouse_pos: &RefCell<Option<Pos>>,
    ) -> Pos {
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
    }

    use_effect_with_deps(
        {
            let canvas_ref = canvas_ref.clone();
            let settings = props.settings.clone();
            move |()| {
                if let Err(err) = resize_canvas(&canvas_ref, &settings) {
                    error_println!("Failed to resize canvas: {:?}", err);
                }
            }
        },
        (),
    );

    use_effect_with_deps(
        |(canvas_ref, settings)| {
            let resize_canvas: Closure<dyn Fn()> = Closure::new({
                let canvas_ref = canvas_ref.clone();
                let settings = settings.clone();
                move || {
                    if let Err(err) = resize_canvas(&canvas_ref, &settings) {
                        error_println!("Failed to resize canvas: {:?}", err);
                    }
                }
            });

            let _ = window().unwrap().add_event_listener_with_callback(
                "resize",
                resize_canvas.as_ref().dyn_ref().unwrap(),
            );
            move || {
                let _ = window().unwrap().remove_event_listener_with_callback(
                    "resize",
                    resize_canvas.as_ref().dyn_ref().unwrap(),
                );
            }
        },
        (canvas_ref.clone(), props.settings.clone()),
    );

    use_effect_with_deps(
        {
            let scroll_start_pos = Rc::clone(&scroll_start_pos);
            let mouse_pos = Rc::clone(&mouse_pos);
            move |(canvas_ref, engine, settings): &(
                NodeRef,
                PtrEq<RefCell<Engine>>,
                UseStateHandle<EngineSettings>,
            )| {
                let canvas: HtmlCanvasElement = canvas_ref.clone().cast().unwrap();
                let stop_render_loop = Rc::new(RefCell::new(None));

                if usize::try_from(canvas.width()).unwrap() == settings.get_width()
                    && usize::try_from(canvas.height()).unwrap() == settings.get_height()
                {
                    let draw_pixels = {
                        let canvas: HtmlCanvasElement = canvas_ref.clone().cast().unwrap();
                        let engine = Rc::clone(engine);
                        let scroll_start_pos = Rc::clone(&scroll_start_pos);
                        let mouse_pos = Rc::clone(&mouse_pos);
                        move || {
                            let image_data = ImageData::new_with_u8_clamped_array(
                                engine.borrow().image_data(),
                                canvas.width(),
                            )
                            .unwrap();

                            let ctx: CanvasRenderingContext2d = canvas
                                .get_context("2d")
                                .unwrap()
                                .unwrap()
                                .dyn_into()
                                .unwrap();

                            ctx.set_fill_style(&"#000000".into());
                            ctx.fill_rect(
                                0_f64,
                                0_f64,
                                canvas.width().into(),
                                canvas.height().into(),
                            );

                            let Pos { x, y } = get_scroll_offset(&scroll_start_pos, &mouse_pos);
                            let _ = ctx.put_image_data(&image_data, x.into(), y.into());
                        }
                    };

                    let mut compute_limit: f64 = 100000_f64;
                    let render_callback: Rc<RefCell<Option<Closure<_>>>> =
                        Rc::new(RefCell::new(None));

                    *render_callback.borrow_mut() = {
                        let engine = Rc::clone(engine);
                        let render_callback = Rc::clone(&render_callback);
                        let stop_render_loop = Rc::downgrade(&stop_render_loop);
                        Some(Closure::new(move || {
                            let perf = window().unwrap().performance().unwrap();
                            let t0 = perf.now();
                            let computed =
                                engine.borrow_mut().compute(compute_limit.round() as usize);
                            let dt = perf.now() - t0;
                            if dt > 1000_f64 / 60_f64 {
                                compute_limit /= 1.5;
                            } else if dt < 1000_f64 / 100_f64
                                && f64::try_from(u32::try_from(computed).unwrap()).unwrap()
                                    >= compute_limit
                            {
                                compute_limit *= 1.5;
                            }

                            engine.borrow_mut().render();
                            draw_pixels();

                            if let Some(stop) = stop_render_loop.upgrade() {
                                if let Ok(mut stop) = stop.try_borrow_mut() {
                                    *stop = Some(
                                        window()
                                            .unwrap()
                                            .request_animation_frame(
                                                render_callback
                                                    .borrow()
                                                    .as_ref()
                                                    .unwrap()
                                                    .as_ref()
                                                    .dyn_ref()
                                                    .unwrap(),
                                            )
                                            .unwrap(),
                                    );
                                }
                            }
                        }))
                    };

                    if let Ok(mut stop) = stop_render_loop.try_borrow_mut() {
                        *stop = Some(
                            window()
                                .unwrap()
                                .request_animation_frame(
                                    render_callback
                                        .borrow()
                                        .as_ref()
                                        .unwrap()
                                        .as_ref()
                                        .dyn_ref()
                                        .unwrap(),
                                )
                                .unwrap(),
                        );
                    }
                }

                move || {
                    if let Some(stop_render_loop) = *stop_render_loop.borrow() {
                        if let Err(err) = window().unwrap().cancel_animation_frame(stop_render_loop)
                        {
                            error_log!("Failed to cancel animation frame", err);
                        }
                    }
                }
            }
        },
        (
            canvas_ref.clone(),
            PtrEq::new(engine),
            props.settings.clone(),
        ),
    );

    use_effect_with_deps(
        move |(settings, wrapper, pan_trigger_threshold)| {
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
                let pan_trigger_threshold = *pan_trigger_threshold;
                let settings = settings.clone();
                move |event: MouseEvent| {
                    *mouse_pos.borrow_mut() = Some(Pos {
                        x: event.offset_x(),
                        y: event.offset_y(),
                    });
                    let scroll_offset: Pos = get_scroll_offset(&scroll_start_pos, &mouse_pos);

                    if scroll_offset.abs() >= pan_trigger_threshold {
                        let Pos { x, y } = scroll_offset;
                        settings.update(|s| s.pan(-x, -y));
                    }

                    *scroll_start_pos.borrow_mut() = None;
                }
            });

            let on_double_click = Closure::new({
                let settings = settings.clone();
                move |event: MouseEvent| {
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

            addevl(&wrapper, "dblclick", &on_double_click);
            addevl(&wrapper, "mousedown", &on_mouse_down);
            addevl(&wrapper, "mousemove", &on_mouse_move);
            addevl(&wrapper, "mouseup", &on_mouse_up);
            addevl(&wrapper, "wheel", &on_wheel);

            move || {
                remevl(&wrapper, "dblclick", &on_double_click);
                remevl(&wrapper, "mousedown", &on_mouse_down);
                remevl(&wrapper, "mousemove", &on_mouse_move);
                remevl(&wrapper, "mouseup", &on_mouse_up);
                remevl(&wrapper, "wheel", &on_wheel);
            }
        },
        (
            props.settings.clone(),
            wrapper.clone(),
            props.pan_trigger_threshold,
        ),
    );

    html! {
        <div
            ref={ wrapper }
            class={ classes!("Canvas-Container") }
        >
            <canvas
                ref={ canvas_ref }
                class={ classes!("main-canvas") }
            />
        </div>
    }
}
