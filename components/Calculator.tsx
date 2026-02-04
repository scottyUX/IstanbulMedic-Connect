"use client";

import { useState } from "react";

interface CalculatorProps {
  initialValue?: number;
}

const Calculator = ({ initialValue = 0 }: CalculatorProps) => {
  const [display, setDisplay] = useState(initialValue.toString());
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);

  const handleNumber = (num: string) => {
    if (display === "0") {
      setDisplay(num);
    } else {
      setDisplay(display + num);
    }
  };

  const handleOperation = (op: string) => {
    if (previousValue === null) {
      setPreviousValue(parseFloat(display));
      setDisplay("0");
      setOperation(op);
    } else {
      calculate();
      setOperation(op);
    }
  };

  const calculate = () => {
    if (previousValue === null || operation === null) return;

    const current = parseFloat(display);
    let result = 0;

    switch (operation) {
      case "+":
        result = previousValue + current;
        break;
      case "-":
        result = previousValue - current;
        break;
      case "*":
        result = previousValue * current;
        break;
      case "/":
        result = current !== 0 ? previousValue / current : 0;
        break;
      default:
        return;
    }

    setDisplay(result.toString());
    setPreviousValue(null);
    setOperation(null);
  };

  const clear = () => {
    setDisplay("0");
    setPreviousValue(null);
    setOperation(null);
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-md">
      <div className="mb-4">
        <div className="rounded bg-gray-100 p-3 text-right text-2xl font-mono">
          {display}
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        <button
          onClick={clear}
          className="col-span-2 rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
        >
          Clear
        </button>
        <button
          onClick={() => handleOperation("/")}
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          ÷
        </button>
        <button
          onClick={() => handleOperation("*")}
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          ×
        </button>
        {[7, 8, 9, "-", 4, 5, 6, "+", 1, 2, 3, "="].map((item) => (
          <button
            key={item}
            onClick={() => {
              if (typeof item === "number") {
                handleNumber(item.toString());
              } else if (item === "=") {
                calculate();
              } else {
                handleOperation(item);
              }
            }}
            className={`rounded px-4 py-2 ${
              item === "="
                ? "bg-green-500 text-white hover:bg-green-600"
                : typeof item === "number"
                  ? "bg-gray-200 hover:bg-gray-300"
                  : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
          >
            {item}
          </button>
        ))}
        <button
          onClick={() => handleNumber("0")}
          className="col-span-2 rounded bg-gray-200 px-4 py-2 hover:bg-gray-300"
        >
          0
        </button>
        <button
          onClick={() => setDisplay(display + ".")}
          className="rounded bg-gray-200 px-4 py-2 hover:bg-gray-300"
        >
          .
        </button>
      </div>
    </div>
  );
};

export default Calculator;
