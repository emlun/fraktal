use wasm_bindgen::prelude::wasm_bindgen;

#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct Complex {
    re: f64,
    im: f64,
}

impl Complex {
    pub fn as_tuple(&self) -> (f64, f64) {
        (self.re, self.im)
    }

    pub fn abs_squared(&self) -> f64 {
        self.re * self.re + self.im * self.im
    }
}

impl From<(f64, f64)> for Complex {
    fn from((re, im): (f64, f64)) -> Self {
        Complex { re, im }
    }
}

impl std::ops::Add for Complex {
    type Output = Self;
    fn add(self, rhs: Self) -> Self::Output {
        Complex {
            re: self.re + rhs.re,
            im: self.im + rhs.im,
        }
    }
}

impl std::ops::Mul for Complex {
    type Output = Self;
    fn mul(self, rhs: Self) -> Self::Output {
        Complex {
            re: self.re * rhs.re - self.im * rhs.im,
            im: self.re * rhs.im + self.im * rhs.re,
        }
    }
}

#[cfg(test)]
mod test_add {
    use super::Complex;

    #[test]
    fn zero() -> Result<(), ()> {
        let sum = Complex::from((0.0, 0.0)) + Complex::from((0.0, 0.0));
        assert_eq!(sum.as_tuple(), (0.0, 0.0));

        let sum = Complex::from((0.0, 0.0)) + Complex::from((1.0, 2.0));
        assert_eq!(sum.as_tuple(), (1.0, 2.0));

        Ok(())
    }
}
