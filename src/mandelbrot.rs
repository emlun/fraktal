use super::complex::Complex;

pub fn check(c: Complex<f64>, iteration_limit: usize, escape_abs: f64) -> usize {
    let mut z = c;
    let mut i = 0;

    while i < iteration_limit {
        if z.abs() >= escape_abs {
            return i;
        }

        z = z.square() + c;
        i += 1;
    }

    iteration_limit
}
