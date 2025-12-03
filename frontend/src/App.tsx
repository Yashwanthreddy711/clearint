import { Route, Routes } from "react-router-dom";
import Test from "./components/Test";

const App: React.FC = () => {
  return (
  <Routes>
      <Route path="/" element={<Test />} />
    </Routes>
  );
};

export default App;
