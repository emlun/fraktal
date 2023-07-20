use criterion::BenchmarkId;
use fraktal::presets::PRESETS;
use fraktal::Engine;
use fraktal::EngineSettings;

pub fn defaults(c: &mut criterion::Criterion) {
    let mut group = c.benchmark_group("Defaults");
    let defaults = EngineSettings::default();
    let default_w = defaults.get_width();
    let default_h = defaults.get_height();
    for size in [(default_w, default_h), (1920, 1080)] {
        group.bench_with_input(
            BenchmarkId::new("Compute", format!("{}x{}", size.0, size.1)),
            &size,
            |bencher, (width, height)| {
                let mut settings = EngineSettings::default().set_size(*width, *height);
                let mut engine = Engine::new(&settings);
                engine.apply_settings(&mut settings);
                bencher.iter(|| {
                    engine.reset();
                    engine.compute(usize::MAX)
                });
            },
        );
    }
}

pub fn presets(c: &mut criterion::Criterion) {
    let mut group = c.benchmark_group("Presets");
    for size in [(100, 100), (1920, 1080)] {
        for preset in &PRESETS {
            group.bench_with_input(
                BenchmarkId::new(preset.name, format!("{}x{}", size.0, size.1)),
                &size,
                |bencher, (width, height)| {
                    let mut settings = EngineSettings::restore(preset.state)
                        .unwrap()
                        .set_size(*width, *height);
                    let mut engine = Engine::new(&settings);
                    engine.apply_settings(&mut settings);
                    bencher.iter(|| {
                        engine.reset();
                        engine.compute(usize::MAX)
                    });
                },
            );
        }

        group.bench_with_input(
            BenchmarkId::new("All", format!("{}x{}", size.0, size.1)),
            &size,
            |bencher, (width, height)| {
                let mut engines: Vec<Engine> = PRESETS
                    .iter()
                    .map(|preset| {
                        let mut settings = EngineSettings::restore(preset.state)
                            .unwrap()
                            .set_size(*width, *height);
                        let mut engine = Engine::new(&settings);
                        engine.apply_settings(&mut settings);
                        engine
                    })
                    .collect();
                bencher.iter(|| {
                    engines
                        .iter_mut()
                        .map(|engine| {
                            engine.reset();
                            engine.compute(usize::MAX)
                        })
                        .sum::<usize>()
                });
            },
        );
    }
}

criterion::criterion_group! {
    name = bench_default;
    config = criterion::Criterion::default()
        .significance_level(0.01)
        .noise_threshold(0.05)
        .warm_up_time(::std::time::Duration::from_millis(100))
        .measurement_time(::std::time::Duration::from_millis(400));
    targets = defaults
}

criterion::criterion_group! {
    name = bench_presets;
    config = criterion::Criterion::default()
        .significance_level(0.01)
        .noise_threshold(0.05)
        .sample_size(20)
        .warm_up_time(::std::time::Duration::from_millis(1000))
        .measurement_time(::std::time::Duration::from_millis(2000));
    targets = presets
}
criterion::criterion_main!(bench_default, bench_presets);
