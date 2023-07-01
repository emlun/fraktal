use std::convert::TryInto;
use std::ops::Add;
use std::ops::Div;
use std::ops::Mul;
use std::ops::Rem;
use std::ops::Sub;

#[derive(Debug)]
pub struct RangeRect<T> {
    x0: T,
    y0: T,
    w: T,
    len: T,
    i: T,
}

impl<T> RangeRect<T>
where
    T: Copy,
    T: Div<T, Output = T>,
    T: From<u8>,
    T: Mul<T, Output = T>,
    T: Sub<T, Output = T>,
{
    fn new((x0, w): (T, T), (y0, h): (T, T)) -> RangeRect<T> {
        let len = w * h;
        RangeRect {
            x0,
            y0,
            w,
            len,
            i: 0.into(),
        }
    }
}

impl<T> Iterator for RangeRect<T>
where
    T: Add<T, Output = T>,
    T: Copy,
    T: Div<T, Output = T>,
    T: Eq,
    T: From<u8>,
    T: Mul<T, Output = T>,
    T: Rem<T, Output = T>,
{
    type Item = (T, T);
    fn next(&mut self) -> Option<Self::Item> {
        if self.i == self.len {
            None
        } else {
            let y = self.y0 + self.i / self.w;
            let x = self.x0 + self.i % self.w;
            self.i = self.i + 1.into();
            Some((x, y))
        }
    }
}

#[derive(Debug, Eq, PartialEq)]
pub struct RectRegion {
    pub x0: i32,
    pub y0: i32,
    pub w: i32,
    pub h: i32,
}
impl RectRegion {
    pub fn new(x0: i32, y0: i32, w: i32, h: i32) -> Self {
        Self {
            x0,
            y0,
            w: std::cmp::max(0, w),
            h: std::cmp::max(0, h),
        }
    }

    pub fn squared_distance_to(&self, (x, y): (i32, i32)) -> i32 {
        if x >= self.x0 && x - self.x0 < self.w && y >= self.y0 && y - self.y0 < self.h {
            0
        } else {
            let dx = if x < self.x0 {
                self.x0 - x
            } else if x > self.x0 + self.w {
                x - self.x0 - self.w
            } else {
                0
            };
            let dy = if y < self.y0 {
                self.y0 - y
            } else if y >= self.y0 + self.h {
                y - self.y0 - self.h
            } else {
                0
            };
            dx * dx + dy * dy
        }
    }

    pub fn border(&self) -> RectRegionBorder {
        RectRegionBorder::new(self)
    }

    pub fn interior(&self) -> RangeRect<i32> {
        RangeRect::new(
            (self.x0 + 1, std::cmp::max(0, self.w - 2)),
            (self.y0 + 1, std::cmp::max(0, self.h - 2)),
        )
    }

    pub fn interior_len(&self) -> usize {
        (std::cmp::max(0, self.w - 2) * std::cmp::max(0, self.h - 2))
            .try_into()
            .unwrap()
    }

    pub fn trisect(&self) -> Option<(RectRegion, RectRegion, RectRegion)> {
        if self.interior_len() > 0 {
            Some(if self.w >= self.h {
                let w1 = (self.w - 2) / 3;
                let w2 = ((self.w - 2) - w1) / 2;
                let w3 = (self.w - 2) - w1 - w2;
                (
                    RectRegion::new(self.x0 + 1, self.y0 + 1, w1, self.h - 2),
                    RectRegion::new(self.x0 + 1 + w1, self.y0 + 1, w2, self.h - 2),
                    RectRegion::new(self.x0 + 1 + w1 + w2, self.y0 + 1, w3, self.h - 2),
                )
            } else {
                let h1 = (self.h - 2) / 3;
                let h2 = ((self.h - 2) - h1) / 2;
                let h3 = (self.h - 2) - h1 - h2;
                (
                    RectRegion::new(self.x0 + 1, self.y0 + 1, self.w - 2, h1),
                    RectRegion::new(self.x0 + 1, self.y0 + 1 + h1, self.w - 2, h2),
                    RectRegion::new(self.x0 + 1, self.y0 + 1 + h1 + h2, self.w - 2, h3),
                )
            })
        } else {
            None
        }
    }
}
pub struct RectRegionBorder<'parent> {
    parent: &'parent RectRegion,
    i: i32,
    maxi_w: i32,
    maxi_h: i32,
}
impl<'parent> RectRegionBorder<'parent> {
    fn new(parent: &'parent RectRegion) -> Self {
        Self {
            parent,
            i: 0,
            maxi_w: std::cmp::max(0, parent.w - 1),
            maxi_h: std::cmp::max(0, parent.h - 1),
        }
    }
}

impl<'parent> Iterator for RectRegionBorder<'parent> {
    type Item = (i32, i32);
    fn next(&mut self) -> Option<<Self as Iterator>::Item> {
        if self.parent.w == 0 || self.parent.h == 0 {
            None
        } else if self.parent.w == 1 {
            if self.i < self.parent.h {
                let i = self.i;
                self.i += 1;
                Some((self.parent.x0, self.parent.y0 + i))
            } else {
                None
            }
        } else if self.parent.h == 1 {
            if self.i < self.parent.w {
                let i = self.i;
                self.i += 1;
                Some((self.parent.x0 + i, self.parent.y0))
            } else {
                None
            }
        } else if self.i < self.maxi_w {
            let i = self.i;
            self.i += 1;
            Some((self.parent.x0 + i, self.parent.y0))
        } else if self.i < self.maxi_w + self.maxi_h {
            let i = self.i - self.maxi_w;
            self.i += 1;
            Some((self.parent.x0 + self.maxi_w, self.parent.y0 + i))
        } else if self.i < self.maxi_w + self.maxi_h + self.maxi_w {
            let i = self.i - self.maxi_w - self.maxi_h;
            self.i += 1;
            Some((
                self.parent.x0 + self.maxi_w - i,
                self.parent.y0 + self.maxi_h,
            ))
        } else if self.i < self.maxi_w + self.maxi_h + self.maxi_w + self.maxi_h {
            let i = self.i - self.maxi_w - self.maxi_h - self.maxi_w;
            self.i += 1;
            Some((self.parent.x0, self.parent.y0 + self.maxi_h - i))
        } else {
            None
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashSet;

    #[test]
    fn rect_region_empty() {
        for region in &[
            RectRegion::new(0, 0, 0, 0),
            RectRegion::new(0, 0, 0, 1),
            RectRegion::new(0, 0, 0, 1),
            RectRegion::new(0, 0, 1, 0),
            RectRegion::new(0, 0, 0, 10),
            RectRegion::new(0, 0, 10, 0),
        ] {
            assert_eq!(
                region.border().collect::<Vec<(i32, i32)>>(),
                vec![],
                "Failed for region: {:?}",
                region
            );
            assert_eq!(
                region.interior().collect::<Vec<(i32, i32)>>(),
                vec![],
                "Failed for region: {:?}",
                region
            );
        }
    }

    #[test]
    fn rect_region_single_point() {
        let region = RectRegion::new(0, 0, 1, 1);
        assert_eq!(region.border().collect::<Vec<(i32, i32)>>(), vec![(0, 0)]);
        assert_eq!(region.interior().collect::<Vec<(i32, i32)>>(), vec![],);
    }

    #[test]
    fn rect_region_border_tiny() {
        let region = RectRegion {
            x0: 0,
            y0: 0,
            w: 2,
            h: 2,
        };
        assert_eq!(
            region.border().collect::<Vec<(i32, i32)>>(),
            vec![(0, 0), (1, 0), (1, 1), (0, 1)]
        );
    }

    #[test]
    fn rect_region_border_thinnest_x() {
        let region = RectRegion {
            x0: 0,
            y0: 0,
            w: 1,
            h: 5,
        };
        assert_eq!(
            region.border().collect::<Vec<(i32, i32)>>(),
            vec![(0, 0), (0, 1), (0, 2), (0, 3), (0, 4),]
        );
    }

    #[test]
    fn rect_region_border_thin_x() {
        let region = RectRegion {
            x0: 0,
            y0: 0,
            w: 2,
            h: 5,
        };
        assert_eq!(
            region.border().collect::<Vec<(i32, i32)>>(),
            vec![
                (0, 0),
                (1, 0),
                (1, 1),
                (1, 2),
                (1, 3),
                (1, 4),
                (0, 4),
                (0, 3),
                (0, 2),
                (0, 1)
            ]
        );
    }

    #[test]
    fn rect_region_border_thinnest_y() {
        let region = RectRegion {
            x0: 0,
            y0: 0,
            w: 5,
            h: 1,
        };
        assert_eq!(
            region.border().collect::<Vec<(i32, i32)>>(),
            vec![(0, 0), (1, 0), (2, 0), (3, 0), (4, 0),]
        );
    }

    #[test]
    fn rect_region_border_thin_y() {
        let region = RectRegion {
            x0: 0,
            y0: 0,
            w: 5,
            h: 2,
        };
        assert_eq!(
            region.border().collect::<Vec<(i32, i32)>>(),
            vec![
                (0, 0),
                (1, 0),
                (2, 0),
                (3, 0),
                (4, 0),
                (4, 1),
                (3, 1),
                (2, 1),
                (1, 1),
                (0, 1)
            ]
        );
    }

    #[test]
    fn rect_region_border_simple_case() {
        let region = RectRegion {
            x0: 0,
            y0: 0,
            w: 3,
            h: 3,
        };
        assert_eq!(
            region.border().collect::<Vec<(i32, i32)>>(),
            vec![
                (0, 0),
                (1, 0),
                (2, 0),
                (2, 1),
                (2, 2),
                (1, 2),
                (0, 2),
                (0, 1),
            ]
        );
    }

    #[test]
    fn rect_region_border_length() {
        let region = RectRegion {
            x0: 0,
            y0: 0,
            w: 17,
            h: 23,
        };
        let expected_len = 16 * 2 + 22 * 2;
        assert_eq!(region.border().count(), expected_len);
        assert_eq!(
            region.border().collect::<HashSet<(i32, i32)>>().len(),
            expected_len
        );
    }

    #[test]
    fn rect_region_interior_tiny() {
        let region = RectRegion {
            x0: 0,
            y0: 0,
            w: 2,
            h: 2,
        };
        assert_eq!(region.interior().collect::<Vec<(i32, i32)>>(), vec![]);
    }

    #[test]
    fn rect_region_interior_thin_x() {
        let region = RectRegion {
            x0: 0,
            y0: 0,
            w: 2,
            h: 5,
        };
        assert_eq!(region.interior().collect::<Vec<(i32, i32)>>(), vec![]);
    }

    #[test]
    fn rect_region_interior_thin_y() {
        let region = RectRegion {
            x0: 0,
            y0: 0,
            w: 5,
            h: 2,
        };
        assert_eq!(region.interior().collect::<Vec<(i32, i32)>>(), vec![]);
    }

    #[test]
    fn rect_region_interior_simple_cases() {
        let region = RectRegion {
            x0: 0,
            y0: 0,
            w: 3,
            h: 3,
        };
        assert_eq!(region.interior().collect::<Vec<(i32, i32)>>(), vec![(1, 1)]);
        assert_eq!(region.interior_len(), 1);

        let region = RectRegion {
            x0: 0,
            y0: 0,
            w: 4,
            h: 4,
        };
        assert_eq!(
            region.interior().collect::<Vec<(i32, i32)>>(),
            vec![(1, 1), (2, 1), (1, 2), (2, 2),]
        );
        assert_eq!(region.interior_len(), 4);

        let region = RectRegion {
            x0: 0,
            y0: 0,
            w: 5,
            h: 5,
        };
        assert_eq!(
            region.interior().collect::<Vec<(i32, i32)>>(),
            vec![
                (1, 1),
                (2, 1),
                (3, 1),
                (1, 2),
                (2, 2),
                (3, 2),
                (1, 3),
                (2, 3),
                (3, 3),
            ]
        );
        assert_eq!(region.interior_len(), 9);
    }

    #[test]
    fn rect_region_interior_size() {
        let region = RectRegion {
            x0: 0,
            y0: 0,
            w: 17,
            h: 23,
        };
        let expected_len = 15 * 21;
        assert_eq!(region.interior().count(), expected_len);
        let points = region.interior().collect::<HashSet<(i32, i32)>>();
        assert_eq!(points.len(), expected_len);
        assert!(points.iter().all(|(x, y)| *x > region.x0
            && *y > region.y0
            && *x < region.x0 + region.w - 1
            && *y < region.y0 + region.h - 1));
        assert_eq!(region.interior_len(), expected_len);
    }

    #[test]
    fn rect_region_trisect() {
        for region in &[
            RectRegion {
                x0: 1000,
                y0: 100,
                w: 17,
                h: 23,
            },
            RectRegion {
                x0: 1000,
                y0: 100,
                w: 23,
                h: 17,
            },
        ] {
            let (r1, r2, r3) = region.trisect().unwrap();

            let r1_border = r1.border().collect::<HashSet<(i32, i32)>>();
            let r1_interior = r1.interior().collect::<HashSet<(i32, i32)>>();
            let r2_border = r2.border().collect::<HashSet<(i32, i32)>>();
            let r2_interior = r2.interior().collect::<HashSet<(i32, i32)>>();
            let r3_border = r3.border().collect::<HashSet<(i32, i32)>>();
            let r3_interior = r3.interior().collect::<HashSet<(i32, i32)>>();

            assert_eq!(
                r1_border
                    .union(&r1_interior)
                    .copied()
                    .collect::<HashSet<(i32, i32)>>()
                    .union(&r2_border)
                    .copied()
                    .collect::<HashSet<(i32, i32)>>()
                    .union(&r2_interior)
                    .copied()
                    .collect::<HashSet<(i32, i32)>>()
                    .union(&r3_border)
                    .copied()
                    .collect::<HashSet<(i32, i32)>>()
                    .union(&r3_interior)
                    .copied()
                    .collect::<HashSet<(i32, i32)>>(),
                region.interior().collect::<HashSet<(i32, i32)>>()
            );

            assert_eq!(0, r1_border.intersection(&r1_interior).count());
            assert_eq!(0, r1_border.intersection(&r2_border).count());
            assert_eq!(0, r1_border.intersection(&r2_interior).count());
            assert_eq!(0, r1_border.intersection(&r3_border).count());
            assert_eq!(0, r1_border.intersection(&r3_interior).count());

            assert_eq!(0, r1_interior.intersection(&r2_border).count());
            assert_eq!(0, r1_interior.intersection(&r2_interior).count());
            assert_eq!(0, r1_interior.intersection(&r3_border).count());
            assert_eq!(0, r1_interior.intersection(&r3_interior).count());

            assert_eq!(0, r2_border.intersection(&r2_interior).count());
            assert_eq!(0, r2_border.intersection(&r3_border).count());
            assert_eq!(0, r2_border.intersection(&r3_interior).count());

            assert_eq!(0, r2_interior.intersection(&r3_border).count());
            assert_eq!(0, r2_interior.intersection(&r3_interior).count());

            assert_eq!(0, r3_border.intersection(&r3_interior).count());
        }
    }
}
