import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import "react-tabs/style/react-tabs.css";
import {
  BrowserRouter as Router,
  useNavigate,
  useLocation,
} from "react-router-dom"; // Add these imports
import ProxyForm from "./components/ProxyForm";
import LoginForm from "./components/LoginForm";

function App() {
  return (
    <Router>
      <div className="App">
        <div className="mt-4 text-white">
          <TabsWithRouter />
        </div>
      </div>
    </Router>
  );
}

const TabsWithRouter = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleTabSelect = (index: number) => {
    if (index === 0) {
      navigate("/proxy");
    } else if (index === 1) {
      navigate("/login");
    }
  };

  const selectedIndex = location.pathname === "/login" ? 1 : 0;

  return (
    <Tabs selectedIndex={selectedIndex} onSelect={handleTabSelect}>
      <TabList>
        <Tab>Proxies List</Tab>
        <Tab>YPP Members</Tab>
        <span className="ml-50  text-2xl">
          {" "}
          <a
            className="text-white hover:text-green-500 no-underline"
            href="https://www.yourprivateproxy.com"
            target="_blank"
          >
            {" "}
            <span className="text-red-500">YPP</span>{" "}
            <span className="text-yellow-500">IP</span>{" "}
            <span className="text-blue-500">Changer</span>
          </a>
        </span>
      </TabList>
      <TabPanel>
        <ProxyForm />
      </TabPanel>
      <TabPanel>
        <LoginForm />
      </TabPanel>
    </Tabs>
  );
};

export default App;
