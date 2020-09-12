pub mod complex;
pub mod mandelbrot;
mod math;
#[macro_use]
mod utils;

use complex::Complex;
use math::NextCoprime;
use std::collections::VecDeque;
use std::ops::Add;
use std::ops::Div;
use std::ops::Mul;
use std::ops::Range;
use std::ops::Rem;
use std::ops::Sub;
use wasm_bindgen::prelude::wasm_bindgen;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[derive(Clone, Copy, Debug)]
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
}

pub struct Gradient {
    root: Color,
    pivots: Vec<(usize, Color)>,
    max_value: usize,
}

impl Gradient {
    fn make_palette(&self, inside_color: Color) -> Palette {
        let mut values: Vec<Color> = Vec::with_capacity(self.pivots.last().unwrap().0 + 1);
        values.push(self.root);
        let mut prev_i = 0;
        let mut prev_color = &self.root;

        for (escape_count, color) in &self.pivots {
            let r_diff: u32 = (color.r - prev_color.r) as u32;
            let g_diff: u32 = (color.g - prev_color.g) as u32;
            let b_diff: u32 = (color.b - prev_color.b) as u32;
            let a_diff: u32 = (color.a - prev_color.a) as u32;
            let i_diff: u32 = (escape_count - prev_i) as u32;

            for i in prev_i..*escape_count {
                let di = i - prev_i;
                values.push(Color::of(
                    prev_color.r + (r_diff * di as u32 / i_diff) as u8,
                    prev_color.g + (g_diff * di as u32 / i_diff) as u8,
                    prev_color.b + (b_diff * di as u32 / i_diff) as u8,
                    prev_color.a + (a_diff * di as u32 / i_diff) as u8,
                ));
            }

            prev_i = *escape_count;
            prev_color = color;
        }

        while values.len() <= self.max_value {
            values.push(self.pivots.last().unwrap().1);
        }

        Palette {
            escape_values: values,
            inside_color,
        }
    }
}

pub struct Palette {
    escape_values: Vec<Color>,
    inside_color: Color,
}

impl Palette {
    fn get_color<'slf, 'ret>(&'slf self, escape_count: usize) -> &'ret Color
    where
        'slf: 'ret,
    {
        let len = self.escape_values.len();
        if escape_count >= len {
            &self.inside_color
        } else {
            &self.escape_values[escape_count]
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
            palette: Gradient {
                root: Color::of(0, 0, 0, 255),
                pivots: vec![(50, Color::of(255, 0, 255, 255))],
                max_value: 50,
            }
            .make_palette(Color::of(0, 0, 0, 255)),
            escape_counts: vec![0; width * height],
            pixels: vec![0; width * height * 4],
        }
    }

    pub fn pan(&mut self, dx: i32, dy: i32) {
        let di: usize =
            (dx + (dy * self.width as i32)).rem_euclid(self.escape_counts.len() as i32) as usize;

        let v: Vec<usize> = self.escape_counts.clone();
        let l = self.escape_counts.len();
        for i in 0..self.escape_counts.len() {
            self.escape_counts[(i + di) % l] = v[i];
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

    pub fn render_pixels(&mut self) {
        for i in 0..self.escape_counts.len() {
            let pixel_index = i * 4;
            let color = self.palette.get_color(self.escape_counts[i]);
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
    xs: Range<T>,
    ys: Range<T>,
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
    fn new(xs: Range<T>, ys: Range<T>) -> RangeRect<T> {
        let x0 = xs.start;
        let y0 = ys.start;
        let w = xs.end - x0;
        let h = ys.end - y0;
        let len = w * h;
        RangeRect {
            x0,
            y0,
            w,
            h,
            len,
            step: (len / 100.into()).next_coprime(len),
            xs,
            ys,
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
pub struct Engine {
    center: Complex<f64>,
    top_left: Complex<f64>,
    btm_right: Complex<f64>,
    scale: f64,
    image: Image,
    dirty_regions: VecDeque<RangeRect<i32>>,
}

#[wasm_bindgen]
impl Engine {
    pub fn new() -> Engine {
        utils::set_panic_hook();

        let mut e = Engine {
            scale: 4.0,
            center: Complex::from((0, 0)),
            top_left: Complex::from((0, 0)),
            btm_right: Complex::from((0, 0)),
            image: Image::new(1, 1),
            dirty_regions: VecDeque::new(),
        };
        e.set_size(1, 1);
        e
    }

    pub fn set_size(&mut self, width: usize, height: usize) {
        self.scale = self.scale * self.image.width as f64 / width as f64;
        self.image = Image::new(width, height);
        self.update_limits();
        self.dirtify_all();
    }

    fn update_limits(&mut self) {
        let view_center: Complex<f64> = (
            self.image.width as f64 / 2.0 * self.scale,
            -(self.image.height as f64) / 2.0 * self.scale,
        )
            .into();
        self.top_left = self.center - view_center;
        self.btm_right = self.center + view_center;
    }

    fn dirtify_all(&mut self) {
        self.dirty_regions.clear();
        self.dirty_regions.push_back(RangeRect::new(
            0..(self.image.width as i32),
            0..(self.image.height as i32),
        ));
    }

    pub fn pan(&mut self, dx: i32, dy: i32) {
        let dre = self.scale * dx as f64;
        let dim = self.scale * (-dy) as f64;
        self.center += (dre, dim).into();
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

        for region in &mut self.dirty_regions {
            region.x0 -= dx;
            region.y0 -= dy;
        }

        self.dirty_regions.push_back(RangeRect::new(
            dirty_x_min..dirty_x_max,
            0..(self.image.height as i32),
        ));
        self.dirty_regions.push_back(RangeRect::new(
            if dx < 0 {
                dirty_x_max..(self.image.width as i32)
            } else {
                0..dirty_x_min
            },
            dirty_y_min..dirty_y_max,
        ));
    }

    pub fn zoom_in(&mut self) {
        self.scale /= 2.0;
        self.update_limits();
        self.dirtify_all();
    }

    pub fn zoom_out(&mut self) {
        self.scale *= 2.0;
        self.update_limits();
        self.dirtify_all();
    }

    pub fn zoom_in_around(&mut self, x: usize, y: usize) {
        self.zoom_around(self.scale / 2.0, x, y);
    }

    pub fn zoom_out_around(&mut self, x: usize, y: usize) {
        self.zoom_around(self.scale * 2.0, x, y);
    }

    fn zoom_around(&mut self, new_scale: f64, x: usize, y: usize) {
        let sdiff = new_scale - self.scale;
        self.center += (
            sdiff * (self.image.width as f64 / 2.0 - x as f64),
            sdiff * (y as f64 - self.image.height as f64 / 2.0),
        )
            .into();

        self.scale = new_scale;
        self.update_limits();
        self.dirtify_all();
    }

    pub fn image_data(&self) -> *const u8 {
        self.image.image_data()
    }

    pub fn compute(&mut self, mut count: usize) {
        while let Some(dirty_region) = self.dirty_regions.front_mut() {
            let corner_diff = self.btm_right.clone() - &self.top_left;
            let re_span = corner_diff.re;
            let im_span = corner_diff.im;

            while let Some((x, y)) = dirty_region.next() {
                if x >= 0
                    && x < (self.image.width as i32)
                    && y >= 0
                    && y < (self.image.height as i32)
                {
                    let i = x as usize + y as usize * self.image.width;

                    let c_offset_re: f64 = (x as f64 * re_span / self.image.width as f64).into();
                    let c_offset_im: f64 = (y as f64 * im_span / self.image.height as f64).into();
                    let c_offset: Complex<f64> = (c_offset_re, c_offset_im).into();

                    let c = self.top_left.clone() + c_offset;
                    let escape_count =
                        mandelbrot::check(c, self.image.palette.escape_values.len(), 2.0);
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
        self.image.render_pixels();
    }
}
