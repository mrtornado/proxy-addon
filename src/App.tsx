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
        <div className="absolute top-0 left-0 right-0 h-screen text-white">
          <h1 className="flex justify-center"> YPP IP Changer</h1>
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
        <Tab>Proxy</Tab>
        <Tab>Login</Tab>
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
