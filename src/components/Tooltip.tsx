import React, { useState, useEffect } from "react";

export default function Tooltip({
  message,
  color = "green-900",
  children,
}: any) {
  const [visible, setVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<number | undefined>(undefined);

  const clearVisibilityTimeout = () => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  };

  const handleMouseEnter = () => {
    clearVisibilityTimeout();
    const id = setTimeout(() => {
      setVisible(true);
    }, 200) as unknown as number; // Use type assertion here
    setTimeoutId(id);
  };

  const handleMouseLeave = () => {
    clearVisibilityTimeout();
    const id = setTimeout(() => {
      setVisible(false);
    }, 10) as unknown as number; // Use type assertion here
    setTimeoutId(id);
  };

  useEffect(() => {
    return () => {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  const bgColor = `bg-${color}`; // Dynamically set background color

  const clonedChildren = React.Children.map(children, (child) =>
    React.cloneElement(child, {
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
    })
  );

  return (
    <div className="group relative flex">
      {clonedChildren}
      <span
        className={`absolute right-2 bottom-10 transition-all duration-300 rounded ${bgColor} p-2 text-xl text-white ${
          visible ? "scale-100 opacity-100" : "scale-0 opacity-0"
        }`}
      >
        {message}
      </span>
    </div>
  );
}
