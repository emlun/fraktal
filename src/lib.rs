pub mod complex;
pub mod mandelbrot;
pub mod math;
mod rect;

#[macro_use]
mod utils;

use complex::Complex;
use rect::RectRegion;
use serde::Deserialize;
use serde::Serialize;
use std::collections::BinaryHeap;
use utils::Pristine;
use wasm_bindgen::prelude::wasm_bindgen;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
#[derive(Clone, Copy, Debug, Deserialize, Serialize)]
pub struct Color {
    r: u8,
    g: u8,
    b: u8,
    a: u8,
}

#[wasm_bindgen]
impl Color {
    fn of(r: u8, g: u8, b: u8, a: u8) -> Color {
        Color { r, g, b, a }
    }

    fn average(&self, other: &Color) -> Color {
        Color::lerp(&self, other, 0, 2, 1)
    }

    fn lerp(a: &Color, b: &Color, a_value: isize, b_value: isize, target_value: isize) -> Color {
        let dv = b_value - a_value;

        let dr = b.r as isize - a.r as isize;
        let dg = b.g as isize - a.g as isize;
        let db = b.b as isize - a.b as isize;
        let da = b.a as isize - a.a as isize;

        let tv = target_value - a_value;

        Color::of(
            (a.r as isize + dr * tv / dv) as u8,
            (a.g as isize + dg * tv / dv) as u8,
            (a.b as isize + db * tv / dv) as u8,
            (a.a as isize + da * tv / dv) as u8,
        )
    }

    fn parse_hex(hex: &str) -> Result<Color, std::num::ParseIntError> {
        Ok(Color {
            r: u8::from_str_radix(&hex[1..3], 16)?,
            g: u8::from_str_radix(&hex[3..5], 16)?,
            b: u8::from_str_radix(&hex[5..7], 16)?,
            a: 255,
        })
    }

    pub fn as_hex(&self) -> String {
        format!("#{:02x}{:02x}{:02x}", self.r, self.g, self.b)
    }
}

#[wasm_bindgen]
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct GradientPivot {
    pub value: usize,
    pub color: Color,
}

impl GradientPivot {
    fn new(value: usize, color: Color) -> Self {
        GradientPivot { value, color }
    }

    fn average(&self, other: &Self) -> Self {
        GradientPivot {
            value: (self.value + other.value) / 2,
            color: self.color.average(&other.color),
        }
    }
}

#[wasm_bindgen]
#[derive(Clone, Deserialize, Serialize)]
pub struct Gradient {
    inside: Color,
    root: Color,
    pivots: Vec<GradientPivot>,
    max_value: usize,
}

impl Default for Gradient {
    fn default() -> Self {
        Self {
            inside: Color::of(0, 0, 0, 255),
            root: Color::of(0, 0, 0, 255),
            pivots: vec![
                GradientPivot::new(0, Color::of(0, 0, 0, 255)),
                GradientPivot::new(50, Color::of(255, 0, 255, 255)),
            ],
            max_value: 50,
        }
    }
}

#[wasm_bindgen]
impl Gradient {
    pub fn len_pivots(&self) -> usize {
        self.pivots.len()
    }

    pub fn get_pivot(&self, index: usize) -> Option<GradientPivot> {
        self.pivots.get(index).cloned()
    }

    pub fn get_inside_color(&self) -> Color {
        self.inside
    }
}

impl Gradient {
    fn set_inside_color(&mut self, color: Color) {
        self.inside = color;
    }

    fn insert_pivot(&mut self, index: usize) -> GradientPivot {
        if let Some(pivot_after) = self.pivots.get(index + 1) {
            let pivot_before = &self.pivots[index];
            let pivot = pivot_before.average(pivot_after);
            self.pivots.insert(index + 1, pivot.clone());
            pivot
        } else {
            let pivot = self.pivots.last().unwrap().clone();
            self.pivots.push(pivot.clone());
            pivot
        }
    }

    fn delete_pivot(&mut self, index: usize) {
        self.pivots.remove(index);
    }

    fn set_pivot_value(&mut self, index: usize, value: usize) -> Option<usize> {
        let min_value = self.pivots.get(index - 1).map(|p| p.value + 1).unwrap_or(0);
        let max_value = self
            .pivots
            .get(index + 1)
            .map(|p| p.value - 1)
            .unwrap_or(usize::max_value());

        self.pivots.get_mut(index).map(|pivot| {
            let v = std::cmp::max(std::cmp::min(value, max_value), min_value);
            pivot.value = v;
            v
        })
    }

    fn set_pivot_color(&mut self, index: usize, color: Color) -> bool {
        if let Some(pivot) = self.pivots.get_mut(index) {
            pivot.color = color;
            true
        } else {
            false
        }
    }

    fn make_palette(&self) -> Palette {
        let mut values: Vec<Color> = Vec::with_capacity(self.pivots.last().unwrap().value + 1);
        values.push(self.root);
        let mut prev_i = 0;
        let mut prev_color = &self.root;

        for GradientPivot {
            value: escape_count,
            color,
        } in &self.pivots
        {
            for i in prev_i..*escape_count {
                values.push(Color::lerp(
                    prev_color,
                    color,
                    prev_i as isize,
                    *escape_count as isize,
                    i as isize,
                ));
            }

            prev_i = *escape_count;
            prev_color = color;
        }

        while values.len() <= self.max_value {
            values.push(self.pivots.last().unwrap().color);
        }

        Palette {
            escape_values: values,
            inside_color: self.inside,
        }
    }
}

pub struct Palette {
    escape_values: Vec<Color>,
    inside_color: Color,
}

impl Palette {
    fn get_color(&self, escape_count: usize, max_value: usize) -> &Color {
        if escape_count >= max_value {
            &self.inside_color
        } else {
            self.escape_values
                .get(escape_count)
                .unwrap_or(&self.inside_color)
        }
    }
}

pub struct Image {
    width: usize,
    height: usize,
    palette: Palette,
    escape_counts: Vec<usize>,
    pixels: Vec<u8>,
}

impl Image {
    fn new(width: usize, height: usize, gradient: &Gradient) -> Image {
        Image {
            width,
            height,
            palette: gradient.make_palette(),
            escape_counts: vec![0; width * height],
            pixels: vec![0; width * height * 4],
        }
    }

    pub fn pan(&mut self, dx: i32, dy: i32) {
        let di: usize =
            (dx + (dy * self.width as i32)).rem_euclid(self.escape_counts.len() as i32) as usize;

        let v: Vec<usize> = self.escape_counts.clone();
        let l = self.escape_counts.len();
        for (i, v) in v.into_iter().enumerate() {
            self.escape_counts[(i + di) % l] = v;
        }

        let y_to_zero = if dy >= 0 {
            0..(dy as usize)
        } else {
            (self.height - ((-dy) as usize))..self.height
        };

        let x_to_zero = if dx >= 0 {
            0..(dx as usize)
        } else {
            (self.width - ((-dx) as usize))..self.width
        };

        for y in y_to_zero {
            let yw = y * self.width;
            for x in 0..self.width {
                let i = (x + yw).rem_euclid(self.escape_counts.len());
                self.escape_counts[i] = 0;
            }
        }
        for y in 0..self.height {
            let yw = y * self.width;
            for x in x_to_zero.clone() {
                let i = (x + yw).rem_euclid(self.escape_counts.len());
                self.escape_counts[i] = 0;
            }
        }
    }

    pub fn render_pixels(&mut self, max_value: usize) {
        for i in 0..self.escape_counts.len() {
            let pixel_index = i * 4;
            let color = self.palette.get_color(self.escape_counts[i], max_value);
            self.pixels[pixel_index] = color.r;
            self.pixels[pixel_index + 1] = color.g;
            self.pixels[pixel_index + 2] = color.b;
            self.pixels[pixel_index + 3] = color.a;
        }
    }
}

impl Image {
    fn image_data(&self) -> *const u8 {
        self.pixels.as_ptr()
    }
}

#[wasm_bindgen]
#[derive(Clone, Copy)]
pub struct Point {
    pub x: f64,
    pub y: f64,
}

pub struct Viewpoint {
    pub center: Point,
    pub scale: f64,
}

#[wasm_bindgen]
#[derive(Clone, Deserialize, Serialize)]
pub struct EngineSettings {
    center: Complex<f64>,
    scale: f64,
    iteration_limit: usize,
    gradient: Pristine<Gradient>,
}

impl EngineSettings {
    const SERIAL_VERSION_PREFIX: &'static str = "0:";

    fn base64_config() -> base64::Config {
        base64::Config::new(base64::CharacterSet::UrlSafe, false)
    }
}

#[wasm_bindgen]
impl EngineSettings {
    pub fn get_iteration_limit(&self) -> usize {
        self.iteration_limit
    }

    pub fn get_gradient(&self) -> Gradient {
        self.gradient.get().clone()
    }

    fn try_serialize(&self) -> Result<String, bincode::Error> {
        let bin = bincode::serialize(self)?;

        use std::io::Write;
        let mut encoder = flate2::write::ZlibEncoder::new(Vec::new(), flate2::Compression::best());
        encoder.write_all(&bin)?;
        let zip = encoder.finish()?;

        Ok(format!(
            "{}{}",
            Self::SERIAL_VERSION_PREFIX,
            base64::encode_config(zip, Self::base64_config())
        ))
    }

    fn try_restore(&mut self, serialized: &str) -> Result<(), Box<dyn std::error::Error>> {
        if let Some(unprefixed) = serialized.strip_prefix(Self::SERIAL_VERSION_PREFIX) {
            let zip = base64::decode_config(unprefixed, Self::base64_config())?;

            use std::io::Read;
            let mut decoder = flate2::read::ZlibDecoder::new(&zip[..]);
            let mut bin = Vec::new();
            decoder.read_to_end(&mut bin)?;

            let deserialized: EngineSettings = bincode::deserialize(&bin)?;
            *self = deserialized;
            Ok(())
        } else {
            Err("Unsupported state version".into())
        }
    }
}

impl Default for EngineSettings {
    fn default() -> Self {
        Self {
            scale: 0.0078125,
            center: Complex::from((0, 0)),
            iteration_limit: 50,
            gradient: Default::default(),
        }
    }
}

#[derive(Eq, PartialEq)]
struct ByDistToFocus {
    d: i32,
    value: RectRegion,
}
impl ByDistToFocus {
    fn of(value: RectRegion, (focus_x, focus_y): &(usize, usize)) -> Self {
        Self {
            d: -value.squared_distance_to((*focus_x as i32, *focus_y as i32)),
            value,
        }
    }

    fn pan(mut self, dx: i32, dy: i32, img: &Image) -> Self {
        self.value.x0 -= dx;
        self.value.y0 -= dy;
        Self::of(self.value, &(img.width / 2, img.height / 2))
    }
}
impl PartialOrd for ByDistToFocus {
    fn partial_cmp(&self, other: &ByDistToFocus) -> Option<std::cmp::Ordering> {
        Some(self.cmp(other))
    }
}
impl Ord for ByDistToFocus {
    fn cmp(&self, other: &ByDistToFocus) -> std::cmp::Ordering {
        self.d.cmp(&other.d)
    }
}
impl std::ops::Deref for ByDistToFocus {
    type Target = RectRegion;
    fn deref(&self) -> &<Self as std::ops::Deref>::Target {
        &self.value
    }
}

#[wasm_bindgen]
pub struct Engine {
    settings: EngineSettings,
    top_left: Complex<f64>,
    btm_right: Complex<f64>,
    image: Image,
    dirty_regions: BinaryHeap<ByDistToFocus>,
    last_zoom_focus: (usize, usize),
}

impl Default for Engine {
    fn default() -> Self {
        utils::set_panic_hook();

        let settings = EngineSettings::default();
        let mut e = Self {
            top_left: Complex::from((0, 0)),
            btm_right: Complex::from((0, 0)),
            image: Image::new(1, 1, &settings.gradient),
            dirty_regions: BinaryHeap::new(),
            settings,
            last_zoom_focus: (0, 0),
        };
        e.set_size(1, 1);
        e
    }
}

#[wasm_bindgen]
impl Engine {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn set_size(&mut self, width: usize, height: usize) -> EngineSettings {
        self.image = Image::new(width, height, &self.settings.gradient);
        self.last_zoom_focus = (self.image.width / 2, self.image.height / 2);
        self.dirtify_all();
        self.update_limits()
    }

    fn update_limits(&mut self) -> EngineSettings {
        let view_center: Complex<f64> = (
            self.image.width as f64 / 2.0 * self.settings.scale,
            -(self.image.height as f64) / 2.0 * self.settings.scale,
        )
            .into();
        self.top_left = self.settings.center - view_center;
        self.btm_right = self.settings.center + view_center;
        self.get_settings()
    }

    fn dirtify_all(&mut self) {
        self.dirty_regions.clear();
        self.dirty_regions.push(ByDistToFocus::of(
            RectRegion::new(0, 0, self.image.width as i32, self.image.height as i32),
            &self.last_zoom_focus,
        ));
    }

    pub fn get_settings(&self) -> EngineSettings {
        self.settings.clone()
    }

    pub fn pan(&mut self, dx: i32, dy: i32) -> EngineSettings {
        let dre = self.settings.scale * dx as f64;
        let dim = self.settings.scale * (-dy) as f64;
        self.settings.center += (dre, dim).into();
        self.last_zoom_focus = (self.image.width / 2, self.image.height / 2);
        self.update_limits();
        self.image.pan(-dx, -dy);

        let (dirty_x_min, dirty_x_max) = if dx < 0 {
            (0, -dx)
        } else {
            (self.image.width as i32 - dx, self.image.width as i32)
        };

        let (dirty_y_min, dirty_y_max) = if dy < 0 {
            (0, -dy)
        } else {
            (self.image.height as i32 - dy, self.image.height as i32)
        };

        let heap_elems: Vec<ByDistToFocus> = self.dirty_regions.drain().collect();
        let reheap = heap_elems
            .into_iter()
            .map(|elem| elem.pan(dx, dy, &self.image))
            .collect();
        self.dirty_regions = reheap;

        self.dirty_regions.push(ByDistToFocus::of(
            RectRegion::new(dirty_x_min, 0, dirty_x_max, self.image.height as i32),
            &self.last_zoom_focus,
        ));
        self.dirty_regions.push({
            let (x0, w) = if dx < 0 {
                (dirty_x_max, self.image.width as i32)
            } else {
                (0, dirty_x_min)
            };
            ByDistToFocus::of(
                RectRegion::new(x0, dirty_y_min, w, dirty_y_max),
                &self.last_zoom_focus,
            )
        });

        self.settings.clone()
    }

    pub fn zoom_in(&mut self) -> EngineSettings {
        self.settings.scale /= 2.0;
        self.dirtify_all();
        self.last_zoom_focus = (self.image.width / 2, self.image.height / 2);
        self.update_limits()
    }

    pub fn zoom_out(&mut self) -> EngineSettings {
        self.settings.scale *= 2.0;
        self.dirtify_all();
        self.last_zoom_focus = (self.image.width / 2, self.image.height / 2);
        self.update_limits()
    }

    pub fn zoom_in_around(&mut self, x: usize, y: usize) -> EngineSettings {
        self.zoom_around(self.settings.scale / 2.0, x, y)
    }

    pub fn zoom_out_around(&mut self, x: usize, y: usize) -> EngineSettings {
        self.zoom_around(self.settings.scale * 2.0, x, y)
    }

    fn zoom_around(&mut self, new_scale: f64, x: usize, y: usize) -> EngineSettings {
        let sdiff = new_scale - self.settings.scale;
        self.settings.center += (
            sdiff * (self.image.width as f64 / 2.0 - x as f64),
            sdiff * (y as f64 - self.image.height as f64 / 2.0),
        )
            .into();

        self.last_zoom_focus = (x, y);
        self.settings.scale = new_scale;
        self.dirtify_all();
        self.update_limits()
    }

    pub fn image_data(&self) -> *const u8 {
        self.image.image_data()
    }

    pub fn compute(&mut self, work_limit: usize) -> usize {
        let mut total_work = 0;

        while let Some(dirty_region) = self.dirty_regions.pop() {
            let corner_diff = self.btm_right - self.top_left;
            let re_span = corner_diff.re;
            let im_span = corner_diff.im;

            let mut none_escaped = true;

            for (x, y) in dirty_region.border() {
                if x >= 0
                    && x < (self.image.width as i32)
                    && y >= 0
                    && y < (self.image.height as i32)
                {
                    let i = x as usize + y as usize * self.image.width;

                    let c_offset_re: f64 = x as f64 * re_span / self.image.width as f64;
                    let c_offset_im: f64 = y as f64 * im_span / self.image.height as f64;
                    let c_offset: Complex<f64> = (c_offset_re, c_offset_im).into();

                    let c = self.top_left + c_offset;
                    let escape_count = mandelbrot::check(c, self.settings.iteration_limit, 2.0);
                    self.image.escape_counts[i] = escape_count;
                    if escape_count < self.settings.iteration_limit {
                        none_escaped = false;
                    }
                    total_work += escape_count;
                }
            }

            if none_escaped {
                for (x, y) in dirty_region.interior() {
                    if x >= 0
                        && x < (self.image.width as i32)
                        && y >= 0
                        && y < (self.image.height as i32)
                    {
                        let i = x as usize + y as usize * self.image.width;
                        self.image.escape_counts[i] = self.settings.iteration_limit;
                    }
                }
                total_work += dirty_region.interior_len();
            } else if let Some((r1, r2, r3)) = dirty_region.trisect() {
                self.dirty_regions
                    .push(ByDistToFocus::of(r1, &self.last_zoom_focus));
                self.dirty_regions
                    .push(ByDistToFocus::of(r2, &self.last_zoom_focus));
                self.dirty_regions
                    .push(ByDistToFocus::of(r3, &self.last_zoom_focus));
            }

            if total_work > work_limit {
                return total_work;
            }
        }

        total_work
    }

    pub fn render(&mut self) {
        if let Some(gradient) = self.settings.gradient.get_dirty() {
            self.image.palette = gradient.make_palette();
        };
        self.image.render_pixels(self.settings.iteration_limit);
    }

    pub fn set_iteration_limit(&mut self, iteration_limit: usize) -> EngineSettings {
        if iteration_limit > self.settings.iteration_limit {
            self.dirtify_all();
        }
        if let Some(pivot) = self.settings.gradient.pivots.last_mut() {
            pivot.value = iteration_limit;
        }
        self.settings.iteration_limit = iteration_limit;
        self.settings.clone()
    }

    pub fn gradient_set_pivot_value(&mut self, index: usize, value: usize) -> EngineSettings {
        self.settings.gradient.set_pivot_value(index, value);
        self.settings.clone()
    }

    pub fn gradient_set_pivot_color(&mut self, index: usize, color: &str) -> EngineSettings {
        if let Ok(color) = Color::parse_hex(color) {
            self.settings.gradient.set_pivot_color(index, color);
        }
        self.settings.clone()
    }

    pub fn gradient_insert_pivot(&mut self, index: usize) -> EngineSettings {
        self.settings.gradient.insert_pivot(index);
        self.settings.clone()
    }

    pub fn gradient_delete_pivot(&mut self, index: usize) -> EngineSettings {
        self.settings.gradient.delete_pivot(index);
        self.settings.clone()
    }

    pub fn gradient_set_inside_color(&mut self, color: &str) -> EngineSettings {
        if let Ok(color) = Color::parse_hex(color) {
            self.settings.gradient.set_inside_color(color);
        }
        self.settings.clone()
    }

    pub fn serialize_settings(&self) -> Option<String> {
        self.settings.try_serialize().ok()
    }

    pub fn restore_settings(&mut self, serialized: &str) -> Option<EngineSettings> {
        if self.settings.try_restore(serialized).is_ok() {
            self.dirtify_all();
            self.update_limits();
            Some(self.settings.clone())
        } else {
            None
        }
    }

    pub fn describe_range(&self) -> String {
        let center = self.top_left + self.btm_right * 0.5;
        let range =
            (self.btm_right - ((self.top_left + self.btm_right) * 0.5)) * Complex::from((0, 1));
        format!(
            "{:e} ±{:e} {:+e} i ±{:e} i",
            center.re, range.re, center.im, range.im
        )
    }
}
