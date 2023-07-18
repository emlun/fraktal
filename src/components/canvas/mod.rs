mod canvas_controls;
mod canvas_surface;

use yew::function_component;
use yew::html;
use yew::Html;
use yew::Properties;
use yew::UseStateHandle;

use crate::EngineSettings;

use canvas_controls::CanvasControls;

#[derive(Clone, Copy, PartialEq)]
pub struct Pos {
    x: i32,
    y: i32,
}

impl Pos {
    fn abs(&self) -> f64 {
        (f64::from(self.x).powi(2) + f64::from(self.y).powi(2)).sqrt()
    }

    pub fn unwrap(self) -> (i32, i32) {
        let Self { x, y } = self;
        (x, y)
    }
}

#[derive(PartialEq, Properties)]
pub struct Props {
    pub settings: UseStateHandle<EngineSettings>,
    #[prop_or(10_f64)]
    pub pan_trigger_threshold: f64,
}

#[function_component]
pub fn Canvas(props: &Props) -> Html {
    html! {
        <CanvasControls
            settings={ props.settings.clone() }
            pan_trigger_threshold={ props.pan_trigger_threshold }
        />
    }
}
