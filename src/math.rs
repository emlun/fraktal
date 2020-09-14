use std::ops::AddAssign;
use std::ops::Rem;

pub trait Gcd {
    /// Return the greatest common divisor of `self` and `other`.
    ///
    /// # Examples
    ///
    /// ```
    /// use fraktal::math::Gcd;
    ///
    /// let a: i16 = 12;
    /// let b = 8;
    /// assert_eq!(a.gcd(b), 4);
    /// assert_eq!(b.gcd(a), 4);
    ///
    /// let a = 12;
    /// let b: u128 = 5;
    /// assert_eq!(a.gcd(b), 1);
    /// assert_eq!(b.gcd(a), 1);
    /// ```
    fn gcd(self, other: Self) -> Self;
}

impl<Num> Gcd for Num
where
    Num: Eq,
    Num: From<u8>,
    Num: Copy,
    Num: Eq,
    Num: Rem<Output = Num>,
{
    fn gcd(self, other: Self) -> Self {
        if other == 0.into() {
            self
        } else {
            other.gcd(self % other)
        }
    }
}

pub trait NextCoprime {
    /// Return the smallest `N` such that `N >= self` and `N` is coprime to `other`.
    ///
    /// # Examples
    ///
    /// ```
    /// use fraktal::math::NextCoprime;
    ///
    /// let a: i16 = 12;
    /// let b = 2;
    /// assert_eq!(a.next_coprime(b), 13);
    /// assert_eq!(b.next_coprime(a), 5);
    ///
    /// let a = 12;
    /// let b: u128 = 5;
    /// assert_eq!(a.next_coprime(b), 12);
    /// assert_eq!(b.next_coprime(a), 5);
    /// ```
    fn next_coprime(self, other: Self) -> Self;
}
impl<Num> NextCoprime for Num
where
    Num: Copy,
    Num: Gcd,
    Num: PartialOrd<Num>,
    Num: AddAssign<Num>,
    Num: From<u8>,
{
    fn next_coprime(mut self, dividee: Self) -> Self {
        while dividee.gcd(self) > 1.into() {
            self += 1.into();
        }
        self
    }
}
