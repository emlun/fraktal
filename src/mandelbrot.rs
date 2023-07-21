use super::complex::Complex;

pub fn check(c: Complex<f64>, iteration_limit: usize, escape_abs_squared: f64) -> usize {
    let mut z = c;

    for i in 0..iteration_limit {
        let (abs, z2) = z.abs_squared_and_square();
        if abs >= escape_abs_squared {
            return i;
        }

        z = z2 + c;
    }

    iteration_limit
}
