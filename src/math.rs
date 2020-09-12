use std::ops::AddAssign;
use std::ops::Rem;

pub trait Gcd {
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_next_coprime() {
        let a: i16 = 12;
        let b = 2;
        let c = b.next_coprime(a);
        assert_eq!(c, 5);

        let a = 12;
        let b: u128 = 2;
        let c = b.next_coprime(a);
        assert_eq!(c, 5);
    }
}
