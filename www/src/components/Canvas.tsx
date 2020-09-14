import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as ReactRedux from 'react-redux';

import { debug } from 'logging';

import { Engine } from 'fraktal-wasm/fraktal';
import { memory } from 'fraktal-wasm/fraktal_bg';

import styles from './Canvas.module.css';


interface Props {
  engine: Engine,

  readonly panTriggerThreshold?: number,
};

interface Pos {
  readonly x: number,
  readonly y: number,
}

function Canvas({
  engine,
  panTriggerThreshold = 10,
}: Props) {

  const mousePos = useRef<Pos | null>(null);
  const scrollStartPos = useRef<Pos | null>(null);
  const [ctx, setContext] = useState<CanvasRenderingContext2D>();
  const [canvas, setCanvas] = useState<HTMLCanvasElement>();
  const imageData = useRef<ImageData>();

  const getScrollOffset = () => {
    if (scrollStartPos.current && mousePos.current) {
      return {
        x: mousePos.current.x - scrollStartPos.current.x,
        y: mousePos.current.y - scrollStartPos.current.y,
      };
    } else {
      return { x: 0, y: 0 };
    }
  };
  const getRenderOffset = () => getScrollOffset();

  const onMouseDown = (event: MouseEvent) => {
    const pos = { x: event.offsetX, y: event.offsetY };
    scrollStartPos.current = pos;
    mousePos.current = pos;
  };

  const onMouseMove = (event: MouseEvent) => {
    if (scrollStartPos.current) {
      mousePos.current = { x: event.offsetX, y: event.offsetY };
    }
  };

  const onMouseUp = (event: MouseEvent) => {
    const scrollOffset = getScrollOffset();

    if (Math.sqrt(Math.pow(scrollOffset.x, 2) + Math.pow(scrollOffset.y, 2)) >= panTriggerThreshold) {
      const { x, y } = getRenderOffset();
      engine.pan(-x, -y);
    }

    scrollStartPos.current = null;
  }

  const onWheel = (event: MouseScrollEvent) => {
    if (event.deltaY > 0) {
      if (event.shiftKey) {
        engine.zoom_out_around(event.clientX, event.clientY);
      } else {
        engine.zoom_out();
      }
    } else if (event.shiftKey) {
      engine.zoom_in_around(event.clientX, event.clientY);
    } else {
      engine.zoom_in();
    }
  };

  const updateCanvas = useCallback(
    (node) => {
      if (node) {
        setCanvas(node);
        setContext(node.getContext('2d'));
      }
    },
    []
  );

  const updateWasmPointer = () => {
    if (canvas) {
      const imd = new Uint8ClampedArray(
        memory.buffer,
        engine.image_data(),
        canvas.width * canvas.height * 4
      );
      imageData.current = new ImageData(imd, canvas.width);
    }
  };

  const resizeCanvas = () => {
    if (canvas) {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      engine.set_size(canvas.width, canvas.height);
      updateWasmPointer();
    }
  };
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
    [canvas]
  );

  const updateWrapper = useCallback(
    (node) => {
      if (node) {
        node.addEventListener('mousedown', onMouseDown, true);
        node.addEventListener('mousemove', onMouseMove, true);
        node.addEventListener('mouseup', onMouseUp, true);
        node.addEventListener('wheel', onWheel, true);
      }
    },
    []
  );

  useEffect(
    () => {
      if (canvas) {
        const drawPixels = () => {
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          if (imageData.current.data.length === 0) {
            updateWasmPointer();
          }

          const { x, y } = getRenderOffset();
          ctx.putImageData(imageData.current, x, y);
        };

        const renderLoop = () => {
          engine.compute(100000);
          engine.render();
          drawPixels();
          window.requestAnimationFrame(renderLoop);
        };
        const stopRenderLoop = window.requestAnimationFrame(renderLoop);

        return () => {
          window.cancelAnimationFrame(stopRenderLoop);
        };
      }
    },
    [ctx, canvas, imageData]
  );

  return <div
    ref={ updateWrapper }
    className={ styles['Canvas-Container'] }
  >
    <canvas
      ref={ updateCanvas }
      className={ styles['main-canvas'] }
    />
  </div>;
}

export default Canvas;
