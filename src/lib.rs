pub mod complex;
pub mod mandelbrot;
pub mod math;
#[macro_use]
mod utils;

use complex::Complex;
use math::NextCoprime;
use std::collections::VecDeque;
use std::ops::Add;
use std::ops::Div;
use std::ops::Mul;
use std::ops::Rem;
use std::ops::Sub;
use utils::Pristine;
use wasm_bindgen::prelude::wasm_bindgen;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
#[derive(Clone, Copy, Debug)]
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
#[derive(Clone, Debug)]
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
    fn new(width: usize, height: usize) -> Image {
        Image {
            width,
            height,
            palette: Gradient::default().make_palette(),
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
    pub fn image_data(&self) -> *const u8 {
        self.pixels.as_ptr()
    }
}

#[derive(Debug)]
struct RangeRect<T> {
    x0: T,
    y0: T,
    w: T,
    h: T,
    len: T,
    step: T,
    i: T,
    exhausted: bool,
}

impl<T> RangeRect<T>
where
    T: Copy,
    T: Div<T, Output = T>,
    T: From<u8>,
    T: Mul<T, Output = T>,
    T: NextCoprime,
    T: Sub<T, Output = T>,
{
    fn new((x0, w): (T, T), (y0, h): (T, T)) -> RangeRect<T> {
        let len = w * h;
        RangeRect {
            x0,
            y0,
            w,
            h,
            len,
            step: (len / 100.into()).next_coprime(len),
            i: 0.into(),
            exhausted: false,
        }
    }
}

impl<T> RangeRect<T> {
    fn is_exhausted(&self) -> bool {
        self.exhausted
    }
}

impl<T> Iterator for RangeRect<T>
where
    T: Add<T, Output = T>,
    T: Copy,
    T: Div<T, Output = T>,
    T: Eq,
    T: From<u8>,
    T: Mul<T, Output = T>,
    T: Rem<T, Output = T>,
{
    type Item = (T, T);
    fn next(&mut self) -> Option<Self::Item> {
        if self.is_exhausted() || self.len == 0.into() {
            None
        } else {
            let y = self.y0 + self.i / self.w;
            let x = self.x0 + self.i % self.w;
            self.i = (self.i + self.step) % self.len;
            if self.i == 0.into() {
                self.exhausted = true;
            }
            Some((x, y))
        }
    }
}

#[wasm_bindgen]
#[derive(Clone, Copy)]
pub struct Point {
    pub x: f64,
    pub y: f64,
}

#[wasm_bindgen]
pub struct Viewpoint {
    pub center: Point,
    pub scale: f64,
}

#[wasm_bindgen]
impl Viewpoint {
    pub fn serialize(&self) -> String {
        let x = self.center.x.to_be_bytes();
        let y = self.center.y.to_be_bytes();
        let s = self.scale.to_be_bytes();

        format!(
            "{}.{}.{}",
            base64::encode(x),
            base64::encode(y),
            base64::encode(s)
        )
    }

    pub fn deserialize(s: &str) -> Option<Viewpoint> {
        use std::convert::TryInto;
        let parts: Result<Vec<Vec<u8>>, _> = s.split(".").map(|s| base64::decode(s)).collect();

        match parts {
            Ok(parts) if parts.len() == 3 => {
                let x: Result<[u8; 8], _> = parts[0].as_slice().try_into();
                let y: Result<[u8; 8], _> = parts[1].as_slice().try_into();
                let s: Result<[u8; 8], _> = parts[2].as_slice().try_into();
                match (x, y, s) {
                    (Ok(x), Ok(y), Ok(s)) => Some(Viewpoint {
                        center: Point {
                            x: f64::from_be_bytes(x),
                            y: f64::from_be_bytes(y),
                        },
                        scale: f64::from_be_bytes(s),
                    }),
                    _ => None,
                }
            }
            _ => None,
        }
    }
}

#[wasm_bindgen]
pub struct Engine {
    center: Complex<f64>,
    top_left: Complex<f64>,
    btm_right: Complex<f64>,
    scale: f64,
    iteration_limit: usize,
    gradient: Pristine<Gradient>,
    image: Image,
    dirty_regions: VecDeque<RangeRect<i32>>,
}

impl Default for Engine {
    fn default() -> Self {
        utils::set_panic_hook();

        let mut e = Self {
            scale: 4.0,
            center: Complex::from((0, 0)),
            top_left: Complex::from((0, 0)),
            btm_right: Complex::from((0, 0)),
            iteration_limit: 50,
            gradient: Default::default(),
            image: Image::new(1, 1),
            dirty_regions: VecDeque::new(),
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

    pub fn set_size(&mut self, width: usize, height: usize) -> Viewpoint {
        self.scale = self.scale * self.image.width as f64 / width as f64;
        self.image = Image::new(width, height);
        self.update_limits()
    }

    fn update_limits(&mut self) -> Viewpoint {
        let view_center: Complex<f64> = (
            self.image.width as f64 / 2.0 * self.scale,
            -(self.image.height as f64) / 2.0 * self.scale,
        )
            .into();
        self.top_left = self.center - view_center;
        self.btm_right = self.center + view_center;
        self.dirtify_all();
        Viewpoint {
            center: Point {
                x: self.center.re,
                y: self.center.im,
            },
            scale: self.scale,
        }
    }

    fn dirtify_all(&mut self) {
        self.dirty_regions.clear();
        self.dirty_regions.push_back(RangeRect::new(
            (0, self.image.width as i32),
            (0, self.image.height as i32),
        ));
    }

    pub fn set_viewpoint(&mut self, viewpoint: Viewpoint) -> Viewpoint {
        self.center = (viewpoint.center.x, viewpoint.center.y).into();
        self.scale = viewpoint.scale;
        self.update_limits()
    }

    pub fn pan(&mut self, dx: i32, dy: i32) -> Viewpoint {
        let dre = self.scale * dx as f64;
        let dim = self.scale * (-dy) as f64;
        self.center += (dre, dim).into();
        let viewpoint = self.update_limits();
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

        for region in &mut self.dirty_regions {
            region.x0 -= dx;
            region.y0 -= dy;
        }

        self.dirty_regions.push_back(RangeRect::new(
            (dirty_x_min, dirty_x_max),
            (0, self.image.height as i32),
        ));
        self.dirty_regions.push_back(RangeRect::new(
            if dx < 0 {
                (dirty_x_max, self.image.width as i32)
            } else {
                (0, dirty_x_min)
            },
            (dirty_y_min, dirty_y_max),
        ));

        viewpoint
    }

    pub fn zoom_in(&mut self) -> Viewpoint {
        self.scale /= 2.0;
        self.update_limits()
    }

    pub fn zoom_out(&mut self) -> Viewpoint {
        self.scale *= 2.0;
        self.update_limits()
    }

    pub fn zoom_in_around(&mut self, x: usize, y: usize) -> Viewpoint {
        self.zoom_around(self.scale / 2.0, x, y)
    }

    pub fn zoom_out_around(&mut self, x: usize, y: usize) -> Viewpoint {
        self.zoom_around(self.scale * 2.0, x, y)
    }

    fn zoom_around(&mut self, new_scale: f64, x: usize, y: usize) -> Viewpoint {
        let sdiff = new_scale - self.scale;
        self.center += (
            sdiff * (self.image.width as f64 / 2.0 - x as f64),
            sdiff * (y as f64 - self.image.height as f64 / 2.0),
        )
            .into();

        self.scale = new_scale;
        self.update_limits()
    }

    pub fn image_data(&self) -> *const u8 {
        self.image.image_data()
    }

    pub fn compute(&mut self, mut count: usize) {
        while let Some(dirty_region) = self.dirty_regions.front_mut() {
            let corner_diff = self.btm_right - self.top_left;
            let re_span = corner_diff.re;
            let im_span = corner_diff.im;

            for (x, y) in dirty_region {
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
                    let escape_count = mandelbrot::check(c, self.iteration_limit, 2.0);
                    self.image.escape_counts[i] = escape_count;

                    count -= 1;
                    if count == 0 {
                        return;
                    }
                }
            }

            self.dirty_regions.pop_front();
        }
    }

    pub fn render(&mut self) {
        if let Some(gradient) = self.gradient.get_dirty() {
            self.image.palette = gradient.make_palette();
        };
        self.image.render_pixels(self.iteration_limit);
    }

    pub fn set_iteration_limit(&mut self, iteration_limit: usize) -> usize {
        if iteration_limit > self.iteration_limit {
            self.dirtify_all();
        }
        self.iteration_limit = iteration_limit;
        self.iteration_limit
    }

    pub fn gradient_set_pivot_value(&mut self, index: usize, value: usize) -> Option<usize> {
        self.gradient.set_pivot_value(index, value)
    }

    pub fn gradient_set_pivot_color(&mut self, index: usize, color: &str) -> bool {
        if let Ok(color) = Color::parse_hex(color) {
            self.gradient.set_pivot_color(index, color)
        } else {
            false
        }
    }

    pub fn gradient_insert_pivot(&mut self, index: usize) -> GradientPivot {
        self.gradient.insert_pivot(index)
    }

    pub fn gradient_delete_pivot(&mut self, index: usize) {
        self.gradient.delete_pivot(index)
    }

    pub fn gradient_set_inside_color(&mut self, color: &str) -> bool {
        if let Ok(color) = Color::parse_hex(color) {
            self.gradient.set_inside_color(color);
            true
        } else {
            false
        }
    }
}
