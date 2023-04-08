import ProxyForm from "./components/ProxyForm";

function App() {
  return (
    <div className="App">
      <div className="absolute top-0 left-0 right-0 h-screen bg-dark text-white">
        <h1 className="flex justify-center">
          {" "}
          <a
            target="_blank"
            className=" text-[#fffed8] no-underline hover:text-green-400"
            href="https://www.yourprivateproxy.com"
          >
            {" "}
            Your Private Proxy IP Changer
          </a>
        </h1>
        <ProxyForm />
      </div>
    </div>
  );
}

export default App;
