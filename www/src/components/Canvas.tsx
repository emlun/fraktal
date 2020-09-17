import React, { useCallback, useEffect, useRef, useState } from 'react';

import { debug } from 'logging';

import { Engine, EngineSettings } from 'fraktal-wasm/fraktal';
import { memory } from 'fraktal-wasm/fraktal_bg.wasm';

import styles from './Canvas.module.css';


interface Props {
  readonly engine: Engine,
  readonly settings: EngineSettings,
  readonly updateSettings: (settings: EngineSettings) => void,
  readonly panTriggerThreshold?: number,
};

interface Pos {
  readonly x: number,
  readonly y: number,
}

function Canvas({
  engine,
  settings,
  updateSettings,
  panTriggerThreshold = 10,
}: Props) {

  const mousePos = useRef<Pos | null>(null);
  const scrollStartPos = useRef<Pos | null>(null);
  const [ctx, setContext] = useState<CanvasRenderingContext2D>();
  const [wrapper, setWrapper] = useState<HTMLElement | null>(null);
  const [canvas, setCanvas] = useState<HTMLCanvasElement>();
  const imageData = useRef(new ImageData(100, 100));

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
    [engine]
  );
  const getRenderOffset = getScrollOffset;

  const onMouseDown = useCallback(
    (event: MouseEvent) => {
      const pos = { x: event.offsetX, y: event.offsetY };
      scrollStartPos.current = pos;
      mousePos.current = pos;
    },
    [engine]
  );

  const onMouseMove = useCallback(
    (event: MouseEvent) => {
      if (scrollStartPos.current) {
        mousePos.current = { x: event.offsetX, y: event.offsetY };
      }
    },
    [engine, panTriggerThreshold]
  );

  const onMouseUp = useCallback(
    (event: MouseEvent) => {
      const scrollOffset = getScrollOffset();

      if (Math.sqrt(Math.pow(scrollOffset.x, 2) + Math.pow(scrollOffset.y, 2)) >= panTriggerThreshold) {
        const { x, y } = getRenderOffset();
        updateSettings(engine.pan(-x, -y));
      }

      scrollStartPos.current = null;
    },
    [engine, panTriggerThreshold]
  );

  const onWheel = useCallback(
    (event: WheelEvent) => {
      if (event.deltaY > 0) {
        if (event.shiftKey) {
          updateSettings(engine.zoom_out_around(event.clientX, event.clientY));
        } else {
          updateSettings(engine.zoom_out());
        }
      } else if (event.shiftKey) {
        updateSettings(engine.zoom_in_around(event.clientX, event.clientY));
      } else {
        updateSettings(engine.zoom_in());
      }
    },
    [engine]
  );

  const updateCanvas = (node: HTMLCanvasElement) => {
    if (node) {
      setCanvas(node);
      setContext(node.getContext('2d') || undefined);
    }
  };

  const updateWasmPointer = useCallback(
    () => {
      if (canvas) {
        const imd = new Uint8ClampedArray(
          memory.buffer,
          engine.image_data(),
          canvas.width * canvas.height * 4
        );
        imageData.current = new ImageData(imd, canvas.width);
      }
    },
    [canvas, engine]
  );

  const resizeCanvas = useCallback(
    () => {
      if (canvas) {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        updateSettings(engine.set_size(canvas.width, canvas.height));
        updateWasmPointer();
      }
    },
    [canvas, engine, updateWasmPointer]
  );
  useEffect(
    () => {
      if (canvas) {
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        return () => {
          window.removeEventListener('resize', resizeCanvas);
        };
      }
    },
    [canvas, engine, resizeCanvas]
  );

  useEffect(
    () => {
      if (canvas && ctx && imageData.current) {
        const drawPixels = () => {
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          if (imageData.current.data.length === 0) {
            updateWasmPointer();
          }

          const { x, y } = getRenderOffset();
          ctx.putImageData(imageData.current, x, y);
        };

        let stopRenderLoop: any;
        const renderLoop = () => {
          engine.compute(100000);
          engine.render();
          drawPixels();
          stopRenderLoop = window.requestAnimationFrame(renderLoop);
        };
        stopRenderLoop = window.requestAnimationFrame(renderLoop);

        return () => {
          if (stopRenderLoop) {
            window.cancelAnimationFrame(stopRenderLoop);
          }
        };
      }
    },
    [ctx, canvas, engine, imageData, updateWasmPointer]
  );

  useEffect(
    () => {
      if (wrapper) {
        wrapper.addEventListener('mousedown', onMouseDown, true);
        wrapper.addEventListener('mousemove', onMouseMove, true);
        wrapper.addEventListener('mouseup', onMouseUp, true);
        wrapper.addEventListener('wheel', onWheel, true);
        return () => {
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
