use serde::Deserialize;
use serde::Serialize;
use std::fmt::Display;
use std::ops::Add;
use std::ops::AddAssign;
use std::ops::Mul;
use std::ops::Sub;

#[derive(Copy, Clone, Debug, Deserialize, Serialize)]
pub struct Complex<Num> {
    pub re: Num,
    pub im: Num,
}

impl<Num> PartialEq for Complex<Num>
where
    Num: PartialEq,
{
    fn eq(&self, rhs: &Self) -> bool {
        self.re == rhs.re && self.im == rhs.im
    }
}

impl<Num> Display for Complex<Num>
where
    Num: Display,
{
    fn fmt(&self, f: &mut std::fmt::Formatter) -> Result<(), std::fmt::Error> {
        write!(f, "{}+{}i", self.re, self.im)
    }
}

impl<'a, Num> Complex<Num>
where
    Num: Add<Output = Num>,
    Num: Sub<Output = Num>,
    Num: Mul<Output = Num>,
    Num: Copy,
    Num: From<u8>,
{
    pub fn abs_squared_and_square(&'a self) -> (Num, Self) {
        let rere = self.re * self.re;
        let imim = self.im * self.im;
        (
            rere + imim,
            Complex {
                re: rere - imim,
                im: Num::from(2) * self.re * self.im,
            },
        )
    }
}

impl<A, B, Num> From<(A, B)> for Complex<Num>
where
    A: Into<Num>,
    B: Into<Num>,
{
    fn from((re, im): (A, B)) -> Self {
        Complex {
            re: re.into(),
            im: im.into(),
        }
    }
}

impl<Num> Add for Complex<Num>
where
    Num: Add<Output = Num>,
{
    type Output = Self;
    fn add(self, rhs: Self) -> Self::Output {
        Complex {
            re: self.re + rhs.re,
            im: self.im + rhs.im,
        }
    }
}

impl<'a, Num> Add<&'a Self> for Complex<Num>
where
    Num: Add<&'a Num, Output = Num>,
{
    type Output = Self;
    fn add(self, rhs: &'a Self) -> Self::Output {
        Complex {
            re: self.re + &rhs.re,
            im: self.im + &rhs.im,
        }
    }
}

impl<Num> AddAssign for Complex<Num>
where
    Num: AddAssign,
{
    fn add_assign(&mut self, rhs: Self) {
        self.re += rhs.re;
        self.im += rhs.im;
    }
}

impl<Num> Sub for Complex<Num>
where
    Num: Sub<Output = Num>,
{
    type Output = Self;
    fn sub(self, rhs: Self) -> Self::Output {
        Complex {
            re: self.re - rhs.re,
            im: self.im - rhs.im,
        }
    }
}

impl<'a, Num> Sub<&'a Self> for Complex<Num>
where
    Num: Sub<&'a Num, Output = Num>,
{
    type Output = Self;
    fn sub(self, rhs: &'a Self) -> Self::Output {
        Complex {
            re: self.re - &rhs.re,
            im: self.im - &rhs.im,
        }
    }
}

impl<Num> Mul for Complex<Num>
where
    Num: Add<Output = Num>,
    Num: Sub<Output = Num>,
    Num: Mul<Output = Num>,
    Num: Copy,
{
    type Output = Self;
    fn mul(self, rhs: Self) -> Self::Output {
        Complex {
            re: self.re * rhs.re - self.im * rhs.im,
            im: self.re * rhs.im + self.im * rhs.re,
        }
    }
}

impl<'a, Num> Mul<&'a Self> for Complex<Num>
where
    Num: Add<Output = Num>,
    Num: Sub<Output = Num>,
    Num: Mul<&'a Num, Output = Num>,
    Num: Copy,
{
    type Output = Self;
    fn mul(self, rhs: &'a Self) -> Self::Output {
        Complex {
            re: self.re * &rhs.re - self.im * &rhs.im,
            im: self.re * &rhs.im + self.im * &rhs.re,
        }
    }
}

impl<Num> Mul<Num> for Complex<Num>
where
    Num: Mul<Output = Num>,
    Num: Copy,
{
    type Output = Self;
    fn mul(self, rhs: Num) -> Self::Output {
        Complex {
            re: self.re * rhs,
            im: self.im * rhs,
        }
    }
}

#[cfg(test)]
mod test_add {
    use super::Complex;

    #[test]
    fn zero() -> Result<(), ()> {
        let sum = Complex::<f64>::from((0, 0)) + Complex::<f64>::from((0, 0));
        assert_eq!(sum, Complex::from((0, 0)));

        let sum = Complex::<i32>::from((0, 0)) + Complex::<i32>::from((1, 2));
        assert_eq!(sum, Complex::from((1, 2)));

        Ok(())
    }
}
