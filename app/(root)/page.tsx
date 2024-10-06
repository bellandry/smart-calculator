"use client";

import { Button } from "@/components/ui/button";
import { SWATCHES } from "@/constants";
import axios from "axios";
import { useEffect, useRef, useState } from "react";

interface Response {
  expr: string;
  result: string;
  assign: boolean;
}

interface GeneralResult {
  expression: string;
  answer: string;
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("rgb(255, 255, 255)");
  const [reset, setReset] = useState(false);
  const [result, setResult] = useState<GeneralResult | null>(null);
  const [dictOfVars, setDictOfVars] = useState({});
  const [eraserSize, setEraserSize] = useState(10); // Ajout de l'état pour la taille de la gomme
  const [isErasing, setIsErasing] = useState(false); // Ajout de l'état pour savoir si on utilise la gomme

  useEffect(() => {
    if (reset) {
      resetCanvas();
      setReset(false);
    }
  }, [reset]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight - canvas.offsetTop;
        ctx.lineCap = "round";
        ctx.lineWidth = 3;
      }
    }
  }, []);

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.background = "black";
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.beginPath();
        if ("offsetX" in e.nativeEvent) {
          ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        } else {
          ctx.moveTo(
            e.nativeEvent.touches[0].clientX - canvas.offsetLeft,
            e.nativeEvent.touches[0].clientY - canvas.offsetTop
          );
        }
        setIsDrawing(true);
      }
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        if (isErasing) {
          // Vérifie si l'outil est la gomme
          if ("offsetX" in e.nativeEvent) {
            ctx.clearRect(
              e.nativeEvent.offsetX - eraserSize / 2,
              e.nativeEvent.offsetY - eraserSize / 2,
              eraserSize,
              eraserSize
            );
          } else {
            ctx.clearRect(
              e.nativeEvent.touches[0].clientX -
                canvas.offsetLeft -
                eraserSize / 2,
              e.nativeEvent.touches[0].clientY -
                canvas.offsetTop -
                eraserSize / 2,
              eraserSize,
              eraserSize
            );
          }
        } else {
          ctx.strokeStyle = color;
          if ("offsetX" in e.nativeEvent) {
            ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
          } else {
            ctx.lineTo(
              e.nativeEvent.touches[0].clientX - canvas.offsetLeft,
              e.nativeEvent.touches[0].clientY - canvas.offsetTop
            );
          }
          ctx.stroke();
        }
      }
    }
  };

  const resetCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  const sendData = async () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const response = await axios({
        method: "POST",
        url: `${process.env.NEXT_PUBLIC_API_URL}/calculate`,
        data: {
          image: canvas.toDataURL("image/png"),
          dict_of_vars: dictOfVars,
        },
      });

      const resp = await response.data;
      console.log(resp);
    }
  };

  const toggleEraser = () => {
    setIsErasing(!isErasing); // Fonction pour basculer entre le dessin et l'effacement
  };

  return (
    <>
      <div className="flex justify-between container mx-auto pt-4 px-2">
        <Button
          variant={"outline"}
          onClick={() => setReset(true)}
          className="z-50"
        >
          Reset
        </Button>
        <Button
          variant={"outline"}
          onClick={toggleEraser} // Appel de la fonction toggleEraser
          className="z-50"
        >
          {isErasing ? "Dessin" : "Gomme"}{" "}
          {/* Bouton pour activer/désactiver la gomme */}
        </Button>
        <input
          type="range"
          min="1"
          max="100"
          value={eraserSize}
          onChange={(e) => setEraserSize(Number(e.target.value))} // Contrôle de la taille de la gomme
          className="z-50"
        />
        <div className="z-50 absolute top-16 flex-col md:top-0 md:flex-row md:relative flex items-center justify-center gap-2 p-2 rounded-md bg-neutral-900">
          {SWATCHES.map((color) => {
            return (
              <div
                className={`h-6 w-6 bg-[${color}] rounded-full cursor-pointer`}
                key={color}
                onClick={() => setColor(color)}
              />
            );
          })}
        </div>
        <Button variant={"outline"} onClick={sendData} className="z-50">
          Calculer
        </Button>
      </div>
      <canvas
        ref={canvasRef}
        id="canvas"
        className="absolute top-0 left-0 w-full h-full"
        onMouseDown={startDrawing}
        onTouchStart={startDrawing}
        onMouseOut={stopDrawing}
        onMouseUp={stopDrawing}
        onTouchEnd={stopDrawing}
        onMouseMove={draw}
        onTouchMove={draw}
      />
    </>
  );
}
