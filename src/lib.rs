include!(concat!(env!("OUT_DIR"), "/version.rs"));

mod complex;
pub mod components;
mod crate_info;
mod mandelbrot;
pub mod math;
pub mod presets;
mod rect;
mod yew;

#[macro_use]
mod utils;

use serde::Deserialize;
use serde::Serialize;
use std::collections::BinaryHeap;
use std::rc::Rc;
use wasm_bindgen::Clamped;

use crate::complex::Complex;
use crate::rect::RectRegion;
use crate::utils::Latch;
use crate::utils::Pristine;

#[derive(Clone, Copy, Debug, Deserialize, PartialEq, Serialize)]
pub struct Color {
    r: u8,
    g: u8,
    b: u8,
    a: u8,
}

impl Color {
    fn of(r: u8, g: u8, b: u8, a: u8) -> Color {
        Color { r, g, b, a }
    }

    fn average(&self, other: &Color) -> Color {
        Color::lerp(self, other, 0, 2, 1)
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

#[derive(Clone, Debug, Deserialize, PartialEq, Serialize)]
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

#[derive(Clone, Debug, Deserialize, PartialEq, Serialize)]
pub struct Gradient {
    inside: Color,
    root: Color,
    pivots: Vec<GradientPivot>,
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
        }
    }
}

impl Gradient {
    pub fn get_pivots(&self) -> &[GradientPivot] {
        &self.pivots
    }

    pub fn get_inside_color(&self) -> Color {
        self.inside
    }

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

    fn set_pivot_value(&mut self, index: usize, value: usize, max_value: usize) -> Option<usize> {
        let new_value = std::cmp::max(std::cmp::min(value, max_value), 0);

        if let Some(i) = index.checked_sub(1) {
            if new_value > 0 && new_value <= self.pivots[i].value {
                self.set_pivot_value(i, new_value.saturating_sub(1), max_value);
            }
        }

        if let Some(i) = index.checked_add(1).filter(|i| *i < self.pivots.len()) {
            if new_value >= self.pivots[i].value {
                self.set_pivot_value(i, new_value + 1, max_value);
            }
        }

        self.pivots.get_mut(index).map(|pivot| {
            pivot.value = new_value;
            new_value
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

    fn make_palette(&self, max_value: usize) -> Palette {
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

        while values.len() <= max_value {
            values.push(self.pivots.last().unwrap().color);
        }

        Palette {
            escape_values: values,
            inside_color: self.inside,
        }
    }
}

#[derive(Debug, PartialEq)]
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

#[derive(Debug, PartialEq)]
pub struct Image {
    width: usize,
    height: usize,
    palette: Palette,
    escape_counts: Vec<usize>,
    pixels: Vec<u8>,
}

impl Image {
    fn new(width: usize, height: usize, palette: Palette) -> Image {
        Image {
            width,
            height,
            palette,
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
    fn image_data(&self) -> Clamped<&[u8]> {
        Clamped(self.pixels.as_slice())
    }
}

#[derive(Clone, Copy)]
pub struct Point {
    pub x: f64,
    pub y: f64,
}

pub struct Viewpoint {
    pub center: Point,
    pub scale: f64,
}

#[derive(Clone, Debug, Deserialize, PartialEq, Serialize)]
pub struct EngineSettings {
    #[serde(skip)]
    size: Latch<(usize, usize)>,
    center: Latch<Complex<f64>>,
    scale: Latch<f64>,
    iteration_limit: Latch<usize>,
    gradient: Pristine<Rc<Gradient>>,
    #[serde(skip)]
    zoom_focus: Latch<Option<(usize, usize)>>,
}

impl EngineSettings {
    const SERIAL_VERSION_PREFIX: &'static str = "0:";

    fn base64_config() -> base64::Config {
        base64::Config::new(base64::CharacterSet::UrlSafe, false)
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

    fn try_restore(serialized: &str) -> Result<Self, Box<dyn std::error::Error>> {
        if let Some(unprefixed) = serialized.strip_prefix(Self::SERIAL_VERSION_PREFIX) {
            let zip = base64::decode_config(unprefixed, Self::base64_config())?;

            use std::io::Read;
            let mut decoder = flate2::read::ZlibDecoder::new(&zip[..]);
            let mut bin = Vec::new();
            decoder.read_to_end(&mut bin)?;

            let deserialized: EngineSettings = bincode::deserialize(&bin)?;
            Ok(deserialized)
        } else {
            Err("Unsupported state version".into())
        }
    }

    fn zoom_around(mut self, new_scale: f64, x: usize, y: usize) -> Self {
        let (width, height) = self.size.current();
        let sdiff = new_scale - *self.scale.current();
        self.center.update(|next| {
            *next
                + Complex::from((
                    sdiff * (*width as f64 / 2.0 - x as f64),
                    sdiff * (y as f64 - *height as f64 / 2.0),
                ))
        });
        self.scale.set(new_scale);
        self.zoom_focus.set(Some((x, y)));
        self
    }
}

impl EngineSettings {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn get_width(&self) -> usize {
        self.size.current().0
    }

    pub fn get_height(&self) -> usize {
        self.size.current().1
    }

    pub fn get_iteration_limit(&self) -> usize {
        *self.iteration_limit.current()
    }

    pub fn get_gradient(&self) -> &Rc<Gradient> {
        self.gradient.get()
    }

    pub fn serialize(&self) -> Option<String> {
        self.try_serialize().ok()
    }

    pub fn restore(serialized: &str) -> Option<EngineSettings> {
        Self::try_restore(serialized).ok()
    }

    pub fn set_size(mut self, width: usize, height: usize) -> Self {
        self.size.set((width, height));
        self
    }

    pub fn pan(mut self, dx: i32, dy: i32) -> Self {
        let scale = *self.scale.current();
        self.center
            .update(|next| *next + Complex::from((dx, -dy)) * scale);
        self
    }

    pub fn zoom_in(mut self, factor: f64) -> Self {
        self.scale.update(|next| next / factor);
        self.zoom_focus.set(None);
        self
    }

    pub fn zoom_out(mut self, factor: f64) -> Self {
        self.scale.update(|next| next * factor);
        self.zoom_focus.set(None);
        self
    }

    pub fn zoom_in_around(self, x: usize, y: usize, factor: f64) -> Self {
        let scale = *self.scale.current();
        self.zoom_around(scale / factor, x, y)
    }

    pub fn zoom_out_around(self, x: usize, y: usize, factor: f64) -> Self {
        let scale = *self.scale.current();
        self.zoom_around(scale * factor, x, y)
    }

    pub fn set_iteration_limit(mut self, iteration_limit: usize) -> Self {
        if let Some(pivot) = Rc::make_mut(&mut self.gradient).pivots.last_mut() {
            pivot.value = iteration_limit;
        }
        self.iteration_limit.set(iteration_limit);
        self
    }

    pub fn gradient_set_pivot_value(mut self, index: usize, value: usize) -> Self {
        Rc::make_mut(&mut self.gradient).set_pivot_value(
            index,
            value,
            *self.iteration_limit.current(),
        );
        self
    }

    pub fn gradient_set_pivot_color(mut self, index: usize, color: &str) -> Self {
        if let Ok(color) = Color::parse_hex(color) {
            Rc::make_mut(&mut self.gradient).set_pivot_color(index, color);
        }
        self
    }

    pub fn gradient_insert_pivot(mut self, index: usize) -> Self {
        Rc::make_mut(&mut self.gradient).insert_pivot(index);
        self
    }

    pub fn gradient_delete_pivot(mut self, index: usize) -> Self {
        Rc::make_mut(&mut self.gradient).delete_pivot(index);
        self
    }

    pub fn gradient_set_inside_color(mut self, color: &str) -> Self {
        if let Ok(color) = Color::parse_hex(color) {
            Rc::make_mut(&mut self.gradient).set_inside_color(color);
        }
        self
    }

    pub fn describe_range(&self) -> String {
        let center = self.center.current();
        let (w, h) = *self.size.current();
        let range = Complex::from((w as f64, h as f64)) * *self.scale.current();
        format!(
            "{:e} ±{:e} {:+e} i ±{:e} i",
            center.re, range.re, center.im, range.im
        )
    }
}

impl Default for EngineSettings {
    fn default() -> Self {
        Self {
            size: (1, 1).into(),
            scale: 0.0078125.into(),
            center: Complex::from((0, 0)).into(),
            iteration_limit: 50.into(),
            gradient: Default::default(),
            zoom_focus: None.into(),
        }
    }
}

#[derive(Debug, Eq, Hash, PartialEq)]
pub(crate) struct ByDistToFocus {
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

#[derive(Debug)]
pub struct Engine {
    top_left: Complex<f64>,
    btm_right: Complex<f64>,
    image: Image,
    dirty_regions: BinaryHeap<ByDistToFocus>,
    zoom_focus: (usize, usize),
    iteration_limit: usize,
}

impl Engine {
    pub fn new(settings: &EngineSettings) -> Self {
        utils::set_panic_hook();

        let (width, height) = settings.size.current();
        let mut e = Self {
            top_left: Complex::from((0, 0)),
            btm_right: Complex::from((0, 0)),
            image: Image::new(
                *width,
                *height,
                settings
                    .gradient
                    .make_palette(settings.get_iteration_limit()),
            ),
            dirty_regions: BinaryHeap::new(),
            zoom_focus: (0, 0),
            iteration_limit: *settings.iteration_limit.current(),
        };
        e.update_limits(*settings.scale.current(), settings.center.current());
        e
    }

    pub fn apply_settings(&mut self, settings: &mut EngineSettings) {
        let EngineSettings {
            size,
            center,
            scale,
            iteration_limit,
            gradient,
            zoom_focus,
        } = settings;

        if let Some((_, (new_width, new_height))) = size.latch() {
            self.set_size(
                *new_width,
                *new_height,
                *scale.current(),
                center.current(),
                gradient,
            );
        }

        match (center.latch(), zoom_focus.latch()) {
            (Some((_, new_center)), Some((_, Some(zoom_focus)))) => {
                self.update_limits(*scale.current(), new_center);
                self.zoom_focus = *zoom_focus;
            }

            (None, Some((_, zoom_focus))) => {
                self.zoom_focus =
                    zoom_focus.unwrap_or((self.image.width / 2, self.image.height / 2));
            }

            (Some((cur_center, new_center)), _) => {
                let scale = *scale.current();

                fn try_i32_from_f64(f: f64) -> Option<i32> {
                    let f = f.round();
                    if f <= f64::from(i32::MAX) && f >= f64::from(i32::MIN) {
                        Some(f as i32)
                    } else {
                        None
                    }
                }

                let Complex { re: dre, im: dim } = *new_center - cur_center;
                match (
                    try_i32_from_f64(dre / scale),
                    try_i32_from_f64(-dim / scale),
                ) {
                    (Some(dx), Some(dy)) => {
                        self.pan(dx, dy, scale, new_center);
                    }
                    (errx, erry) => {
                        error_println!("Failed to update center: {:?}, {:?}", errx, erry);
                    }
                }
            }

            (None, None) => {}
        };

        if let Some((_, new_scale)) = scale.latch() {
            self.dirtify_all();
            self.update_limits(*new_scale, center.current());
        }

        if let Some((_, iteration_limit)) = iteration_limit.latch() {
            if *iteration_limit > self.iteration_limit {
                self.dirtify_all();
            }
            self.iteration_limit = *iteration_limit;
        }

        if let Some(gradient) = gradient.get_dirty() {
            self.image.palette = gradient.make_palette(*iteration_limit.current());
        };
    }

    fn set_size(
        &mut self,
        width: usize,
        height: usize,
        scale: f64,
        center: &Complex<f64>,
        gradient: &Gradient,
    ) {
        self.image = Image::new(width, height, gradient.make_palette(self.iteration_limit));
        self.zoom_focus = (self.image.width / 2, self.image.height / 2);
        self.update_limits(scale, center);
        self.dirtify_all();
    }

    fn update_limits(&mut self, scale: f64, center: &Complex<f64>) {
        let view_center: Complex<f64> = (
            self.image.width as f64 / 2.0 * scale,
            -(self.image.height as f64) / 2.0 * scale,
        )
            .into();
        self.top_left = *center - view_center;
        self.btm_right = *center + view_center;
    }

    fn dirtify_all(&mut self) {
        self.dirty_regions.clear();
        self.dirty_regions.push(ByDistToFocus::of(
            RectRegion::new(0, 0, self.image.width as i32, self.image.height as i32),
            &self.zoom_focus,
        ));
    }

    fn pan(&mut self, dx: i32, dy: i32, scale: f64, new_center: &Complex<f64>) {
        self.zoom_focus = (self.image.width / 2, self.image.height / 2);
        self.update_limits(scale, new_center);
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
            &self.zoom_focus,
        ));
        self.dirty_regions.push({
            let (x0, w) = if dx < 0 {
                (dirty_x_max, self.image.width as i32)
            } else {
                (0, dirty_x_min)
            };
            ByDistToFocus::of(
                RectRegion::new(x0, dirty_y_min, w, dirty_y_max),
                &self.zoom_focus,
            )
        });
    }

    pub fn image_data(&self) -> Clamped<&[u8]> {
        self.image.image_data()
    }

    pub fn compute(&mut self, work_limit: usize) -> usize {
        let mut total_work = 0;
        let corner_diff = self.btm_right - self.top_left;
        let re_span = corner_diff.re;
        let im_span = corner_diff.im;

        while let Some(dirty_region) = self.dirty_regions.pop() {
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
                    let escape_count = mandelbrot::check(c, self.iteration_limit, 4.0);
                    self.image.escape_counts[i] = escape_count;
                    if escape_count < self.iteration_limit {
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
                        self.image.escape_counts[i] = self.iteration_limit;
                    }
                }
                total_work += dirty_region.interior_len();
            } else if let Some((r1, r2, r3)) = dirty_region.trisect() {
                self.dirty_regions
                    .push(ByDistToFocus::of(r1, &self.zoom_focus));
                self.dirty_regions
                    .push(ByDistToFocus::of(r2, &self.zoom_focus));
                self.dirty_regions
                    .push(ByDistToFocus::of(r3, &self.zoom_focus));
            }

            if total_work > work_limit {
                return total_work;
            }
        }

        total_work
    }

    pub fn reset(&mut self) {
        self.dirtify_all();
    }

    pub fn render(&mut self) {
        self.image.render_pixels(self.iteration_limit);
    }
}

#[cfg(test)]
mod tests {

    use std::collections::hash_map::DefaultHasher;

    use std::hash::Hash;
    use std::hash::Hasher;

    use crate::presets::PRESETS;
    use crate::ByDistToFocus;

    use super::Engine;
    use super::EngineSettings;

    fn compute_and_render(mut settings: EngineSettings, work_limit: usize) -> u64 {
        let mut engine = Engine::new(&settings);
        engine.apply_settings(&mut settings);
        engine.compute(work_limit);
        engine.render();

        let mut hasher = DefaultHasher::new();
        engine.image_data().hash(&mut hasher);
        let dirty_regions: Vec<ByDistToFocus> = engine.dirty_regions.into_iter().collect();
        dirty_regions.len().hash(&mut hasher);
        dirty_regions.hash(&mut hasher);
        hasher.finish()
    }

    #[test]
    fn render_defaults() {
        let settings = EngineSettings::default();
        let hash = compute_and_render(settings, 1_000_000);
        const EXPECTED_HASH: u64 = 6440149199439867248;

        assert_eq!(hash, EXPECTED_HASH, "Incorrect hash for default settings",);
    }

    #[test]
    fn render_presets() {
        const PRESET_HASHES: &[(&str, u64)] = &[
            ("Classic", 2402749417319996074),
            ("Hyperspace", 8431504707132117489),
            ("My burning heart", 11737716349129866885),
            ("Poseidon's armory", 10582495367963685427),
            ("The Radiance", 10229493864890202083),
            ("Singularity", 16834773413870134230),
            ("The day they came", 11582418815664262185),
            ("Wildfire", 10072988223159844746),
            ("Xen lightning", 2312505457917857925),
        ];

        assert_eq!(
            PRESETS.len(),
            PRESET_HASHES.len(),
            "Wrong number of preset hashes"
        );

        for preset in &PRESETS {
            let (_, expected_hash) = PRESET_HASHES
                .iter()
                .find(|(name, _)| *name == preset.name)
                .unwrap_or_else(|| panic!("Preset hash not found: {}", preset.name));

            let settings = EngineSettings::restore(preset.state)
                .unwrap()
                .set_size(1920, 1080);

            let hash = compute_and_render(settings, 1_000_000);

            assert_eq!(
                hash, *expected_hash,
                "Incorrect hash for preset {}",
                preset.name
            );
        }
    }
}
