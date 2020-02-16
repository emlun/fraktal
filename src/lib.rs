use wasm_bindgen::prelude::wasm_bindgen;

pub mod complex;
pub mod mandelbrot;
mod math;
#[macro_use]
mod utils;

use complex::Complex;

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

        values.push(self.pivots.last().unwrap().1);

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
            }
            .make_palette(Color::of(0, 0, 0, 255)),
            escape_counts: vec![0; width * height],
            pixels: vec![0; width * height * 4],
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

#[wasm_bindgen]
pub struct FractalView {
    top_left: Complex<f64>,
    btm_right: Complex<f64>,
    image: Image,
    sweep_index: usize,
    sweep_step: usize,
    dirty_before_index: Option<usize>,
}

#[wasm_bindgen]
impl FractalView {
    pub fn new(width: usize, height: usize) -> FractalView {
        utils::set_panic_hook();

        FractalView {
            top_left: (-2, 2).into(),
            btm_right: (2, -2).into(),
            image: Image::new(width, height),
            sweep_index: 0,
            sweep_step: if width * height > 100 {
                math::increase_until_relprime(width * height / 100, width * height)
            } else {
                1
            },
            dirty_before_index: Some(0),
        }
    }

    pub fn image_data(&self) -> *const u8 {
        self.image.image_data()
    }

    pub fn compute(&mut self, count: usize) {
        if let Some(dirty_before_index) = self.dirty_before_index {
            for _ in 0..std::cmp::min(count, self.image.escape_counts.len()) {
                let x = self.sweep_index % self.image.width;
                let y = self.sweep_index / self.image.width;

                let corner_diff = self.btm_right.clone() - &self.top_left;
                let re_span = corner_diff.re;
                let im_span = corner_diff.im;

                let c_offset_re: f64 = (x as f64 * re_span / self.image.width as f64).into();
                let c_offset_im: f64 = (y as f64 * im_span / self.image.height as f64).into();
                let c_offset: Complex<f64> = (c_offset_re, c_offset_im).into();

                let c = self.top_left.clone() + c_offset;
                let escape_count = mandelbrot::check(c, 256, 2.0);
                self.image.escape_counts[self.sweep_index] = escape_count;

                self.sweep_index =
                    (self.sweep_index + self.sweep_step) % self.image.escape_counts.len();
                if self.sweep_index == dirty_before_index {
                    self.sweep_index = 0;
                    self.dirty_before_index = None;
                    break;
                }
            }
        }
    }

    pub fn render(&mut self) {
        self.image.render_pixels();
    }
}
