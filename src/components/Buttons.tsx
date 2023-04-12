export default function Button(props: any) {
  return (
    <a
      {...props}
      disabled={props.disabled}
      className={`inline-block cursor-pointer px-4 py-2 disabled:(opacity-50 cursor-not-allowed) ${
        props.class ?? ""
      }`}
    >
      {props.children}
    </a>
  );
}

export function DefaultButton(props: any) {
  const activeClass = props.active ? "text-green-600 font-extrabold" : "";

  return (
    <button
      {...props}
      disabled={props.disabled}
      className={`cursor-pointer ml-2 inline-flex items-center justify-center p-0.5 mb-0.5 mt-0.5 mr-2 overflow-hidden text-sm font-medium
       text-gray-900 rounded-lg group bg-gradient-to-br from-green-400 to-blue-600 group-hover:from-green-400
        group-hover:to-blue-600 hover:text-white dark:text-white ${activeClass} ${
        props.className ?? ""
      }`}
    >
      <span className="px-2 py-0.5 duration-75 bg-white dark:bg-gray-900 rounded-md group-hover:bg-opacity-0">
        {props.children}
      </span>
    </button>
  );
}
