use std::fmt::Display;
use std::ops::Add;
use std::ops::Mul;
use std::ops::Sub;

#[derive(Clone)]
pub struct Complex<Num> {
    pub re: Num,
    pub im: Num,
}

impl<Num> Display for Complex<Num>
where
    Num: Display,
{
    fn fmt(&self, f: &mut std::fmt::Formatter) -> Result<(), std::fmt::Error> {
        write!(f, "{}+{}i", self.re, self.im)
    }
}

impl<Num> Complex<Num> {
    pub fn as_tuple(&self) -> (&Num, &Num) {
        (&self.re, &self.im)
    }
}

impl<'a, Num> Complex<Num>
where
    &'a Num: Mul<&'a Num, Output = Num>,
    Num: Add<Output = Num>,
    Num: 'a,
{
    pub fn abs_squared(&'a self) -> Num {
        let a = &self.re * &self.re;
        let b = &self.im * &self.im;
        a + b
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

impl<Num> Mul for Complex<Num>
where
    Num: Add<Output = Num>,
    Num: Sub<Output = Num>,
    Num: Mul<Output = Num>,
    Num: Clone,
{
    type Output = Self;
    fn mul(self, rhs: Self) -> Self::Output {
        Complex {
            re: self.re.clone() * rhs.re.clone() - self.im.clone() * rhs.im.clone(),
            im: self.re * rhs.im + self.im * rhs.re,
        }
    }
}

#[cfg(test)]
mod test_add {
    use super::Complex;

    #[test]
    fn zero() -> Result<(), ()> {
        let sum = Complex::<f64>::from((0, 0)) + (0, 0).into();
        assert_eq!(sum.as_tuple(), (&0.0, &0.0));

        let sum = Complex::<i64>::from((0, 0)) + (1, 2).into();
        assert_eq!(sum.as_tuple(), (&1, &2));

        Ok(())
    }
}
