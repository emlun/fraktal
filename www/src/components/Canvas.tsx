import React, { useCallback, useEffect, useRef, useState } from 'react';

import { debug } from 'logging';

import { Engine, EngineSettings } from 'fraktal-wasm/fraktal';
import { memory } from 'fraktal-wasm/fraktal_bg.wasm';

import styles from './Canvas.module.css';


interface Props {
  readonly settings: EngineSettings,
  readonly updateSettings: (settings: EngineSettings) => void,
  readonly panTriggerThreshold?: number,
};

interface Pos {
  readonly x: number,
  readonly y: number,
}

function Canvas({
  settings,
  updateSettings,
  panTriggerThreshold = 10,
}: Props) {

  const mousePos = useRef<Pos | null>(null);
  const scrollStartPos = useRef<Pos | null>(null);
  const [ctx, setContext] = useState<CanvasRenderingContext2D>();
  const [wrapper, setWrapper] = useState<HTMLElement | null>(null);
  const [canvas, setCanvas] = useState<HTMLCanvasElement>();
  const [engine, ] = useState<Engine>(() => Engine.new(settings));

  useEffect(
    () => {
      console.log('apply_settings', settings);
      engine.apply_settings(settings);
    },
    [settings],
  );

  const getScrollOffset = useCallback(
    () => {
      if (scrollStartPos.current && mousePos.current) {
        return {
          x: mousePos.current.x - scrollStartPos.current.x,
          y: mousePos.current.y - scrollStartPos.current.y,
        };
      } else {
        return { x: 0, y: 0 };
      }
    },
    []
  );
  const getRenderOffset = getScrollOffset;

  const onMouseDown = useCallback(
    (event: MouseEvent) => {
      const pos = { x: event.offsetX, y: event.offsetY };
      scrollStartPos.current = pos;
      mousePos.current = pos;
    },
    []
  );

  const onMouseMove = useCallback(
    (event: MouseEvent) => {
      if (scrollStartPos.current) {
        mousePos.current = { x: event.offsetX, y: event.offsetY };
      }
    },
    [panTriggerThreshold]
  );

  const onMouseUp = useCallback(
    (event: MouseEvent) => {
      const scrollOffset = getScrollOffset();

      if (Math.sqrt(Math.pow(scrollOffset.x, 2) + Math.pow(scrollOffset.y, 2)) >= panTriggerThreshold) {
        const { x, y } = getRenderOffset();
        updateSettings(settings.pan(-x, -y));
      }

      scrollStartPos.current = null;
    },
    [settings, panTriggerThreshold]
  );

  const onWheel = useCallback(
    (event: WheelEvent) => {
      if (event.deltaY > 0) {
        if (event.shiftKey) {
          updateSettings(settings.zoom_out());
        } else {
          updateSettings(settings.zoom_out_around(event.clientX, event.clientY));
        }
      } else if (event.shiftKey) {
        updateSettings(settings.zoom_in());
      } else {
        updateSettings(settings.zoom_in_around(event.clientX, event.clientY));
      }
    },
    [settings]
  );

  const onDoubleClick = useCallback(
    (event: MouseEvent) => {
      updateSettings(settings.zoom_in_around(event.clientX, event.clientY));
    },
    [settings]
  );

  const updateCanvas = (node: HTMLCanvasElement) => {
    if (node) {
      setCanvas(node);
      setContext(node.getContext('2d') || undefined);
    }
  };

  useEffect(
    () => {
      console.log('useEffect resizeCanvas', canvas);
      if (canvas) {
        const resizeCanvas = () => {
          console.log('resizeCanvas', canvas, canvas?.offsetWidth, canvas?.offsetHeight);
          if (canvas) {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            if (!(canvas.width === settings.get_width()
               && canvas.height === settings.get_height())) {
              updateSettings(settings.set_size(canvas.width, canvas.height));
            }
          }
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
        return () => {
          window.removeEventListener('resize', resizeCanvas);
        };
      }
    },
    [canvas, settings]
  );

  useEffect(
    () => {
      console.log('useEffect render', ctx, canvas, engine, settings);

      let w, h;
      try {
        w = settings.get_width();
      } catch (e) {
      }
      try {
        h = settings.get_height();
      } catch (e) {
      }

      console.log('w h', canvas?.width, canvas?.height, w, h);

      if (canvas && ctx && engine && canvas.width === w && canvas.height === h) {
        console.log('useEffect render proceed');

        const imd = new Uint8ClampedArray(
          memory.buffer,
          engine.image_data(),
          canvas.width * canvas.height * 4
        );
        const imageData = new ImageData(imd, canvas.width);

        const drawPixels = () => {
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          const { x, y } = getRenderOffset();
          ctx.putImageData(imageData, x, y);
        };

        let computeLimit = 100000;
        let stopRenderLoop: any;
        const renderLoop = () => {
          const t0 = performance.now();
          const computed = engine.compute(computeLimit);
          const dt = performance.now() - t0;
          if (dt > 1000/60) {
            computeLimit /= 1.5;
          } else if (dt < 1000/100 && computed >= computeLimit) {
            computeLimit *= 1.5;
          }

          try {
            settings.throw_if_null();
            engine.render(settings);
            drawPixels();
            stopRenderLoop = window.requestAnimationFrame(renderLoop);
          } catch (_) {
          }
        };
        stopRenderLoop = window.requestAnimationFrame(renderLoop);

        return () => {
          if (stopRenderLoop) {
            window.cancelAnimationFrame(stopRenderLoop);
          }
        };
      }
    },
    [ctx, canvas, engine, settings]
  );

  useEffect(
    () => {
      if (wrapper) {
        wrapper.addEventListener('dblclick', onDoubleClick, true);
        wrapper.addEventListener('mousedown', onMouseDown, true);
        wrapper.addEventListener('mousemove', onMouseMove, true);
        wrapper.addEventListener('mouseup', onMouseUp, true);
        wrapper.addEventListener('wheel', onWheel, true);
        return () => {
          wrapper.removeEventListener('dblclick', onDoubleClick, true);
          wrapper.removeEventListener('mousedown', onMouseDown, true);
          wrapper.removeEventListener('mousemove', onMouseMove, true);
          wrapper.removeEventListener('mouseup', onMouseUp, true);
          wrapper.removeEventListener('wheel', onWheel, true);
        };
      }
    },
    [wrapper, onMouseDown, onMouseMove, onMouseUp, onWheel]
  );

  return <div
    ref={ setWrapper }
    className={ styles['Canvas-Container'] }
  >
    <canvas
      ref={ updateCanvas }
      className={ styles['main-canvas'] }
    />
  </div>;
}

export default Canvas;
