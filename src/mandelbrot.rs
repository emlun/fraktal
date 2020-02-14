use wasm_bindgen::prelude::wasm_bindgen;

use super::complex::Complex;

#[wasm_bindgen]
pub fn check(c_re: f64, c_im: f64, iteration_limit: u16, escape_abs: f64) -> Option<u16> {
    let escape_abs_squared = escape_abs * escape_abs;
    let c: Complex<f64> = (c_re, c_im).into();
    let mut z = c.clone();
    let mut i = 0;

    while i < iteration_limit {
        if z.abs_squared() >= escape_abs_squared {
            return Some(i);
        }

        z = z.clone() * z + c.clone();
        i += 1;
    }

    None
}
