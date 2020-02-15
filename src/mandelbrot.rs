use super::complex::Complex;

pub fn check(c: Complex<f64>, iteration_limit: usize, escape_abs: f64) -> Option<usize> {
    let escape_abs_squared = escape_abs * escape_abs;
    let mut z = c.clone();
    let mut i = 0;

    while i < iteration_limit {
        if z.abs_squared() >= escape_abs_squared {
            return Some(i);
        }

        z = z.square() + &c;
        i += 1;
    }

    None
}
