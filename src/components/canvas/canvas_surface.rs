use std::cell::RefCell;
use std::num::TryFromIntError;
use std::rc::Rc;

use wasm_bindgen::prelude::Closure;
use wasm_bindgen::JsCast;
use wasm_bindgen::JsValue;
use web_sys::window;
use web_sys::CanvasRenderingContext2d;
use web_sys::HtmlCanvasElement;
use web_sys::ImageData;
use yew::classes;
use yew::function_component;
use yew::html;
use yew::use_effect_with_deps;
use yew::use_mut_ref;
use yew::use_node_ref;
use yew::Callback;
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

use super::Pos;

type GetScrollOffset = Callback<(), Pos>;

#[derive(Clone, PartialEq, Properties)]
pub struct Props {
    pub settings: UseStateHandle<EngineSettings>,
    pub get_scroll_offset: GetScrollOffset,
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

#[function_component]
pub fn Canvas(props: &Props) -> Html {
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
            move |(canvas_ref, engine, settings, get_scroll_offset): &(
                NodeRef,
                PtrEq<RefCell<Engine>>,
                UseStateHandle<EngineSettings>,
                GetScrollOffset,
            )| {
                let canvas: HtmlCanvasElement = canvas_ref.clone().cast().unwrap();
                let stop_render_loop = Rc::new(RefCell::new(None));

                if usize::try_from(canvas.width()).unwrap() == settings.get_width()
                    && usize::try_from(canvas.height()).unwrap() == settings.get_height()
                {
                    let draw_pixels = {
                        let canvas: HtmlCanvasElement = canvas_ref.clone().cast().unwrap();
                        let engine = Rc::clone(engine);
                        let get_scroll_offset = get_scroll_offset.clone();
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

                            let Pos { x, y } = get_scroll_offset.emit(());
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
            props.get_scroll_offset.clone(),
        ),
    );

    html! {
        <canvas
            ref={ canvas_ref }
            class={ classes!("Canvas") }
        />
    }
}
