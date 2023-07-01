use std::fmt::Debug;
use yew::UseStateHandle;

pub trait UpdateUseStateHandle<T>
where
    T: Sized,
{
    fn update<F>(&self, f: F)
    where
        F: Fn(T) -> T;
}

impl<T> UpdateUseStateHandle<T> for UseStateHandle<T>
where
    T: Sized,
    T: Clone,
    T: Debug,
{
    fn update<F>(&self, f: F)
    where
        F: Fn(T) -> T,
    {
        self.set(f(T::clone(self)));
    }
}
