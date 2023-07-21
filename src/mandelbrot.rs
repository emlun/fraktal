use super::complex::Complex;

pub fn check(c: Complex<f64>, iteration_limit: usize, escape_abs_squared: f64) -> usize {
    let mut z = c;
    let mut i = 0;

    while i < iteration_limit {
        if z.abs_squared() >= escape_abs_squared {
            return i;
        }

        z = z.square() + c;
        i += 1;
    }

    iteration_limit
}
