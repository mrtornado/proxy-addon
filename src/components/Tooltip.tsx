import React, { useState } from "react";

export default function Tooltip({ message, children }: any) {
  const [visible, setVisible] = useState(false);

  const handleMouseEnter = () => {
    setVisible(true);
    setTimeout(() => {
      setVisible(false);
    }, 2000);
  };

  const handleMouseLeave = () => {
    setVisible(false);
  };

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
        className={`min-w-xs absolute right-2 bottom-10 transition-all duration-300 rounded bg-green-900 p-2 text-xl text-white ${
          visible ? "scale-100 opacity-100" : "scale-0 opacity-0"
        }`}
      >
        {message}
      </span>
    </div>
  );
}
